import { STRIPE_WEBHOOK_SECRET_DISPUTES } from "$env/static/private"
import { stripe } from "$lib/server/stripe.server"
import { supabaseAdmin } from "$lib/server/supabase.server"
import { formatError } from "$lib/utils"
import { webhookError } from "$lib/server/webhooks.server"
import { json } from "@sveltejs/kit"
import type Stripe from "stripe"

export const POST = async ({ request }) => {
	const sig = request.headers.get("stripe-signature") ?? ""
	let event: Stripe.Event

	const body = await request.text()

	try {
		event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET_DISPUTES)
	} catch (err) {
		webhookError(404, "Event is not valid!", { err: err instanceof Error ? err.message : err })
	}

	const { data, type } = event

	if (type !== "charge.dispute.closed")
		webhookError(404, "Dispute event doesn't have a valid type!", { type })

	const dispute = data.object as Stripe.Dispute
	if (dispute.status != "lost") return json({ success: "true" })

	console.log("Lost dispute: ", dispute.id)

	const { balance_transactions: transactions, charge: chargeID } = dispute

	const charge = await stripe.charges.retrieve(chargeID as string)
	if (!charge.on_behalf_of) return json({ success: "true" })

	const account = charge.on_behalf_of as string

	const urlBase = "https://api.fxratesapi.com/latest?base=eur&"
	const urlTail = "&resolution=1m&amount=1&places=6&format=json"

	let currencies = "currencies="
	const values = []
	const symbols = new Set()

	for (let i = 0; i < transactions.length; i++) {
		const { net, currency } = transactions[i]
		if (net >= 0) continue

		symbols.add(currency)
		values.push({ currency, amount: Math.abs(net + Math.round(net * 0.014)) }) //add debit fee
	}

	currencies += [...symbols].join(",")
	const url = urlBase + currencies + urlTail

	let requestData

	try {
		const response = await fetch(url)
		requestData = await response.json()
	} catch (e) {
		webhookError(500, "Failed to fetch exchange rates", { url, e })
	}

	let amount = 0
	for (let i = 0; i < values.length; i++) {
		const rate = requestData.rates[values[i].currency]
		if (!rate) webhookError(500, "No exchange rate for currency", { currency: values[i].currency })
		amount += values[i].amount / rate
	}

	const { data: updated, error: errUpdate } = await supabaseAdmin
		.schema("profiles")
		.rpc("add_balance", { account, amount: Math.round(amount) })

	if (errUpdate) {
		webhookError(500, "Failed to UPDATE profiles.balances", { account, err: formatError(errUpdate) })
	}

	if (!updated) webhookError(500, "No profiles.balances row for account", { account })

	return json({ success: "true" })
}
