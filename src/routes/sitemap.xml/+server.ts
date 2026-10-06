import type { SupabaseClient } from "@supabase/supabase-js"
import { isoDate, WEBSITE_URL } from "$lib/utils"
import { tutorialsPromise } from "$lib/server/tutorials.server"
import { getPublishedScripts } from "$lib/server/scripts.server"
import { faqsPromise } from "$lib/server/faqs.server"
import { errorsPromise } from "$lib/server/errors.server"
import type { Database } from "$lib/types/supabase"

type SitemapEntry = { path: string; lastmod?: string | Date | null }

const staticPaths = [
	"",
	"/setup",
	"/scripts",
	"/stats",
	"/subscriptions",
	"/support",
	"/support/faqs",
	"/support/errors",
	"/tutorials",
	"/scripters",
	"/legal/user_tos",
	"/legal/scripter_tos",
	"/legal/privacy_policy"
]

function escapeXml(text: string) {
	return text
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&apos;")
}

function toUrl({ path, lastmod }: SitemapEntry) {
	const date = isoDate(lastmod)
	return `	<url>
		<loc>${escapeXml(WEBSITE_URL + path)}</loc>${date ? `\n		<lastmod>${date}</lastmod>` : ""}
	</url>`
}

async function getScripts(): Promise<SitemapEntry[]> {
	const scripts = await getPublishedScripts()
	return scripts
		.filter((script) => script.url)
		.map((script) => ({ path: "/scripts/" + script.url, lastmod: script.protected?.updated_at }))
}

async function getTutorials(): Promise<SitemapEntry[]> {
	const tutorials = await tutorialsPromise
	return tutorials.map((tutorial) => ({ path: "/tutorials/" + tutorial.url, lastmod: tutorial.updated_at }))
}

async function getFAQs(): Promise<SitemapEntry[]> {
	const faqs = await faqsPromise
	return faqs.map((faq) => ({ path: "/support/faqs/" + faq.url, lastmod: faq.updated_at }))
}

async function getErrors(): Promise<SitemapEntry[]> {
	const errors = await errorsPromise
	return errors.map((err) => ({ path: "/support/errors/" + err.url, lastmod: err.updated_at }))
}

async function getScripters(supabase: SupabaseClient<Database>): Promise<SitemapEntry[]> {
	const { data, error } = await supabase
		.schema("profiles")
		.from("scripters")
		.select("url")
		.overrideTypes<{ url: string | null }[]>()

	if (error) {
		console.error("scripters SELECT failed: " + error.message)
		return []
	}

	return data.filter((scripter) => scripter.url).map((scripter) => ({ path: "/scripters/" + scripter.url }))
}

const CACHE_TTL = 60 * 60 * 1000
let cachedSitemap: { body: string; expires: number } | null = null

const headers = {
	"Cache-Control": "max-age=0, s-maxage=3600",
	"Content-Type": "application/xml"
}

export const GET = async ({ locals: { supabaseServer } }) => {
	if (cachedSitemap && cachedSitemap.expires > Date.now())
		return new Response(cachedSitemap.body, { headers })

	const dynamic = await Promise.all([
		getScripts(),
		getTutorials(),
		getFAQs(),
		getErrors(),
		getScripters(supabaseServer)
	])

	const entries: SitemapEntry[] = [...staticPaths.map((path) => ({ path })), ...dynamic.flat()]

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(toUrl).join("\n")}
</urlset>`

	cachedSitemap = { body, expires: Date.now() + CACHE_TTL }
	return new Response(body, { headers })
}
