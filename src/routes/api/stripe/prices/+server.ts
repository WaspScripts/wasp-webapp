import { STRIPE_WEBHOOK_SECRET_PRICES } from "$env/static/private"
import { stripe } from "$lib/server/stripe.server"
import { supabaseAdmin } from "$lib/server/supabase.server.js"
import { formatError } from "$lib/utils"
import { error, json } from "@sveltejs/kit"
import type Stripe from "stripe"

export const POST = async ({ request }) => {
	const sig = request.headers.get("stripe-signature") ?? ""
	let event: Stripe.Event

	const body = await request.text()

	try {
		event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET_PRICES)
	} catch (err) {
		console.log(err)
		throw error(404, "Event is not valid! Body: " + body + " Error: " + err)
	}

	const { data, type } = event

	switch (type) {
		case "price.deleted": {
			const priceDeleted = data.object as Stripe.Price
			console.log("DELETE stripe.prices: ", priceDeleted.id)

			const { error: err } = await supabaseAdmin
				.schema("stripe")
				.from("prices")
				.delete()
				.eq("id", priceDeleted.id)

			if (err) {
				error(500, "object: " + JSON.stringify(priceDeleted) + "\r\n" + formatError(err))
			}

			break
		}

		case "price.updated": {
			const priceUpdated = data.object as Stripe.Price

			console.log("UPDATE stripe.prices: ", priceUpdated.id)
			const { error: err } = await supabaseAdmin
				.schema("stripe")
				.from("prices")
				.update({
					amount: priceUpdated.unit_amount ?? 100,
					interval: priceUpdated.recurring?.interval as "week" | "month" | "year" | undefined,
					currency: priceUpdated.currency as "eur" | "usd" | "cad" | "aud" | undefined,
					active: priceUpdated.active
				})
				.eq("id", priceUpdated.id)

			if (err) {
				error(500, "object: " + JSON.stringify(priceUpdated) + "\r\n" + formatError(err))
			}

			break
		}

		case "price.created": {
			const priceCreated = data.object as Stripe.Price
			console.log("INSERT stripe.prices: ", priceCreated.id)

			const { error: err } = await supabaseAdmin
				.schema("stripe")
				.from("prices")
				.insert({
					id: priceCreated.id,
					product: priceCreated.product.toString(),
					amount: priceCreated.unit_amount ?? 100,
					interval: priceCreated.recurring?.interval as "week" | "month" | "year" | undefined,
					currency: priceCreated.currency as "eur" | "usd" | "cad" | "aud" | undefined,
					active: priceCreated.active
				})

			if (err) {
				error(500, "object: " + JSON.stringify(priceCreated) + "\r\n" + formatError(err))
			}

			break
		}

		default:
			throw error(404, "Price event doesn't have a valid type! Type: " + type)
	}

	return json({
		success: "true"
	})
}
