import { error, redirect } from "@sveltejs/kit"
import { formatError } from "$lib/utils"
import { safePath, LOGIN_REDIRECT_COOKIE, supabaseAdmin } from "$lib/server/supabase.server"
import { createCustomer } from "$lib/server/stripe.server"

export const GET = async ({ url: { origin, searchParams }, cookies, locals: { supabaseServer } }) => {
	console.log("💻 Logging in")
	const err = searchParams.get("error")

	const takeLoginRedirect = () => {
		const path = cookies.get(LOGIN_REDIRECT_COOKIE)
		cookies.delete(LOGIN_REDIRECT_COOKIE, { path: "/" })
		return (path && safePath(path, origin)) ?? "/"
	}

	if (err) {
		let message = ""
		message += "<h3>Authentication Error</h3>"
		message += "<p>Error: " + decodeURI(err) + "</p>"

		const description = searchParams.get("error_description")
		if (description) {
			message += "<p>Message: " + decodeURI(description) + "</p>"
			if (description.includes("email")) message += "<p>Make sure you have your email linked to discord!</p>"
		}

		error(401, message)
	}

	const code = searchParams.get("code")
	if (code) {
		const {
			data: { user },
			error: err
		} = await supabaseServer.auth.exchangeCodeForSession(code)
		if (err) error(401, formatError(err))
		if (!user) error(401, "Failed to get user.")

		const { count } = await supabaseServer
			.schema("profiles")
			.from("profiles")
			.select("*", { count: "exact", head: true })
			.eq("id", user.id)
			.single()

		if (count) redirect(303, takeLoginRedirect())

		const discord = user.identities?.find((identity) => identity.provider === "discord")?.id
		if (user.email && discord) {
			const stripe = await createCustomer(
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
	}

	redirect(303, takeLoginRedirect())
}
