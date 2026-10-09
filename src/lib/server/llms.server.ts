import type { SupabaseClient } from "@supabase/supabase-js"
import { error } from "@sveltejs/kit"
import matter from "gray-matter"
import type { FAQEntry, Script, Tutorial } from "$lib/types/collection"
import type { Database } from "$lib/types/supabase"
import { getPublishedScripts, getScript, isPublicScript } from "$lib/server/scripts.server"
import { getTutorial, tutorialsPromise } from "$lib/server/tutorials.server"
import { faqsPromise, getFAQ } from "$lib/server/faqs.server"
import { errorsPromise, getError } from "$lib/server/errors.server"
import { getScripter } from "$lib/client/supabase"
import { replaceScriptContent } from "$lib/client/utils"
import {
	formatNumber,
	formatTime,
	githubURL,
	isoDate,
	scriptCategories,
	scriptStages,
	scriptStatus,
	scriptTypes,
	WEBSITE_URL
} from "$lib/utils"

type Supabase = SupabaseClient<Database>
type Limits = { xp_min: number; xp_max: number; gp_min: number; gp_max: number }
type Stats = { experience: number | null; gold: number | null; runtime: number | null }

const TTL = 60 * 60 * 1000
const noLimits: Limits = { xp_min: 0, xp_max: 0, gp_min: 0, gp_max: 0 }

export const markdownHeaders = {
	"Cache-Control": "max-age=0, s-maxage=3600",
	"Content-Type": "text/markdown; charset=utf-8"
}

const rawFiles = import.meta.glob("/src/wasp-info/*/*.md", {
	eager: true,
	query: "?raw",
	import: "default"
})

const rawContent = new Map(
	Object.entries(rawFiles).map(([path, raw]) => [
		path.replace("/src/wasp-info/", "").replace(".md", ""),
		matter(raw as string).content.trim()
	])
)

function oneLine(text: string | null | undefined) {
	return (text ?? "").replace(/\s+/g, " ").trim()
}

function entry(title: string, url: string, notes?: string | null) {
	const description = oneLine(notes)
	return `- [${oneLine(title)}](${url})${description ? ": " + description : ""}`
}

function date(value: string | null | undefined) {
	return isoDate(value)?.slice(0, 10)
}

function document(title: string, summary: string | null | undefined, facts: string[], body: string) {
	const heading = /^#\s/.test(body) ? "" : `# ${title}\n\n`
	const quote = oneLine(summary) ? `> ${oneLine(summary)}\n\n` : ""
	const list = facts.length > 0 ? facts.map((fact) => "- " + fact).join("\n") + "\n\n" : ""
	return `${heading}${quote}${list}${body.trim()}\n`
}

export function scriptTags(script: Script) {
	const { type, status, stage, categories } = script.metadata
	const tags = [scriptTypes[type].name, scriptStatus[status].name]
	if (stage !== "stable") tags.push(scriptStages[stage].name)
	if (categories.length > 0)
		tags.push(categories.map((category) => scriptCategories[category].name).join(", "))
	return tags.join(" · ")
}

function scriptMarkdown(script: Script, limits: Limits, stats: Stats | null) {
	const { type, status, stage, categories } = script.metadata
	const url = `${WEBSITE_URL}/scripts/${script.url}`
	const facts = [
		`URL: ${url}`,
		`Author: ${script.protected.username}`,
		`Type: ${scriptTypes[type].name}${type === "premium" ? " (requires a subscription to the script or a bundle that includes it)" : ""}`,
		`Status: ${scriptStatus[status].name}`,
		`Stage: ${scriptStages[stage].name}`
	]
	if (categories.length > 0)
		facts.push(`Categories: ${categories.map((category) => scriptCategories[category].name).join(", ")}`)
	facts.push(`Revision: ${script.protected.revision} (updated ${date(script.protected.updated_at)})`)
	if (stats && (stats.experience || stats.gold || stats.runtime)) {
		facts.push(
			`Community stats: ${formatNumber(stats.experience ?? 0)} experience, ${formatNumber(stats.gold ?? 0)} gold and ${formatTime(stats.runtime ?? 0)} of runtime gained by WaspScripts users`
		)
	}
	facts.push(`How to run: install the wasp-launcher (${WEBSITE_URL}/setup) and start the script from it`)

	return document(
		`${script.title} by ${script.protected.username}`,
		script.description,
		facts,
		replaceScriptContent(script, limits)
	)
}

function articleMarkdown(
	kind: "tutorials" | "faq" | "errors",
	path: string,
	meta: Tutorial | FAQEntry,
	extra: string[] = []
) {
	const facts = [
		`URL: ${WEBSITE_URL}${path}`,
		`Author: ${meta.username}`,
		...extra,
		`Published: ${date(meta.created_at)}`,
		`Updated: ${date(meta.updated_at)}`
	]
	const summary = "description" in meta ? meta.description : null
	return document(meta.title, summary, facts, rawContent.get(`${kind}/${meta.order}`) ?? meta.content)
}

async function fetchLimits(supabase: Supabase, id: string) {
	const { data, error } = await supabase
		.schema("stats")
		.from("limits")
		.select("xp_min, xp_max, gp_min, gp_max")
		.eq("id", id)
		.maybeSingle()
	if (error) console.error(error)
	return data ?? noLimits
}

async function fetchStats(supabase: Supabase, id: string) {
	const { data, error } = await supabase
		.schema("stats")
		.from("values")
		.select("experience, gold, runtime")
		.eq("id", id)
		.maybeSingle()
	if (error) console.error(error)
	return data
}

async function scripterMarkdown(supabase: Supabase, slug: string) {
	const scripter = await getScripter(supabase, slug)
	const scripts = (await getPublishedScripts()).filter((script) => script.protected.author === scripter.id)
	const facts = [`URL: ${WEBSITE_URL}/scripters/${scripter.url}`]
	if (scripter.realname) facts.push(`Name: ${scripter.realname}`)
	if (scripter.github) facts.push(`GitHub: ${githubURL(scripter.github)}`)
	facts.push(`Published scripts: ${scripts.length}`)

	const list = scripts
		.map((script) => entry(script.title, `${WEBSITE_URL}/scripts/${script.url}.md`, script.description))
		.join("\n")

	const body = [scripter.content?.trim(), list ? `## Scripts\n\n${list}` : ""].filter(Boolean).join("\n\n")
	return document(scripter.profiles.username, scripter.description, facts, body)
}

type Section = "scripts" | "tutorials" | "scripters" | "faqs" | "errors"

async function getPageMarkdown(section: Section, slug: string, supabase: Supabase) {
	try {
		switch (section) {
			case "scripts": {
				const script = await getScript(slug)
				if (!script || !isPublicScript(script)) return null
				const [limits, stats] = await Promise.all([
					fetchLimits(supabase, script.id),
					fetchStats(supabase, script.id)
				])
				return scriptMarkdown(script, limits, stats)
			}
			case "tutorials": {
				const tutorial = await getTutorial(slug)
				if (!tutorial) return null
				return articleMarkdown("tutorials", `/tutorials/${tutorial.url}`, tutorial, [
					`Level: ${tutorial.level}`
				])
			}
			case "faqs": {
				const faq = await getFAQ(slug)
				return faq ? articleMarkdown("faq", `/support/faqs/${faq.url}`, faq) : null
			}
			case "errors": {
				const err = await getError(slug)
				return err ? articleMarkdown("errors", `/support/errors/${err.url}`, err) : null
			}
			case "scripters":
				return await scripterMarkdown(supabase, slug)
		}
	} catch {
		return null
	}
}

export async function markdownResponse(section: Section, slug: string, supabase: Supabase) {
	const body = await getPageMarkdown(section, slug, supabase)
	if (!body) error(404, "Page not found!")
	return new Response(body, { headers: markdownHeaders })
}

let cachedScripters: { lines: string[]; expires: number } | null = null

async function getScripterEntries(supabase: Supabase) {
	if (cachedScripters && cachedScripters.expires > Date.now()) return cachedScripters.lines

	const { data, error } = await supabase
		.schema("profiles")
		.from("scripters")
		.select("description, url, profiles (username)")
		.order("url")
		.overrideTypes<{ description: string | null; url: string; profiles: { username: string } }[]>()

	if (error) {
		console.error("llms.txt scripters SELECT failed: " + error.message)
		return cachedScripters?.lines ?? []
	}

	const lines = data.map((scripter) =>
		entry(scripter.profiles.username, `${WEBSITE_URL}/scripters/${scripter.url}.md`, scripter.description)
	)
	cachedScripters = { lines, expires: Date.now() + TTL }
	return lines
}

const intro = `# WaspScripts

> WaspScripts is an open source botting platform built on top of Simba. Scripts use colour-only computer vision and remote input, so you can keep using your computer while botting and run multiple clients at once.

- Everything is open source: Simba, the WaspLib library and the scripts.
- Scripts are either free or premium. Premium scripts require a subscription to the script or to a bundle that includes it.
- Scripts are downloaded and run through the wasp-launcher, see the [setup guide](${WEBSITE_URL}/setup).
- Every script, tutorial, FAQ, error and scripter page is available as markdown by appending \`.md\` to its URL.
- The full text of every tutorial, FAQ, common error and script is available at [llms-full.txt](${WEBSITE_URL}/llms-full.txt).`

export async function getLlmsTxt(supabase: Supabase) {
	const [scripts, tutorials, faqs, errors, scripters] = await Promise.all([
		getPublishedScripts(),
		tutorialsPromise,
		faqsPromise,
		errorsPromise,
		getScripterEntries(supabase)
	])

	return `${intro}

## Documentation

${entry("Setup", `${WEBSITE_URL}/setup`, "How to install Simba and the wasp-launcher and start botting")}
${entry("Simba", "https://villavu.github.io/Simba/", "Simba documentation")}
${entry("WaspLib", "https://docs.waspscripts.com/", "WaspLib documentation")}
${entry("Wasp Stats API", "https://api.waspscripts.com/docs", "Stats API documentation")}
${entry("Interactive map", "https://map.waspscripts.com/", "Interactive game map")}

## Scripts

${entry("All scripts", `${WEBSITE_URL}/scripts`, `Browse and search all ${scripts.length} published scripts`)}
${scripts.map((script) => entry(`${script.title} by ${script.protected.username}`, `${WEBSITE_URL}/scripts/${script.url}.md`, `${oneLine(script.description)} (${scriptTags(script)})`)).join("\n")}

## Tutorials

${entry("All tutorials", `${WEBSITE_URL}/tutorials`, "Learn how to bot and how to write your own colour bots")}
${tutorials.map((tutorial) => entry(`${tutorial.title} by ${tutorial.username}`, `${WEBSITE_URL}/tutorials/${tutorial.url}.md`, tutorial.description)).join("\n")}

## Frequently Asked Questions

${faqs.map((faq) => entry(faq.title, `${WEBSITE_URL}/support/faqs/${faq.url}.md`)).join("\n")}

## Common Errors

${errors.map((err) => entry(err.title, `${WEBSITE_URL}/support/errors/${err.url}.md`)).join("\n")}

## Scripters

${entry("All scripters", `${WEBSITE_URL}/scripters`, "The developers behind WaspScripts")}
${scripters.join("\n")}

## Optional

${entry("Full content", `${WEBSITE_URL}/llms-full.txt`, "Every tutorial, FAQ, common error and script description in a single file")}
${entry("Stats", `${WEBSITE_URL}/stats`, "Experience, gold and runtime gained by users running WaspScripts")}
${entry("Subscriptions", `${WEBSITE_URL}/subscriptions`, "Buy and manage script and bundle subscriptions")}
${entry("Support", `${WEBSITE_URL}/support`, "FAQs, common errors and how to get help on Discord")}
${entry("User Terms and Conditions", `${WEBSITE_URL}/legal/user_tos`)}
${entry("Scripter Terms and Conditions", `${WEBSITE_URL}/legal/scripter_tos`)}
${entry("Privacy Policy", `${WEBSITE_URL}/legal/privacy_policy`)}
`
}

let cachedFull: { body: string; expires: number } | null = null

async function fetchAll<T extends { id: string }>(
	supabase: Supabase,
	table: "limits" | "values",
	columns: string
) {
	const { data, error } = await supabase
		.schema("stats")
		.from(table)
		.select(columns)
		.overrideTypes<T[], { merge: false }>()
	if (error) console.error(`llms-full.txt stats.${table} SELECT failed: ` + error.message)
	return new Map((data ?? []).map((row) => [row.id, row]))
}

function demote(markdown: string) {
	let fenced = false
	return markdown
		.split("\n")
		.map((line) => {
			if (/^(```|~~~)/.test(line)) fenced = !fenced
			return !fenced && /^#{1,4}\s/.test(line) ? "##" + line : line
		})
		.join("\n")
}

export async function getLlmsFullTxt(supabase: Supabase) {
	if (cachedFull && cachedFull.expires > Date.now()) return cachedFull.body

	const [scripts, tutorials, faqs, errors, limits, stats] = await Promise.all([
		getPublishedScripts(),
		tutorialsPromise,
		faqsPromise,
		errorsPromise,
		fetchAll<Limits & { id: string }>(supabase, "limits", "id, xp_min, xp_max, gp_min, gp_max"),
		fetchAll<Stats & { id: string }>(supabase, "values", "id, experience, gold, runtime")
	])

	const section = (title: string, docs: string[]) =>
		docs.length > 0 ? `## ${title}\n\n${docs.map(demote).join("\n---\n\n")}` : ""

	const body = [
		intro,
		section(
			"Tutorials",
			tutorials.map((tutorial) =>
				articleMarkdown("tutorials", `/tutorials/${tutorial.url}`, tutorial, [`Level: ${tutorial.level}`])
			)
		),
		section(
			"Frequently Asked Questions",
			faqs.map((faq) => articleMarkdown("faq", `/support/faqs/${faq.url}`, faq))
		),
		section(
			"Common Errors",
			errors.map((err) => articleMarkdown("errors", `/support/errors/${err.url}`, err))
		),
		section(
			"Scripts",
			scripts.map((script) =>
				scriptMarkdown(script, limits.get(script.id) ?? noLimits, stats.get(script.id) ?? null)
			)
		)
	]
		.filter(Boolean)
		.join("\n\n")

	cachedFull = { body: body + "\n", expires: Date.now() + TTL }
	return cachedFull.body
}
