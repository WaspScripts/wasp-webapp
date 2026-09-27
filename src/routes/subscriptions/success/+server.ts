import { error, redirect } from "@sveltejs/kit"
import { stripe } from "$lib/server/stripe.server"

export const GET = async ({ url: { searchParams }, locals: { user, getProfile } }) => {
	const sessionID = searchParams.get("session_id")

	if (!user) error(403, "You need to be logged in.")

	if (!sessionID) {
		console.error("Checkout session id not found. params: " + searchParams.toString())
		error(
			403,
			"Something went wrong during checkout! If you got charged please send an email to support@waspscripts.com"
		)
	}

	console.log("Checkout ", sessionID, " was successful!")

	const session = await stripe.checkout.sessions.retrieve(sessionID)

	const profile = await getProfile()
	if (!profile || session.customer !== profile.stripe) {
		console.error(
			"Checkout session " + sessionID + " customer " + session.customer + " does not match user " + user.id
		)
		error(403, "This checkout session does not belong to your account.")
	}

	if (session.status !== "complete") {
		console.error("Checkout session " + sessionID + " status is not complete!")
		error(402, "The payment seem to have failed! If you got charges please contact support@waspscripts.com")
	}

	console.log("Checkout session ", sessionID, " status is complete!")
	if (session.mode === "subscription") {
		if (!session.subscription) {
			console.error("Checkout session " + sessionID + " subscription missing!")
			error(
				403,
				"Something went wrong retrieving your subscription! If you got charged please send an email to support@waspscripts.com"
			)
		}
	} else if (session.mode === "payment") {
		console.error("Checkout session " + sessionID + " is a single time payment which is not implemented yet!")
		error(403, "NOT IMPLEMENTED YET!")
	}

	redirect(303, "/subscriptions")
}
