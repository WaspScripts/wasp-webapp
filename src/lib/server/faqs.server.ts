import type { FAQEntry } from "$lib/types/collection"
import { getUsername } from "$lib/server/supabase.server"
import matter from "gray-matter"
import removeMd from "remove-markdown"

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

		const entry = {
			...data,
			username,
			order: parseInt(order),
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

export async function getFAQ(index: number) {
	const faqs = await faqsPromise
	return faqs.find((faq) => faq.order === index)
}
