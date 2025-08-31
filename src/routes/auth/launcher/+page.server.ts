import { formatError } from "$lib/utils"
import { createStripeCustomer } from "$lib/server/stripe.server"

export const load = async ({ url: { searchParams }, locals: { launcherSupabase } }) => {
	console.log("💻 Launcher login")

	const err = searchParams.get("error")

	if (err) {
		let message = ""
		message += "<h3>Authentication Error</h3>"
		message += "<p>Error: " + decodeURI(err) + "</p>"

		const description = searchParams.get("error_description")
		if (description) {
			message += "<p>Message: " + decodeURI(description) + "</p>"
			if (description.includes("email"))
				message += "<p>Make sure you have your email linked to discord!</p>"
		}

		return {
			access_token: null,
			refresh_token: null,
			error: message
		}
	}

	const code = searchParams.get("code")

	if (code) {
		const {
			data: { user },
			error: err
		} = await launcherSupabase.auth.exchangeCodeForSession(code)

		if (err) {
			return {
				access_token: null,
				refresh_token: null,
				error: formatError(err)
			}
		}

		if (!user) {
			return {
				access_token: null,
				refresh_token: null,
				error: "Failed to get user!"
			}
		}

		const {
			data: { session },
			error: errSession
		} = await launcherSupabase.auth.getSession()

		if (errSession) {
			return {
				access_token: null,
				refresh_token: null,
				error: formatError(errSession)
			}
		}

		if (!session) {
			return {
				access_token: null,
				refresh_token: null,
				error: "Failed to create session"
			}
		}

		const { count } = await launcherSupabase
			.schema("profiles")
			.from("profiles")
			.select("*", { count: "exact", head: true })
			.eq("id", user.id)
			.single()

		if (count) {
			return {
				access_token: session.access_token,
				refresh_token: session.refresh_token,
				error: null
			}
		}

		if (user.email && user.app_metadata.provider == "discord") {
			const discord = user.user_metadata["provider_id"]
			const stripe = await createStripeCustomer(
				user.id,
				user.email,
				discord,
				user.user_metadata["custom_claims"]["global_name"]
			)
			if (!stripe) {
				return {
					access_token: null,
					refresh_token: null,
					error: "Failed to create stripe user for " + user.id
				}
			}

			const { error: err } = await launcherSupabase.schema("profiles").from("profiles").insert({
				id: user.id,
				stripe,
				discord,
				username: "",
				avatar: "",
				role: null
			})

			if (err) {
				return {
					access_token: null,
					refresh_token: null,
					error: "Failed to INSERT profile: " + formatError(err)
				}
			}
		}

		return {
			access_token: session.access_token,
			refresh_token: session.refresh_token,
			error: null
		}
	}

	return {
		access_token: null,
		refresh_token: null,
		error: "Failed to log you in."
	}
}
