import { mdvsvexCompile } from "$lib/server/markdown.server"
import { formatError } from "$lib/utils"
import { error } from "@sveltejs/kit"
import DOMPurify from "isomorphic-dompurify"

type validSlug = "privacy_policy" | "scripter_tos" | "user_tos"

export const load = async ({ params: { slug }, locals: { supabaseServer } }) => {
	const validSlugs = ["privacy_policy", "scripter_tos", "user_tos"]
	slug = slug.toLowerCase()
	if (!validSlugs.includes(slug)) error(404, "Unknown legal page.")

	async function getInfo() {
		const schema = "info"
		const { data, error: err } = await supabaseServer
			.schema(schema)
			.from(slug as validSlug)
			.select("version, created_at, content")
			.order("version", { ascending: false })

		if (err) {
			error(
				500,
				"Server error, this is probably not an issue on your end!\n" +
					"SELECT info." +
					slug +
					" failed!\n\n" +
					formatError(err)
			)
		}

		return await Promise.all(
			data.map(async (legal) => {
				return {
					version: legal.version,
					created_at: legal.created_at,
					content: DOMPurify.sanitize((await mdvsvexCompile(legal.content)).code),
					originalContent: legal.content
				}
			})
		)
	}

	return { policies: await getInfo() }
}
