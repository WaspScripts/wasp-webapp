import { getPublishedScripts, searchScriptsIndex, withoutContent } from "$lib/server/scripts.server"
import { formatError } from "$lib/utils"
import { error } from "@sveltejs/kit"

const MAX_AMOUNT = 100
const FEATURED_TTL = 5 * 60 * 1000

let featuredIDs: Set<string> | null = null
let featuredFetchedAt = 0

export async function load({ depends, url, locals: { supabaseServer } }) {
	depends("wasp:scripts")
	const pageN = Number(url.searchParams.get("page") || "-1")
	const page = pageN < 0 || Number.isNaN(pageN) ? 1 : pageN

	const amountN = Number(url.searchParams.get("amount") || "12")
	const amount = Number.isNaN(amountN) || amountN < 1 ? 1 : Math.min(Math.floor(amountN), MAX_AMOUNT)

	const search = decodeURIComponent(url.searchParams.get("search") || "").trim()

	const statusFilter = url.searchParams.get("status")
	const typeFilter = url.searchParams.get("type")

	const categoriesStr = url.searchParams.get("categories")
	const categoriesFilter = categoriesStr ? decodeURIComponent(categoriesStr).split("-") : null
	const categoriesSet = new Set(categoriesFilter)

	const start = (page - 1) * amount
	const finish = start + amount - 1

	const allScripts = getPublishedScripts()
	let scripts = await (search !== "" ? searchScriptsIndex(search) : allScripts)

	async function getFeatured() {
		const scripts = await allScripts

		if (featuredIDs && Date.now() - featuredFetchedAt < FEATURED_TTL) {
			const cached = featuredIDs
			return scripts.filter((script) => cached.has(script.id)).map(withoutContent)
		}

		const { data, error: err } = await supabaseServer.schema("scripts").from("featured").select("id")

		if (err) {
			error(
				500,
				"Server error, this is probably not an issue on your end!\n" +
					"SELECT scripts.featured failed!" +
					formatError(err)
			)
		}
		const ids = new Set(data.flatMap((featured) => (featured.id ? [featured.id] : [])))
		featuredIDs = ids
		featuredFetchedAt = Date.now()
		return scripts.filter((script) => ids.has(script.id)).map(withoutContent)
	}

	if (statusFilter) scripts = scripts.filter((script) => script.metadata.status === statusFilter)
	if (typeFilter) scripts = scripts.filter((script) => script.metadata.type === typeFilter)

	if (categoriesFilter) {
		scripts = scripts.filter((script) =>
			script.metadata.categories.some((category) => categoriesSet.has(category))
		)
	}

	const filteredScripts = scripts.slice(Math.max(0, start), Math.min(scripts.length, finish + 1))

	return {
		scripts: filteredScripts.map(withoutContent),
		featuredPromise: getFeatured(),
		amount,
		count: scripts.length
	}
}
