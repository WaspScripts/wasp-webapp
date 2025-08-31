import { error } from "@sveltejs/kit"
import { formatError } from "$lib/utils"
import { createStripeCustomer } from "$lib/server/stripe.server"

export const POST = async ({ request, locals: { supabaseServer } }) => {
	console.log("💻 Launcher sign up")
	const data = await request.json()
	const access_token = data?.access_token
	const refresh_token = data?.refresh_token

	if (!access_token) error(403, "No access_token received.")
	if (!refresh_token) error(403, "No refresh_token received.")

	const {
		data: { user },
		error: err
	} = await supabaseServer.auth.setSession({ access_token, refresh_token })
	if (err) error(401, formatError(err))
	if (!user) error(401, "Failed to get user.")

	const {
		data: { session }
	} = await supabaseServer.auth.getSession()

	const { count } = await supabaseServer
		.schema("profiles")
		.from("profiles")
		.select("*", { count: "exact", head: true })
		.eq("id", user.id)
		.single()

	if (count) {
		return new Response(
			JSON.stringify({
				success: true,
				access_token: session?.access_token,
				refresh_token: session?.refresh_token
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" }
			}
		)
	}

	if (user.email && user.app_metadata.provider == "discord") {
		const discord = user.user_metadata["provider_id"]
		const stripe = await createStripeCustomer(
			user.id,
			user.email,
			discord,
			user.user_metadata["custom_claims"]["global_name"]
		)
		if (!stripe) error(403, "Failed to create stripe user for " + user.id)

		const { error: err } = await supabaseServer.schema("profiles").from("profiles").insert({
			id: user.id,
			stripe,
			discord,
			username: "",
			avatar: "",
			role: null
		})

		if (err) error(500, "Failed to INSERT profile: " + formatError(err))
	}

	return new Response(
		JSON.stringify({
			success: true,
			access_token: session?.access_token,
			refresh_token: session?.refresh_token
		}),
		{
			status: 200,
			headers: { "Content-Type": "application/json" }
		}
	)
}
