import { supabaseAdmin } from "./supabase.server"

interface Version {
	version: string
}

interface ScriptVersion {
	simba: string
	wasplib: string
}

let simbaVersions: Version[] = []
let wasplibVersions: Version[] = []
const scriptVersions = new Map<string, ScriptVersion>()

export async function getSimbaVersions() {
	if (simbaVersions.length > 0) return simbaVersions

	const { data, error: err } = await supabaseAdmin
		.schema("scripts")
		.from("simba")
		.select("version")
		.limit(10)
		.order("created_at", { ascending: false })

	if (err) {
		console.error(err)
		return simbaVersions
	}

	simbaVersions = data
	return data
}

export async function getWaspLibVersions() {
	if (wasplibVersions.length > 0) return wasplibVersions

	const { data, error: err } = await supabaseAdmin
		.schema("scripts")
		.from("wasplib")
		.select("version")
		.limit(10)
		.order("created_at", { ascending: false })

	if (err) {
		console.error(err)
		return wasplibVersions
	}

	wasplibVersions = data
	return data
}

export async function getScriptVersion(id: string, revision: number) {
	const key = `${id}-${revision}`
	const cached = scriptVersions.get(key)
	if (cached) return cached

	const { data, error: err } = await supabaseAdmin
		.schema("scripts")
		.from("versions")
		.select("simba, wasplib")
		.eq("id", id)
		.eq("revision", revision)
		.single()

	if (err) {
		console.error(err)
		return null
	}

	scriptVersions.set(key, data)
	return data
}

export async function resetSimbaVersions() {
	simbaVersions = []
	return simbaVersions
}
export async function resetWaspLibVersions() {
	wasplibVersions = []
	return wasplibVersions
}
export async function resetScriptVersions(id: string, revision: number) {
	const key = `${id}-${revision}`
	const cached = scriptVersions.get(key)
	scriptVersions.delete(key)
	return cached
}
