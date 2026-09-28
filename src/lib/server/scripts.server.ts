import { Index } from "flexsearch"
import type { Script } from "$lib/types/collection"
import { supabaseAdmin } from "./supabase.server"
import { fetchScriptByID } from "$lib/client/supabase"
import { UUID_V4_REGEX } from "$lib/utils"

let scriptsIndex: Index
let scripts: Script[] = []
let publishedScripts: Script[] = []

// Script cards don't use the (potentially large) markdown content, don't send it to the client.
export function withoutContent(script: Script): Omit<Script, "content"> {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { content, ...card } = script
	return card
}

function getScriptString(script: Script) {
	return `${script.title} ${script.description} ${script.content} ${script.protected.username}`
}

function createScriptsIndex(data: Script[]) {
	scriptsIndex = new Index({ tokenize: "full", cache: true })
	data.forEach((script) => scriptsIndex.add(script.id, getScriptString(script)))
}

export async function searchScriptsIndex(searchTerm: string) {
	if (scripts.length === 0 || publishedScripts.length === 0) await getPublishedScripts()
	const match = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") //escape special regex characters
	const ids = scriptsIndex.search(match) as string[]
	const byID = new Map(publishedScripts.map((script) => [script.id, script]))
	return ids.map((id) => byID.get(id)).filter((script): script is Script => script !== undefined)
}

let scriptsLoading: Promise<Script[]> | null = null

export function getScripts(): Promise<Script[]> {
	if (scripts.length > 0) return Promise.resolve(scripts)

	// Share one in-flight fetch between concurrent callers.
	scriptsLoading ??= fetchScripts().finally(() => {
		scriptsLoading = null
	})
	return scriptsLoading
}

async function fetchScripts(): Promise<Script[]> {
	const { data, error } = await supabaseAdmin
		.schema("scripts")
		.from("scripts")
		.select(
			`id, title, description, content, url, published,
			protected!left (author, revision, username, avatar, updated_at),
			metadata!left (status, type, categories, stage)`
		)
		.order("title", { ascending: true })
		.overrideTypes<Script[]>()

	if (error) {
		console.error(error)
		return scripts
	}

	scripts = data
	return scripts
}

export async function getPublishedScripts() {
	if (publishedScripts.length > 0) return publishedScripts
	await getScripts()
	if (publishedScripts.length > 0) return publishedScripts // built by a concurrent caller
	if (scripts.length === 0) return publishedScripts

	publishedScripts = scripts.filter((script) => script.published)

	createScriptsIndex(publishedScripts)

	return publishedScripts
}

export async function getScriptByID(id: string) {
	const scripts = await getScripts()
	return scripts.find((s) => s.id === id) ?? null
}

export async function getScriptByURL(url: string) {
	const scripts = await getScripts()
	const script = scripts.find((s) => s.url === url)
	return script ?? null
}

const scriptsMap = new Map<string, Script>()

export async function getScript(slug: string) {
	const mapped = scriptsMap.get(slug)
	if (mapped) return mapped

	const isUUID = UUID_V4_REGEX.test(slug)
	const script = await (isUUID ? getScriptByID(slug) : getScriptByURL(slug))
	if (script) scriptsMap.set(slug, script)

	return script
}

export async function updateScript(id: string) {
	if (scripts.length === 0) return

	const script = await fetchScriptByID(supabaseAdmin, id)
	if (script == null) return

	// Drop cached lookups for this script (its url may have changed too).
	for (const [slug, cached] of scriptsMap) {
		if (cached.id === id) scriptsMap.delete(slug)
	}

	const index = scripts.findIndex((s) => s.id === id)
	if (index === -1) scripts.push(script)
	else scripts[index] = script

	// Indexes are keyed by script id, so the index and published list can't drift apart.
	const wasPublished = publishedScripts.some((s) => s.id === id)
	publishedScripts = scripts.filter((s) => s.published)

	if (!scriptsIndex) return

	if (script.published) {
		if (wasPublished) scriptsIndex.update(id, getScriptString(script))
		else scriptsIndex.add(id, getScriptString(script))
	} else if (wasPublished) {
		scriptsIndex.remove(id)
	}
}
