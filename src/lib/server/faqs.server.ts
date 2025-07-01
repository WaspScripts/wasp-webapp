import type { FAQEntry } from "$lib/types/collection"
import { getUsername } from "$lib/server/supabase.server"
import matter from "gray-matter"
import removeMd from "remove-markdown"
import { encodeSEO } from "$lib/utils"

export async function getFAQs() {
	const faqs: FAQEntry[] = []

	const files = import.meta.glob("/src/wasp-info/faq/*.md", {
		eager: true,
		query: "?raw",
		import: "default"
	})

	for (const path in files) {
		const raw = files[path] as string
		const order = path.split("/").at(-1)?.replace(".md", "")
		if (!order) continue
		const { data, content } = matter(raw)

		if (!data.title || !data.author || !data.published) continue

		const username = await getUsername(data.author)
		if (!username) continue

		const url = encodeSEO(data.title + " by " + username)

		const entry = {
			...data,
			username,
			order: parseInt(order),
			url,
			content: removeMd(content)
		} as FAQEntry

		if (entry.published) {
			console.log("Adding FAQ: ", entry.title)
			faqs.push(entry)
		}
	}

	return faqs.sort((a, b) => a.order - b.order)
}

export const faqsPromise = getFAQs()

export async function getFAQ(slug: string) {
	const faqs = await faqsPromise

	if (/^\d+$/.test(slug)) {
		const n = parseInt(slug, 10)
		return faqs.find((faq) => faq.order === n)
	}

	return faqs.find((faq) => faq.url === slug)
}
