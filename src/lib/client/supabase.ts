import type { ProfileRole, Script, Scripter, SimpleScripter, StatsTotal } from "$lib/types/collection"
import type { Database } from "$lib/types/supabase"
import { UUID_V4_REGEX, formatError } from "$lib/utils"
import type { SupabaseClient } from "@supabase/supabase-js"
import { error } from "@sveltejs/kit"
import { persisted } from "svelte-persisted-store"
import { get } from "svelte/store"

interface CachedStatsTotal {
	data: StatsTotal
	timestamp: number
}

interface CachedScript {
	data: Script
	timestamp: number
}

interface CachedScripters {
	data: SimpleScripter[]
	timestamp: number
}

let statsTotal: CachedStatsTotal | null = null
const scripts: Map<string, CachedScript> = new Map()

export async function getStatsTotal(supabase: SupabaseClient) {
	const now = Date.now()
	if (statsTotal && now - statsTotal.timestamp < 60 * 60 * 1000) {
		return statsTotal.data
	}

	const { data, error: err } = await supabase
		.schema("stats")
		.from("totals")
		.select("*")
		.limit(1)
		.single<StatsTotal>()

	if (err) {
		error(
			500,
			"Server error, this is probably not an issue on your end!\n" +
				"SELECT stats.totals postgres function failed!\n\n" +
				formatError(err)
		)
	}

	statsTotal = { data, timestamp: now }
	return data
}

export function canEdit(id: string | null | undefined, role: ProfileRole, author: string | null | undefined) {
	if (!id || !role || !author) return false
	if (["administrator", "moderator"].includes(role)) return true
	return id === author
}

export async function getScripter(supabase: SupabaseClient<Database>, slug: string) {
	const { data, error: err } = await supabase
		.schema("profiles")
		.from("scripters")
		.select(
			`id, stripe, realname, description, content, url, github, paypal, content, profiles (username, discord, avatar)`
		)
		.eq(UUID_V4_REGEX.test(slug) ? "id" : "url", slug)
		.single<Scripter>()

	if (err) {
		error(
			500,
			"Server error, this is probably not an issue on your end!\n" +
				"SELECT profiles.scripters failed!\n\n" +
				"Slug: " +
				slug +
				"\n" +
				formatError(err)
		)
	}

	return data
}

export class WaspScripters {
	static #CACHE_MAX_AGE = 60 * 1000
	static #persistedStore = persisted("wasp_random_scripters", {
		scripters: null as CachedScripters | null
	})

	static async #fetchRandomScripters(supabase: SupabaseClient) {
		const start = performance.now()
		const { data, error: err } = await supabase
			.schema("profiles")
			.from("random_scripters")
			.select(`url, profiles!inner (username)`)
			.limit(5)
			.limit(1, { foreignTable: "profiles" })
			.order("id", { ascending: true })
			.overrideTypes<SimpleScripter[]>()

		console.log(`└──💻 5 Random scripters loaded in ${(performance.now() - start).toFixed(2)} ms!`)
		if (err) {
			console.error(err)
			return []
		}

		return data
	}

	static async getRandomScripters(supabase: SupabaseClient) {
		const now = Date.now()
		const store = get(this.#persistedStore)

		if (store.scripters && now - store.scripters.timestamp < this.#CACHE_MAX_AGE) {
			return store.scripters.data
		}

		const data = await this.#fetchRandomScripters(supabase)
		if (data.length > 0) {
			store.scripters = { data, timestamp: now }
			this.#persistedStore.set(store)
		}
		return data
	}
}

export async function fetchScriptByID(supabase: SupabaseClient<Database>, id: string) {
	const { data, error } = await supabase
		.schema("scripts")
		.from("scripts")
		.select(
			`id, title, description, content, url, published,
			protected!left (author, revision, username, avatar, updated_at),
			metadata!left (status, type, categories)`
		)
		.eq("id", id)
		.single()
		.overrideTypes<Script>()

	if (error) {
		console.error(error)
		return null
	}

	return data
}

export async function scriptExists(
	supabase: SupabaseClient<Database>,
	slug: string,
	isUUID: boolean | null = null
) {
	if (scripts.has(slug)) return true

	console.log("💥 Fetching script " + slug)
	const { data, error: err } = await supabase
		.schema("scripts")
		.from("scripts")
		.select(
			`id, url, title, description, content, published,
			protected!protected_id_fkey (author, revision, updated_at)`
		)
		.eq((isUUID == null && UUID_V4_REGEX.test(slug)) || isUUID ? "id" : "url", slug)
		.single()
		.overrideTypes<Script>()

	if (err) return false

	scripts.set(slug, { data, timestamp: Date.now() })
	return true
}

export async function canDownload(
	supabase: SupabaseClient<Database>,
	role: ProfileRole,
	script_id: string | null
) {
	if (!script_id) return false
	if (role && ["administrator", "moderator", "tester"].includes(role)) return true

	const { data } = await supabase
		.schema("profiles")
		.rpc("can_access", { script_id: script_id })
		.overrideTypes<boolean>()

	return data ?? false
}

export async function getSignedURL(
	supabase: SupabaseClient<Database>,
	bucket: string,
	path: string,
	file: string
) {
	path += "/" + file

	const { data, error: err } = await supabase.storage.from(bucket).createSignedUrl(path, 10)

	if (err) {
		error(
			501,
			"Server error, this is probably not an issue on your end!\n" +
				"Get sign url for " +
				bucket +
				" to " +
				path +
				" failed!\n\n" // +
			//TODO: formatError(err)
		)
	}

	return data.signedUrl
}

async function getPrices(supabase: SupabaseClient<Database>, product: string) {
	console.log("💸 Fetching prices for ", product)
	const { data, error: err } = await supabase
		.schema("stripe")
		.from("prices")
		.select(`id, product, amount, currency, interval, active`)
		.eq("product", product)
		.eq("active", true)
		.order("amount", { ascending: true })

	if (err) {
		error(
			500,
			"Server error, this is probably not an issue on your end!\n" +
				"SELECT scripts.prices failed!\n\n" +
				formatError(err)
		)
	}

	for (let i = 1; i < data.length; i++) data[i].active = false
	return data
}

async function getBundles(supabase: SupabaseClient<Database>, script: string) {
	const { data, error: err } = await supabase
		.schema("scripts")
		.from("bundles")
		.select(`id`)
		.contains("scripts", [script])

	if (err) {
		throw error(
			500,
			"Server error, this is probably not an issue on your end!\n" +
				"SELECT scripts.bundles failed!\n\n" +
				formatError(err)
		)
	}

	return data.map((bundle) => bundle.id)
}

export async function getProducts(supabase: SupabaseClient<Database>, script: string) {
	const bundles = await getBundles(supabase, script)

	const scriptQuery = supabase
		.schema("stripe")
		.from("products")
		.select(`id, name`)
		.eq("active", true)
		.eq("script", script)
		.order("name", { ascending: true })

	const bundleQuery = supabase
		.schema("stripe")
		.from("products")
		.select(`id, name`)
		.eq("active", true)
		.in("bundle", bundles)
		.order("name", { ascending: true })

	const promises = await Promise.all([scriptQuery, bundleQuery])
	const { data: scriptData, error: scriptErr } = promises[0]
	const { data: bundleData, error: bundleErr } = promises[1]

	if (scriptErr) {
		throw error(
			500,
			"Server error, this is probably not an issue on your end!\n" +
				"SELECT scripts.products failed!\n\n" +
				formatError(scriptErr)
		)
	}

	if (bundleErr) {
		throw error(
			500,
			"Server error, this is probably not an issue on your end!\n" +
				"SELECT scripts.products failed!\n\n" +
				formatError(bundleErr)
		)
	}

	let available: number = 0
	const formatedScriptData = await Promise.all(
		scriptData.map(async (product) => {
			const prices = await getPrices(supabase, product.id)
			available += prices.length
			return {
				id: product.id,
				name: product.name,
				prices: prices
			}
		})
	)

	const formatedBundleData = await Promise.all(
		bundleData.map(async (product) => {
			const prices = await getPrices(supabase, product.id)
			available += prices.length
			return {
				id: product.id,
				name: product.name,
				prices: prices
			}
		})
	)

	if (available === 0) return null
	return { bundles: formatedBundleData, scripts: formatedScriptData }
}
