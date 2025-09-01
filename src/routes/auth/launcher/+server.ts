import { error } from "@sveltejs/kit"
import { formatError } from "$lib/utils"
import { createStripeCustomer } from "$lib/server/stripe.server"
import { supabaseAdmin } from "$lib/server/supabase.server"

export const POST = async ({ request }) => {
	console.log("💻 Launcher sign up")
	const data = await request.json()
	const id = data?.user_id

	if (!id) error(403, "No user_id received.")

	const { count } = await supabaseAdmin
		.schema("profiles")
		.from("profiles")
		.select("*", { count: "exact", head: true })
		.eq("id", id)
		.single()

	if (count) {
		return new Response(
			JSON.stringify({
				success: true
			}),
			{
				status: 200,
				headers: {
					"Content-Type": "application/json",
					"Access-Control-Allow-Origin": "*"
				}
			}
		)
	}

	const {
		data: { user },
		error: getUserErr
	} = await supabaseAdmin.auth.admin.getUserById(id)
	if (!user) {
		console.error("No user with such ID: ", getUserErr)
		error(401, "No user with such ID.")
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

		const { error: err } = await supabaseAdmin.schema("profiles").from("profiles").insert({
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
			success: true
		}),
		{
			status: 200,
			headers: {
				"Content-Type": "application/json",
				"Access-Control-Allow-Origin": "*"
			}
		}
	)
}
