import type { SupabaseClient } from "@supabase/supabase-js"
import { scriptCategories, scriptStages, scriptStatus, scriptTypes } from "$lib/utils"
import type { Script } from "$lib/types/collection"
import type { Database } from "$lib/types/supabase"
import { getPublishedScripts } from "$lib/server/scripts.server"
import { tutorialsPromise } from "$lib/server/tutorials.server"
import { faqsPromise } from "$lib/server/faqs.server"
import { errorsPromise } from "$lib/server/errors.server"

const website = "https://waspscripts.com"
const SCRIPTERS_TTL = 60 * 60 * 1000

const headers = {
	"Cache-Control": "max-age=0, s-maxage=3600",
	"Content-Type": "text/markdown; charset=utf-8"
}

function oneLine(text: string | null | undefined) {
	return (text ?? "").replace(/\s+/g, " ").trim()
}

function entry(title: string, url: string, notes?: string | null) {
	const description = oneLine(notes)
	return `- [${oneLine(title)}](${url})${description ? ": " + description : ""}`
}

function scriptNotes(script: Script) {
	const { type, status, stage, categories } = script.metadata
	const tags = [scriptTypes[type].name, scriptStatus[status].name]
	if (stage !== "stable") tags.push(scriptStages[stage].name)
	if (categories.length > 0)
		tags.push(categories.map((category) => scriptCategories[category].name).join(", "))
	return `${oneLine(script.description)} (${tags.join(" · ")})`
}

let cachedScripters: { lines: string[]; expires: number } | null = null

async function getScripters(supabase: SupabaseClient<Database>) {
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
		entry(scripter.profiles.username, `${website}/scripters/${scripter.url}`, scripter.description)
	)
	cachedScripters = { lines, expires: Date.now() + SCRIPTERS_TTL }
	return lines
}

export const GET = async ({ locals: { supabaseServer } }) => {
	const [scripts, tutorials, faqs, errors, scripters] = await Promise.all([
		getPublishedScripts(),
		tutorialsPromise,
		faqsPromise,
		errorsPromise,
		getScripters(supabaseServer)
	])

	const body = `# WaspScripts

> WaspScripts is an open source botting platform built on top of Simba. Scripts use colour-only computer vision and remote input, so you can keep using your computer while botting and run multiple clients at once.

- Everything is open source: Simba, the WaspLib library and the scripts.
- Scripts are either free or premium. Premium scripts require a subscription to the script or to a bundle that includes it.
- Scripts are downloaded and run through the wasp-launcher, see the [setup guide](${website}/setup).

## Documentation

${entry("Setup", `${website}/setup`, "How to install Simba and the wasp-launcher and start botting")}
${entry("Simba", "https://villavu.github.io/Simba/", "Simba documentation")}
${entry("WaspLib", "https://docs.waspscripts.com/", "WaspLib documentation")}
${entry("Wasp Stats API", "https://api.waspscripts.com/docs", "Stats API documentation")}
${entry("Interactive map", "https://map.waspscripts.com/", "Interactive game map")}

## Scripts

${entry("All scripts", `${website}/scripts`, `Browse and search all ${scripts.length} published scripts`)}
${scripts.map((script) => entry(`${script.title} by ${script.protected.username}`, `${website}/scripts/${script.url}`, scriptNotes(script))).join("\n")}

## Tutorials

${entry("All tutorials", `${website}/tutorials`, "Learn how to bot and how to write your own colour bots")}
${tutorials.map((tutorial) => entry(`${tutorial.title} by ${tutorial.username}`, `${website}/tutorials/${tutorial.url}`, tutorial.description)).join("\n")}

## Frequently Asked Questions

${faqs.map((faq) => entry(faq.title, `${website}/support/faqs/${faq.url}`)).join("\n")}

## Common Errors

${errors.map((err) => entry(err.title, `${website}/support/errors/${err.url}`)).join("\n")}

## Scripters

${entry("All scripters", `${website}/scripters`, "The developers behind WaspScripts")}
${scripters.join("\n")}

## Optional

${entry("Stats", `${website}/stats`, "Experience, gold and runtime gained by users running WaspScripts")}
${entry("Subscriptions", `${website}/subscriptions`, "Buy and manage script and bundle subscriptions")}
${entry("Support", `${website}/support`, "FAQs, common errors and how to get help on Discord")}
${entry("User Terms and Conditions", `${website}/legal/user_tos`)}
${entry("Scripter Terms and Conditions", `${website}/legal/scripter_tos`)}
${entry("Privacy Policy", `${website}/legal/privacy_policy`)}
`

	return new Response(body, { headers })
}
