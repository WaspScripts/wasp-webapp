import { STRIPE_WEBHOOK_SECRET_SUBSCRIPTIONS } from "$env/static/private"
import { stripe } from "$lib/server/stripe.server"
import { supabaseAdmin } from "$lib/server/supabase.server"
import { formatError } from "$lib/utils"
import { error, json } from "@sveltejs/kit"
import type Stripe from "stripe"

export const POST = async ({ request }) => {
	const sig = request.headers.get("stripe-signature") ?? ""
	let event: Stripe.Event

	const body = await request.text()

	try {
		event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET_SUBSCRIPTIONS)
	} catch (err) {
		console.log(err)
		error(404, "Event is not valid! Body: " + body + " Error: " + err)
	}

	const { data, type } = event

	console.log(type)

	switch (type) {
		case "customer.subscription.created": {
			const subscriptionCreated = data.object as Stripe.Subscription
			if (subscriptionCreated.status !== "active") break
			console.log("INSERT profile.subscriptions: ", subscriptionCreated.id)

			const { error: err } = await supabaseAdmin
				.schema("profiles")
				.from("subscriptions")
				.insert({
					id: subscriptionCreated.id,
					user_id: subscriptionCreated.metadata.wsid,
					product: subscriptionCreated.items.data[0].price.product.toString(),
					price: subscriptionCreated.items.data[0].price.id,
					date_end: new Date(subscriptionCreated.cancel_at! * 1000).toISOString(),
					date_start: new Date(subscriptionCreated.start_date * 1000).toISOString(),
					cancel: subscriptionCreated.cancel_at_period_end,
					disabled: false
				})

			if (err) {
				error(500, "object: " + JSON.stringify(subscriptionCreated) + "\r\n" + formatError(err))
			}

			break
		}

		case "customer.subscription.updated": {
			const subscriptionUpdated = data.object as Stripe.Subscription
			if (subscriptionUpdated.status !== "active" && subscriptionUpdated.status !== "canceled")
				break

			console.log("UPDATE profile.subscription: ", subscriptionUpdated.id)

			const date_end = new Date(subscriptionUpdated.cancel_at! * 1000).toISOString()
			const date_start = new Date(subscriptionUpdated.start_date * 1000).toISOString()
			const cancel = subscriptionUpdated.cancel_at_period_end

			const { error: err } = await supabaseAdmin
				.schema("profiles")
				.from("subscriptions")
				.update({
					date_end: date_end,
					date_start: date_start,
					cancel: cancel
				})
				.eq("id", subscriptionUpdated.id)

			if (err) {
				error(500, "object: " + JSON.stringify(subscriptionUpdated) + "\r\n" + formatError(err))
			}

			break
		}

		case "customer.subscription.deleted": {
			const subscriptionDeleted = data.object as Stripe.Subscription
			console.log("DELETE profile.subscriptions: ", subscriptionDeleted.id)

			const date_end = new Date(subscriptionDeleted.canceled_at! * 1000).toISOString()
			const date_start = new Date(subscriptionDeleted.start_date * 1000).toISOString()
			const cancel = subscriptionDeleted.cancel_at_period_end

			const { error: err } = await supabaseAdmin
				.schema("profiles")
				.from("subscriptions")
				.update({ date_end: date_end, date_start: date_start, cancel: cancel })
				.eq("id", subscriptionDeleted.id)

			if (err) {
				error(500, "object: " + JSON.stringify(subscriptionDeleted) + "\r\n" + formatError(err))
			}

			const invoice = subscriptionDeleted.latest_invoice
			if (invoice) {
				try {
					stripe.invoices.voidInvoice(invoice.toString())
				} catch (err) {
					console.error(err)
					error(
						404,
						"Failed to void invoce: " +
							invoice +
							" for sub: " +
							subscriptionDeleted.id +
							"  Error: " +
							err
					)
				}
			}
			break
		}

		default:
			error(404, "Subscription event doesn't have a valid type! Type: " + type)
	}

	return json({ success: "true" })
}
