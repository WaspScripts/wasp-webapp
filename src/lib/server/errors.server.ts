import type { FAQEntry } from "$lib/types/collection"
import { getUsername } from "$lib/server/supabase.server"
import matter from "gray-matter"
import removeMd from "remove-markdown"
import { encodeSEO } from "$lib/utils"

export async function getErrors() {
	const errors: FAQEntry[] = []

	const files = import.meta.glob("/src/wasp-info/errors/*.md", {
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
			console.log("Adding Error: ", entry.title)
			errors.push(entry)
		}
	}

	return errors.sort((a, b) => a.order - b.order)
}

export const errorsPromise = getErrors()

export async function getError(slug: string) {
	const errors = await errorsPromise

	if (/^\d+$/.test(slug)) {
		const n = parseInt(slug, 10)
		return errors.find((err) => err.order === n)
	}

	return errors.find((err) => err.url === slug)
}
