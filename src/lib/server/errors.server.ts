import type { FAQEntry } from "$lib/types/collection"
import { getUsername } from "$lib/server/supabase.server"
import matter from "gray-matter"
import removeMd from "remove-markdown"

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

		const entry = {
			...data,
			username,
			order: parseInt(order),
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

export async function getError(index: number) {
	const errors = await errorsPromise
	return errors.find((err) => err.order === index)
}
