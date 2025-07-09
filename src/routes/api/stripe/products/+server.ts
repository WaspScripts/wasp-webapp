import { STRIPE_WEBHOOOK_SECRET_PRODUCTS } from "$env/static/private"
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
		event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOOK_SECRET_PRODUCTS)
	} catch (err) {
		console.log(err)
		throw error(404, "Event is not valid! Body: " + body + " Error: " + err)
	}

	const { data, type } = event

	interface ProductMetadata {
		user_id: string
		bundle?: string
		script?: string
	}

	switch (type) {
		case "product.deleted": {
			const productDeleted = data.object as Stripe.Product
			console.log("DELETE stripe.products: ", productDeleted.id)

			const { error: err } = await supabaseAdmin
				.schema("stripe")
				.from("products")
				.delete()
				.eq("id", productDeleted.id)

			if (err) {
				error(500, "object: " + JSON.stringify(productDeleted) + "\r\n" + formatError(err))
			}

			break
		}

		case "product.updated": {
			if (!data.previous_attributes || !Object.keys(data.previous_attributes).includes("name"))
				break

			const productUpdated = data.object as Stripe.Product

			console.log("UPDATE stripe.products: ", productUpdated.id)

			const { error: err } = await supabaseAdmin
				.schema("stripe")
				.from("products")
				.update({ name: productUpdated.name })
				.eq("id", productUpdated.id)

			if (err) {
				error(500, "object: " + JSON.stringify(productUpdated) + "\r\n" + formatError(err))
			}

			break
		}

		case "product.created": {
			console.log(data)
			const productCreated = data.object as Stripe.Product
			const { name } = productCreated
			const metadata = productCreated.metadata as unknown as ProductMetadata

			console.log("INSERT stripe.products: ", productCreated.id)
			const { error: err } = await supabaseAdmin
				.schema("stripe")
				.from("products")
				.insert({
					id: productCreated.id,
					bundle: metadata.bundle ?? null,
					script: metadata.script ?? null,
					user_id: metadata.user_id,
					name: name
				})

			if (err) {
				error(500, "object: " + JSON.stringify(productCreated) + "\r\n" + formatError(err))
			}

			break
		}

		default:
			throw error(404, "Product event doesn't have a valid type! Type: " + type)
	}

	return json({
		success: "true"
	})
}
