import { bundleArraySchema, newBundleSchema, type BundleSchema } from "$lib/client/schemas"
import { getScripter } from "$lib/client/supabase"
import { stripe, createPrice, createPriceEx, updatePrice, updateProduct } from "$lib/server/stripe.server"
import { addFreeAccess, cancelFreeAccess, doLogin } from "$lib/server/supabase.server"
import type { Interval } from "$lib/types/collection"
import type { Database } from "$lib/types/supabase"
import { formatError, UUID_V4_REGEX } from "$lib/utils"
import type { SupabaseClient } from "@supabase/supabase-js"
import { error, redirect } from "@sveltejs/kit"
import type Stripe from "stripe"
import { fail, setError, superValidate } from "sveltekit-superforms"
import { zod4 } from "sveltekit-superforms/adapters"

const newPrices = [
	{ amount: 4, currency: "eur", interval: "week" },
	{ amount: 7.5, currency: "eur", interval: "month" },
	{ amount: 50, currency: "eur", interval: "year" }
]

const intervals = ["week", "month", "year"] as const

export const load = async ({ locals: { supabaseServer }, params: { slug }, parent }) => {
	const { scripts, scripter, products, prices, data } = await parent()
	if (scripter.stripe == scripter.id)
		error(
			403,
			"To use this section of the dashboard you need to go through and finish the stripe on-boarding."
		)

	const bundleProducts = products.filter((p) => p.bundle)
	const subs: (typeof data.data)[] = []
	const free: (typeof data.freeData)[] = []

	async function getBundles() {
		const { data: bundleData, error: err } = await supabaseServer
			.schema("scripts")
			.from("bundles")
			.select(`id, name, scripts, author, username`)
			.order("name", { ascending: true })
			.eq("author", slug)

		if (err) {
			error(
				500,
				"Server error, this is probably not an issue on your end!\n" +
					"SELECT scripts.bundles failed!\n\n" +
					formatError(err)
			)
		}

		return await Promise.all(
			bundleData.map(async (bundle) => {
				const product = bundleProducts.find((p) => p.bundle == bundle.id)!
				subs.push(data.data.filter((s) => s.product === product.id))
				free.push(data.freeData.filter((f) => f.product === product.id))

				const productPrices = prices.filter((price) => price.product == product.id)
				if (productPrices.length < 3) {
					intervals.forEach((interval) => {
						const i = productPrices.findIndex((price) => price.interval === interval)
						if (i === -1) {
							productPrices.push({
								active: true,
								amount: 0,
								currency: "eur",
								id: "price_noID",
								interval: interval,
								product: product.id
							})
						}
					})

					productPrices.sort((priceA, priceB) => {
						return (
							intervals.findIndex((p) => p === priceA.interval) -
							intervals.findIndex((p) => p === priceB.interval)
						)
					})
				}

				return {
					id: product.id,
					name: bundle.name,
					author: bundle.author,
					prices: productPrices,
					bundledScripts: scripts.map((script) => ({
						...script,
						active: bundle.scripts.includes(script.id)
					})),
					open: false,
					subsOpen: false,
					freeOpen: false,
					active: product.active
				}
			})
		)
	}

	const bundles = await getBundles()

	const [bundlesForm, newBundleForm] = await Promise.all([
		superValidate({ bundles }, zod4(bundleArraySchema), { id: "bundles" }),
		superValidate({ user_id: slug, prices: newPrices, bundledScripts: scripts }, zod4(newBundleSchema), {
			id: "newbundle",
			errors: false
		})
	])

	return {
		bundlesForm,
		newBundleForm,
		subscriptions: subs,
		freeAccess: free
	}
}

async function createBundleProduct(supabase: SupabaseClient<Database>, bundle: BundleSchema) {
	const scripts = bundle.bundledScripts.reduce((acc: string[], script) => {
		if (script.active) acc.push(script.id)
		return acc
	}, [])

	bundle.prices = bundle.prices.filter((price) => price.amount > 0)

	if (bundle.prices.length === 0) return { message: null }

	const { data, error: err } = await supabase
		.schema("scripts")
		.from("bundles")
		.insert({ name: bundle.name, author: bundle.user_id, scripts: scripts })
		.select()
		.single()

	if (err) {
		console.error(
			`createBundleProduct error on supabase insert with bundle: ${JSON.stringify(bundle)} and error: ${JSON.stringify(err)}`
		)
		return err
	}

	let product: Stripe.Product

	try {
		product = await stripe.products.create({
			name: data.name,
			tax_code: "txcd_10202000",
			metadata: { user_id: data.author, bundle: data.id }
		})
	} catch (err) {
		console.error(
			`createBundleProduct error on stripe.products.create with data: ${JSON.stringify(data)} and error: ${JSON.stringify(err)}`
		)
		return { message: "Failed to create bundle product in Stripe" }
	}

	const stripePromises: Promise<boolean>[] = []

	for (let i = 0; i < bundle.prices.length; i++) {
		const price = bundle.prices[i]
		if (price.amount > 0) {
			stripePromises.push(createPriceEx(product.id, price.amount, price.interval as Interval))
		}
	}

	const results = await Promise.all(stripePromises)
	for (let i = 0; i < results.length; i++) {
		if (!results[i]) return { message: "Failed to create a price" }
	}
	return { message: null }
}

export const actions = {
	bundleEdit: async ({
		request,
		locals: { supabaseServer, user, getProfile },
		url: { origin, searchParams, pathname },
		params: { slug }
	}) => {
		if (!user) return await doLogin(supabaseServer, origin, new URLSearchParams("login&provider=discord"))
		if (!UUID_V4_REGEX.test(slug)) error(403, "Invalid dashboard UUID.")
		if (user.id !== slug) {
			const profile = await getProfile()
			if (profile?.role != "administrator") error(403, "You cannot access another scripter dashboard.")
		}

		const [scripter, form] = await Promise.all([
			getScripter(supabaseServer, slug),
			superValidate(request, zod4(bundleArraySchema))
		])

		if (scripter.stripe == scripter.id) return setError(form, "", "Stripe account is not setup!")
		if (!form.valid) return setError(form, "", "The form is not valid!")

		const productID = searchParams.get("product")

		if (!productID) {
			return setError(
				form,
				"",
				"Something went wrong! Seems like no product was selected. If this keeps occuring please contact support@waspscripts.com"
			)
		}

		const product = form.data.bundles.find((bundle) => bundle.id === productID)

		if (!product) {
			return setError(
				form,
				"",
				"Something went wrong! Seems like the selected bundle product is invalid. If this keeps occuring please contact support@waspscripts.com"
			)
		}

		if (product.bundledScripts.length < 2)
			return setError(form, "", "You need to add at least 2 scripts to a bundle.")

		const { data: productsData, error: errProducts } = await supabaseServer
			.schema("stripe")
			.from("products")
			.select("bundle, name")
			.eq("id", product.id)
			.single()

		if (errProducts) return setError(form, "", formatError(errProducts))
		if (!productsData.bundle) return setError(form, "", "That product is missing a bundle ID!")

		if (product.name !== productsData.name) {
			const updated = await updateProduct(product.id, product.name)
			if (!updated) return setError(form, "", "Failed to update product name!")
		}

		const { data: pricesData, error: errPrices } = await supabaseServer
			.schema("stripe")
			.from("prices")
			.select("id, amount, interval")
			.eq("product", product.id)
			.eq("active", true)

		if (errPrices) return setError(form, "", formatError(errPrices))

		for (let i = 0; i < pricesData.length; i++) {
			const currentPrice = pricesData[i]
			const j = product.prices.findIndex((price) => price.id === currentPrice.id)
			if (j === -1) continue
			const newPrice = product.prices[j]

			const updatePricesPromises = []
			if (Math.round(newPrice.amount * 100) !== currentPrice.amount) {
				updatePricesPromises.push(
					updatePrice({
						active: true,
						amount: newPrice.amount,
						currency: newPrice.currency as "eur" | "usd" | "cad" | "aud",
						id: newPrice.id,
						interval: newPrice.interval as "week" | "month" | "year",
						product: product.id
					})
				)
			}

			const promises = await Promise.all(updatePricesPromises)
			for (let idx = 0; idx < promises.length; idx++) {
				if (!promises[idx]) return setError(form, "", "Failed to update a price!")
			}

			product.prices.splice(j, 1)
		}

		const createPricePromises = []
		for (let i = 0; i < product.prices.length; i++) {
			const currentPrice = product.prices[i]
			const j = pricesData.findIndex((price) => price.interval === currentPrice.interval)
			if (j > -1) {
				pricesData.splice(j, 1)
				continue
			}
			createPricePromises.push(createPrice(currentPrice, product.id))
		}

		const promises = await Promise.all(createPricePromises)
		for (let i = 0; i < promises.length; i++) {
			if (!promises[i]) return setError(form, "", "Failed to create a price.")
		}

		const scripts = product.bundledScripts.reduce((acc: string[], script) => {
			if (script.active) acc.push(script.id)
			return acc
		}, [])

		const { error: err } = await supabaseServer
			.schema("scripts")
			.from("bundles")
			.update({ scripts: scripts })
			.eq("id", productsData.bundle)

		if (err) return setError(form, "", err.message)

		redirect(303, pathname)
	},

	bundleAdd: async ({
		request,
		locals: { supabaseServer, user, getProfile },
		url: { origin, pathname },
		params: { slug }
	}) => {
		if (!user) return await doLogin(supabaseServer, origin, new URLSearchParams("login&provider=discord"))
		if (!UUID_V4_REGEX.test(slug)) error(403, "Invalid dashboard UUID.")

		const [profile, scripter, form] = await Promise.all([
			getProfile(),
			getScripter(supabaseServer, slug),
			superValidate(request, zod4(newBundleSchema))
		])

		if (!profile || !profile.role) error(403, "Invalid profile or role.")
		if (user.id !== slug) {
			if (profile.role != "administrator") error(403, "You cannot access another scripter dashboard.")
		}
		if (scripter.stripe == scripter.id) return setError(form, "", "Stripe account is not setup!")
		if (!form.valid) return setError(form, "", "The form is not valid!")
		if (!["administrator", "moderator"].includes(profile.role)) form.data.user_id = user.id

		const { message: err } = await createBundleProduct(supabaseServer, form.data)

		if (err) return setError(form, "", err)

		redirect(303, pathname)
	},

	addFree: async ({
		request,
		locals: { supabaseServer, user, getProfile },
		url: { origin, searchParams },
		params: { slug }
	}) => {
		if (!user) return await doLogin(supabaseServer, origin, new URLSearchParams("login&provider=discord"))
		if (!UUID_V4_REGEX.test(slug)) error(403, "Invalid dashboard UUID.")
		if (user.id !== slug) {
			const profile = await getProfile()
			if (profile?.role != "administrator") error(403, "You cannot access another scripter dashboard.")
		}

		const product = searchParams.get("product")
		if (!product) error(403, "Product not specified.")

		const data = await request.formData()
		const id = data.get("userid")?.toString()
		if (!id || id === "") error(403, "User ID not specified.")
		if (!UUID_V4_REGEX.test(id)) error(403, "User ID is not a valid UUID.")

		const date_end_str = data.get("enddate")?.toString()
		if (!date_end_str || date_end_str === "") error(403, "End date not specified.")

		const date_end = new Date(date_end_str).toISOString().toLocaleString()
		const err = await addFreeAccess(id, product, date_end)

		if (err) error(403, formatError(err))

		return
	},

	cancelFree: async ({
		locals: { supabaseServer, user, getProfile },
		url: { origin, searchParams },
		params: { slug }
	}) => {
		if (!user) return await doLogin(supabaseServer, origin, new URLSearchParams("login&provider=discord"))
		if (!UUID_V4_REGEX.test(slug)) error(403, "Invalid dashboard UUID.")
		if (user.id !== slug) {
			const profile = await getProfile()
			if (profile?.role != "administrator") error(403, "You cannot access another scripter dashboard.")
		}

		const product = searchParams.get("product")
		if (!product) error(403, "Product not specified.")

		const id = searchParams.get("id")
		if (!id) error(403, "User ID not specified.")
		if (!UUID_V4_REGEX.test(id)) error(403, "User ID is not a valid UUID.")

		const err = await cancelFreeAccess(id, product)
		if (err) error(403, formatError(err))

		return
	},

	cancelSub: async ({
		locals: { supabaseServer, user, getProfile },
		url: { origin, searchParams },
		params: { slug }
	}) => {
		if (!user) return await doLogin(supabaseServer, origin, new URLSearchParams("login&provider=discord"))
		if (!UUID_V4_REGEX.test(slug)) error(403, "Invalid dashboard UUID.")
		if (user.id !== slug) {
			const profile = await getProfile()
			if (profile?.role != "administrator") error(403, "You cannot access another scripter dashboard.")
		}

		const subscription = searchParams.get("subscription")
		if (!subscription) error(403, "Subscription not specified.")

		let success = true

		try {
			await stripe.subscriptions.update(subscription, { cancel_at_period_end: true })
		} catch (err) {
			console.error(err)
			success = false
		}

		if (!success) error(503, "Failed to update subscription on stripe side.")

		const { error: err } = await supabaseServer
			.schema("profiles")
			.from("subscriptions")
			.update({ disabled: true })
			.eq("subscription", subscription)

		if (err)
			fail(503, {
				message:
					"Please contact Torwent and give him this message, Error: " +
					formatError(err) +
					" sub: " +
					subscription
			})

		return { success: true }
	},

	cancelAllSubs: async ({
		locals: { supabaseServer, user, getProfile },
		url: { origin, searchParams },
		params: { slug }
	}) => {
		if (!user) return await doLogin(supabaseServer, origin, new URLSearchParams("login&provider=discord"))
		if (!UUID_V4_REGEX.test(slug)) error(403, "Invalid dashboard UUID.")
		if (user.id !== slug) {
			const profile = await getProfile()
			if (profile?.role != "administrator") error(403, "You cannot access another scripter dashboard.")
		}

		const product = searchParams.get("product")
		if (!product) error(403, "Product not specified.")

		const { data, error: err } = await supabaseServer
			.schema("profiles")
			.from("subscriptions")
			.update({ disabled: true })
			.eq("product", product)
			.select("id")

		if (err) {
			error(
				503,
				"Please contact Torwent and give him this message\n" +
					"Product: " +
					product +
					"\n\n" +
					formatError(err)
			)
		}

		for (let i = 0; i < data.length; i++) {
			try {
				await stripe.subscriptions.update(data[i].id, { cancel_at_period_end: true })
			} catch {
				error(503, "Failed to update subscription: " + data[i].id + " on stripe side.")
			}
		}

		return { success: true }
	}
}
