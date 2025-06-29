import { error, redirect } from "@sveltejs/kit"
import { formatError } from "$lib/utils"
import {
	getPrivateProfile,
	insertUserProfile,
	updateCustomerID
} from "$lib/server/supabase.server.js"
import { createStripeCustomer } from "$lib/server/stripe.server.js"

export const GET = async ({ url: { searchParams }, locals: { supabaseServer, getProfile } }) => {
	console.log("💻 Logging in")
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

		error(401, message)
	}

	const code = searchParams.get("code")
	if (code) {
		const { error: err } = await supabaseServer.auth.exchangeCodeForSession(code)
		if (err) error(401, formatError(err))
		const profile = await getProfile()

		if (profile) redirect(303, searchParams.get("path") ?? "/")

		const {
			data: { user }
		} = await supabaseServer.auth.getUser()

		if (user && user.email && user.app_metadata.provider == "discord") {
			const discord = user.user_metadata["provider_id"]
			const stripe = await createStripeCustomer(
				user.id,
				user.email,
				discord,
				user.user_metadata["custom_claims"]["global_name"]
			)
			if (!stripe) error(403, "Failed to create stripe user for " + user.id)
			await insertUserProfile(user.id, stripe, discord)
		}
	}

	redirect(303, searchParams.get("path") ?? "/")
}
