import type { ScriptSimple } from "$lib/types/collection"
import { formatError, groupBy } from "$lib/utils"
import { error } from "@sveltejs/kit"

export const load = async ({ parent, data }) => {
	const { supabaseClient } = await parent()
	const { subscriptionsform, checkoutForm } = data

	async function getPrices() {
		const { data, error: err } = await supabaseClient
			.schema("stripe")
			.from("prices")
			.select(`id, product, amount, currency, interval, active`)
			.order("product", { ascending: true })
			.order("amount", { ascending: true })

		if (err) {
			error(
				500,
				"Server error, this is probably not an issue on your end!\n" +
					"SELECT stripe.prices failed!\n\n" +
					formatError(err)
			)
		}

		return data
	}

	async function getProducts() {
		const { data, error: err } = await supabaseClient
			.schema("stripe")
			.from("products")
			.select("id, user_id, bundle, script, name, active, username")
			.order("bundle", { ascending: true })
			.order("user_id", { ascending: true })

		if (err) {
			error(
				500,
				"Server error, this is probably not an issue on your end!\n" +
					"SELECT stripe.products failed!\n\n" +
					formatError(err)
			)
		}

		return data
	}

	async function getScripts() {
		const { data, error: err } = await supabaseClient
			.schema("scripts")
			.from("scripts")
			.select(`id, title, url, protected!left (username), metadata!inner (type)`)
			.limit(1, { foreignTable: "protected" })
			.limit(1, { foreignTable: "metadata" })
			.eq("published", true)
			.eq("metadata.type", "premium")
			.order("title", { ascending: true })
			.overrideTypes<ScriptSimple[]>()

		if (err) {
			error(
				500,
				"Server error, this is probably not an issue on your end!\n" +
					"SELECT scripts.scripts failed!\n\n" +
					formatError(err)
			)
		}

		return data
	}

	async function getBundles() {
		const { data, error: err } = await supabaseClient
			.schema("scripts")
			.from("bundles")
			.select(`id, name, scripts, author`)
			.order("name", { ascending: true })

		if (err) {
			error(
				500,
				"Server error, this is probably not an issue on your end!\n" +
					"SELECT scripts.bundles failed!\n\n" +
					formatError(err)
			)
		}

		return data
	}

	const dataPromises = Promise.all([getProducts(), getBundles(), getScripts()])
	dataPromises.catch(() => {})
	const prices = await getPrices()

	async function getData() {
		const [products, bundles, scripts] = await dataPromises

		const pricesByProduct = groupBy(
			prices.filter((price) => price.active),
			(price) => price.product
		)
		const bundlesByID = new Map(bundles.map((bundle) => [bundle.id, bundle]))
		const scriptsByID = new Map(scripts.map((script) => [script.id, script]))

		const bundleProduct = []
		const scriptProduct = []

		for (let i = 0; i < products.length; i++) {
			const product = products[i]

			const productPrices = (pricesByProduct.get(product.id) ?? []).map((price, j) => ({
				id: price.id,
				product: price.product,
				amount: price.amount,
				interval: price.interval,
				currency: price.currency,
				active: j === 0
			}))

			data.checkoutForm.data.products[i] = { id: product.id, prices: productPrices }

			const currentBundle = product.bundle ? bundlesByID.get(product.bundle) : undefined
			if (currentBundle) bundlesByID.delete(currentBundle.id)

			const bundledScripts = currentBundle
				? [...new Set(currentBundle.scripts)].flatMap((id) => scriptsByID.get(id) ?? [])
				: []
			const scriptURL = !currentBundle && product.script ? (scriptsByID.get(product.script)?.url ?? "") : ""

			if (product.bundle) {
				bundleProduct.push({
					index: i,
					id: product.id,
					user_id: product.user_id,
					name: product.name,
					username: Promise.resolve(product.username),
					bundle: product.bundle,
					prices: productPrices,
					scripts: bundledScripts,
					active: product.active && productPrices.length > 0
				})
			} else if (product.script) {
				scriptProduct.push({
					index: i,
					id: product.id,
					user_id: product.user_id,
					name: product.name,
					username: Promise.resolve(product.username),
					url: scriptURL,
					prices: productPrices,
					active: product.active && productPrices.length > 0
				})
			}
		}

		return { bundles: bundleProduct, scripts: scriptProduct }
	}

	return {
		subscriptionsform,
		checkoutForm,
		pageData: getData(),
		prices,
		subscriptions: data.subscriptions,
		freeAccess: data.freeAccess
	}
}
