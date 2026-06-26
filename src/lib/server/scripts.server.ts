import FlexSearch from "flexsearch"
import type { Script } from "$lib/types/collection"
import { supabaseAdmin } from "./supabase.server"
import { fetchScriptByID } from "$lib/client/supabase"
import { UUID_V4_REGEX } from "$lib/utils"

let scriptsIndex: FlexSearch.Index
let scripts: Script[] = []
let publishedScripts: Script[] = []

function getScriptString(script: Script) {
	return `${script.title} ${script.description} ${script.content} ${script.protected.username}`
}

function createScriptsIndex(data: Script[]) {
	scriptsIndex = new FlexSearch.Index({ tokenize: "full", cache: true, language: "en" })
	data.forEach((script, i) => scriptsIndex.add(i, getScriptString(script)))
}

export async function searchScriptsIndex(searchTerm: string) {
	if (scripts.length === 0 || publishedScripts.length === 0) await getPublishedScripts()
	const match = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") //escape special regex characters
	const indices = scriptsIndex.search(match) as number[]
	return indices.map((index) => publishedScripts[index])
}

export async function getScripts(): Promise<Script[]> {
	if (scripts.length > 0) return scripts

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

	let index = scripts.findIndex((s) => s.id === id)
	if (index === -1) {
		scripts.push(script)
		if (script.published) publishedScripts.push(script)
		scriptsIndex.add(publishedScripts.length, getScriptString(script))
		return
	}

	scripts[index] = script

	if (!scriptsIndex || publishedScripts.length === 0) {
		return
	}

	index = publishedScripts.findIndex((s) => s.id === id)
	publishedScripts[index] = script

	scriptsIndex.update(index, getScriptString(script))
}
