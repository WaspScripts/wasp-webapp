import type { ProductData, ScriptSimple } from "$lib/types/collection"
import { formatError } from "$lib/utils"
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
			.select(`id, title, url, protected!left (username), metadata!left (type)`)
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

	const prices = await getPrices()

	async function getData() {
		const promises = await Promise.all([getProducts(), getBundles(), getScripts()])
		const tmpPrices = [...prices]
		const products = promises[0]
		const bundles = promises[1]
		const scripts = promises[2]

		const bundleProduct = []
		const scriptProduct = []

		for (let i = 0; i < products.length; i++) {
			const product = products[i]

			const productPrices = []
			let currentBundle
			const bundledScripts = []
			let scriptURL: string = ""

			for (let j = 0; j < tmpPrices.length; j++) {
				if (!tmpPrices[j].active || tmpPrices[j].product !== product.id) continue

				productPrices.push({
					id: tmpPrices[j].id,
					product: tmpPrices[j].product,
					amount: tmpPrices[j].amount,
					interval: tmpPrices[j].interval,
					currency: tmpPrices[j].currency,
					active: productPrices.length === 0
				})

				tmpPrices.splice(j, 1)
				j--
			}

			for (let j = 0; j < bundles.length; j++) {
				if (bundles[j].id !== product.bundle) continue
				currentBundle = bundles[j]
				bundles.splice(j, 1)
				break
			}

			data.checkoutForm.data.products[i] = { id: product.id, prices: productPrices }

			const tmpScripts = [...scripts]

			if (currentBundle) {
				for (let l = 0; l < currentBundle.scripts.length; l++) {
					for (let j = 0; j < tmpScripts.length; j++) {
						if (currentBundle.scripts[l] !== tmpScripts[j].id) continue
						bundledScripts.push(tmpScripts[j])
						tmpScripts.splice(j, 1)
						j--
						break
					}
					currentBundle.scripts.splice(l, 1)
					l--
				}
			} else {
				for (let j = 0; j < tmpScripts.length; j++) {
					if (product.script !== tmpScripts[j].id) continue
					scriptURL = tmpScripts[j].url as string
					tmpScripts.splice(j, 1)
					j--
					break
				}
			}

			if (product.bundle) {
				bundleProduct.push({
					index: i,
					id: product.id,
					user_id: product.user_id,
					name: product.name,
					username: product.username,
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
					username: product.username,
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
		pageData: await getData(),
		prices,
		subscriptions: data.subscriptions,
		freeAccess: data.freeAccess
	}
}
