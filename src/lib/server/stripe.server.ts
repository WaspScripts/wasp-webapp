import { STRIPE_KEY } from "$env/static/private"
import type { BundleSchema, NewScriptSchema, PriceSchema } from "$lib/client/schemas"
import type { Interval, Price, Scripter } from "$lib/types/collection"
import type { Database } from "$lib/types/supabase"
import type { SupabaseClient } from "@supabase/supabase-js"
import Stripe from "stripe"


export async function createCustomer(id: string, email: string, discord: string, username: string) {
	let customer: Stripe.Customer

	try {
		customer = await stripe.customers.create({
			email: email,
			name: username,
			metadata: {
				wsid: id,
				discord: discord,
				username: username
			}
		})
	} catch (error) {
		console.error(error)
		return null
	}
	return customer.id
}

export async function createCustomerPortal(customer: string, origin: string) {
	let portal: Stripe.BillingPortal.Session

	try {
		portal = await stripe.billingPortal.sessions.create({
			customer: customer,
			return_url: origin + "/subscriptions"
		})
	} catch (error) {
		console.error(error)
		return null
	}

	return portal.url
}

export async function createCheckoutSession(
	id: string,
	customer: string,
	stripeUser: string | null,
	price: string,
	origin: string
) {
	let session: Stripe.Checkout.Session

	let currency: string = "eur"
	if (stripeUser) {
		try {
			const start = performance.now()
			const stripeAccount = await stripe.accounts.retrieve(stripeUser)
			currency = stripeAccount.default_currency ?? currency
			console.log(`└────🪙 Account currency took ${(performance.now() - start).toFixed(2)} ms to check!`)
		} catch (err: unknown) {
			console.error(err)
			return null
		}
	}

	try {
		const start = performance.now()
		session = await stripe.checkout.sessions.create({
			line_items: [{ price: price, quantity: 1 }],
			customer: customer,
			customer_update: { address: "auto", shipping: "auto" },
			mode: "subscription",
			billing_address_collection: "auto",
			automatic_tax: { enabled: stripeUser == null },
			payment_method_collection: "always",
			allow_promotion_codes: true,
			subscription_data: {
				on_behalf_of: stripeUser ?? undefined,
				application_fee_percent: stripeUser ? (currency === "eur" ? 20 : 22) : undefined,
				transfer_data: stripeUser ? { destination: stripeUser } : undefined,
				metadata: { user_id: id }
			},
			success_url: origin + "/subscriptions/success?session_id={CHECKOUT_SESSION_ID}",
			cancel_url: origin + "/subscriptions/cancel?session_id={CHECKOUT_SESSION_ID}"
		})
		console.log(`└────🛒 Checkout session took ${(performance.now() - start).toFixed(2)} ms to create!`)
	} catch (err: unknown) {
		console.error(err)
		return null
	}

	return session.url
}

export async function createAccount(
	supabase: SupabaseClient,
	baseURL: string,
	scripter: Scripter,
	email: string,
	country: string
) {
	let account: Stripe.Response<Stripe.Account>
	let accountLink: Stripe.Response<Stripe.AccountLink>

	const profile = scripter.profiles
	const requested = { requested: true }
	const params: Stripe.AccountCreateParams = {
		controller: {
			fees: { payer: "application" },
			losses: { payments: "application" },
			stripe_dashboard: { type: "express" },
			requirement_collection: "stripe"
		},
		email: email,
		country: country,
		business_type: "individual",
		business_profile: {
			mcc: "5734",
			name: profile.username,
			url: "https://waspscripts.dev/",
			support_url: "https://waspscripts.dev/",
			support_email: "support@waspscripts.com"
		},
		individual: { full_name_aliases: [profile.username, scripter.id, profile.discord] },
		capabilities: { card_payments: requested, link_payments: requested, transfers: requested },
		settings: {
			payouts: {
				schedule: { interval: "monthly", delay_days: 15, monthly_anchor: 31 },
				statement_descriptor: "waspscripts.dev",
				debit_negative_balances: false
			}
		},
		metadata: { id: scripter.id, discord: profile.discord, email: email }
	}

	try {
		account = await stripe.accounts.create(params)
	} catch (err) {
		console.error(err)
		return
	}

	const { error: err } = await supabase
		.schema("profiles")
		.from("scripters")
		.update({ stripe: account.id })
		.eq("id", scripter.id)

	if (err) {
		console.error(err)
		return
	}

	try {
		accountLink = await stripe.accountLinks.create({
			account: account.id,
			refresh_url: baseURL + "/api/stripe/connect/reauth",
			return_url: baseURL + "/api/stripe/connect/return",
			type: "account_onboarding"
		})
	} catch (err) {
		console.error(err)
		return
	}

	return accountLink.url
}

export async function getOnboardingLink(baseURL: string, scripter: Scripter) {
	let accountLink: Stripe.Response<Stripe.AccountLink>

	try {
		accountLink = await stripe.accountLinks.create({
			account: scripter.stripe,
			refresh_url: baseURL + "/api/stripe/connect/reauth",
			return_url: baseURL + "/api/stripe/connect/return",
			type: "account_onboarding"
		})
	} catch (err) {
		console.error(err)
		return
	}

	return accountLink.url
}

export async function getAccount(scripter: Scripter) {
	if (scripter.id == scripter.stripe) return null
	let account: Stripe.Account | null = null

	try {
		account = await stripe.accounts.retrieve(scripter.stripe)
	} catch (error) {
		console.error("An error occurred when calling the Stripe API to create an account session", error)
	}

	return account
}

export async function getLoginLink(scripter: Scripter) {
	const account = await getAccount(scripter)
	if (!account) return null

	if (account.requirements?.currently_due && account.requirements.currently_due.length > 0) return null

	let link: Stripe.Response<Stripe.LoginLink> | null = null

	try {
		link = await stripe.accounts.createLoginLink(account.id)
	} catch (error) {
		console.error("An error occurred when calling the Stripe API to create an account login link", error)
	}

	return link?.url ?? null
}

export async function updateAccountDBA(id: string, dba: string) {
	try {
		await stripe.accounts.update(id, { business_profile: { name: dba } })
	} catch (error) {
		console.error("An error occurred when calling the Stripe API to create an account session", error)
		return false
	}

	return true
}

export async function updateProduct(id: string, name: string) {
	try {
		await stripe.products
			.update(id, {
				name: name
			})
			.catch((err: unknown) => console.error(err))
	} catch (err) {
		console.error(err)
	}
}

async function createPriceEx(product: string, amount: number, interval: Interval) {
	if (amount === 0) return
	await stripe.prices
		.create({
			unit_amount: Math.round(amount * 100),
			currency: "eur",
			active: true,
			product: product,
			recurring: { interval: interval }
		})
		.catch((err: unknown) => console.error(err))
}

export async function createPrice(price: PriceSchema, product: string) {
	if (price.amount === 0) return
	await stripe.prices
		.create({
			unit_amount: Math.round(price.amount * 100),
			currency: price.currency,
			active: true,
			product: product,
			recurring: { interval: price.interval as Interval }
		})
		.catch((err: unknown) => console.error(err))
}

export async function updatePrice(price: Price) {
	const promises = []
	if (price.amount > 0)
		promises.push(
			stripe.prices
				.create({
					unit_amount: Math.round(price.amount * 100),
					currency: "eur",
					active: true,
					product: price.product,
					recurring: { interval: price.interval as Interval }
				})
				.catch((err) => console.error(err))
		)
	promises.push(stripe.prices.update(price.id, { active: false }))

	await Promise.all(promises)
}

export async function createBundleProduct(supabase: SupabaseClient<Database>, bundle: BundleSchema) {
	const scripts = bundle.bundledScripts.reduce((acc: string[], script) => {
		if (script.active) acc.push(script.id)
		return acc
	}, [])

	bundle.prices = bundle.prices.filter((price) => price.amount > 0)

	if (bundle.prices.length === 0) return

	const { data, error: err } = await supabase
		.schema("scripts")
		.from("bundles")
		.insert({ name: bundle.name, author: bundle.user_id, scripts: scripts })
		.select()
		.single()

	if (err) {
		console.error(err)
		return err
	}

	const product = await stripe.products
		.create({
			name: data.name,
			tax_code: "txcd_10202000",
			metadata: { user_id: data.author, bundle: data.id }
		})
		.catch((err: unknown) => console.error(err))

	if (!product) return { message: "Failed to create bundle product in Stripe" }

	const stripePromises: Promise<void>[] = []

	bundle.prices.forEach((price) => {
		if (price.amount) {
			stripePromises.push(createPriceEx(product.id, price.amount, price.interval as Interval))
		}
	})

	await Promise.all(stripePromises)
}

export async function createScriptProduct(script: NewScriptSchema, name: string, user_id: string) {
	script.prices = script.prices.filter((price) => price.amount > 0)
	if (script.prices.length === 0) return

	const product = await stripe.products
		.create({
			name: name,
			tax_code: "txcd_10202000",
			metadata: { user_id: user_id, script: script.id }
		})
		.catch((err: unknown) => console.error(err))

	if (!product) return { message: "Failed to create script product in Stripe" }

	const stripePromises: Promise<void>[] = []

	script.prices.forEach((price) => {
		if (price.amount) {
			stripePromises.push(createPriceEx(product.id, price.amount, price.interval as Interval))
		}
	})

	await Promise.all(stripePromises)
}
