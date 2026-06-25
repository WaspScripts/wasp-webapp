import { STRIPE_KEY } from "$env/static/private"
import type { PriceSchema } from "$lib/client/schemas"
import type { Interval, Price } from "$lib/types/collection"
import Stripe from "stripe"

export const stripe = new Stripe(STRIPE_KEY, { apiVersion: "2026-03-25.dahlia", typescript: true })

export async function createCustomer(id: string, email: string, discord: string, username: string) {
	try {
		const customer = await stripe.customers.create({
			email: email,
			name: username,
			metadata: { wsid: id, discord: discord, username: username }
		})
		return customer.id
	} catch (err) {
		console.error("createCustomer error on stripe.customers.create: " + JSON.stringify(err))
		return null
	}
}

export async function createCheckoutSession(
	id: string,
	customer: string,
	stripeID: string | null,
	price: string,
	origin: string
) {
	let currency: string = "eur"
	if (stripeID) {
		try {
			const start = performance.now()
			const stripeAccount = await stripe.accounts.retrieve(stripeID)
			currency = stripeAccount.default_currency ?? currency
			console.log(`└────🪙 Account currency took ${(performance.now() - start).toFixed(2)} ms to check!`)
		} catch (err) {
			console.error("createCheckoutSession error on stripe.accounts.retrieve: " + JSON.stringify(err))
			return null
		}
	}

	const start = performance.now()
	try {
		const session = await stripe.checkout.sessions.create({
			line_items: [{ price, quantity: 1 }],
			customer,
			customer_update: { address: "auto", shipping: "auto" },
			mode: "subscription",
			billing_address_collection: "auto",
			automatic_tax: { enabled: true },
			payment_method_collection: "always",
			allow_promotion_codes: true,
			subscription_data: {
				on_behalf_of: undefined,
				application_fee_percent: stripeID ? (currency === "eur" ? 20 : 22) : undefined,
				transfer_data: stripeID ? { destination: stripeID } : undefined,
				metadata: { user_id: id },
				billing_mode: { type: "flexible" }
			},
			success_url: origin + "/subscriptions/success?session_id={CHECKOUT_SESSION_ID}",
			cancel_url: origin + "/subscriptions/cancel?session_id={CHECKOUT_SESSION_ID}"
		})
		console.log(`└────🛒 Checkout session took ${(performance.now() - start).toFixed(2)} ms to create!`)
		return session.url
	} catch (err) {
		console.error("createCheckoutSession error on stripe.checkout.sessions.create: " + JSON.stringify(err))
		return null
	}
}

export async function updateProduct(id: string, name: string) {
	try {
		await stripe.products.update(id, {
			name: name
		})
		return true
	} catch (err) {
		console.error("updateProduct error on stripe.products.update: " + JSON.stringify(err))
		return false
	}
}

export async function createPriceEx(product: string, amount: number, interval: Interval) {
	if (amount === 0) return true

	try {
		await stripe.prices.create({
			unit_amount: Math.round(amount * 100),
			currency: "eur",
			active: true,
			product: product,
			recurring: { interval: interval }
		})
		return true
	} catch (err) {
		console.error(
			`createPriceEx error: ${product} with amount: ${amount}, interval: ${interval} and error: ${JSON.stringify(err)}`
		)
		return false
	}
}

export async function createPrice(price: PriceSchema, product: string) {
	if (price.amount === 0) return true

	try {
		await stripe.prices.create({
			unit_amount: Math.round(price.amount * 100),
			currency: price.currency,
			active: true,
			product: product,
			recurring: { interval: price.interval as Interval }
		})
	} catch (err) {
		console.error(
			`createPrice error for product: ${product} with price: ${JSON.stringify(price)} and error: ${JSON.stringify(err)}`
		)
		return false
	}

	return true
}

export async function updatePrice(price: Price) {
	const promises = []
	if (price.amount > 0) {
		const createResult = stripe.prices
			.create({
				unit_amount: Math.round(price.amount * 100),
				currency: "eur",
				active: true,
				product: price.product,
				recurring: { interval: price.interval as Interval }
			})
			.then(() => true)
			.catch((err) => {
				console.error(
					`updatePrice error on stripe.prices.create: ${JSON.stringify(price)} and error: ${JSON.stringify(err)}`
				)
				return false
			})
		promises.push(createResult)
	}

	const updateResult = stripe.prices
		.update(price.id, { active: false })
		.then(() => true)
		.catch((err) => {
			console.error(
				`updatePrice error on stripe.prices.update: ${JSON.stringify(price)} and error: ${JSON.stringify(err)}`
			)
			return false
		})

	promises.push(updateResult)

	const results = await Promise.all(promises)

	for (let i = 0; i < 2; i++) {
		if (!results[i]) return false
	}
	return true
}
