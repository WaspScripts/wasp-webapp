import { error } from "@sveltejs/kit"

export const load = async ({ data, params: { slug } }) => {
	if (!data || !data.meta) error(404, "Could not find " + slug + " common error.")

	try {
		const err = await import(`../../../../wasp-info/errors/${data.meta.order}.md`)
		return {
			content: err.default,
			meta: data.meta
		}
	} catch {
		error(404, `Could not find ${slug} common error`)
	}
}
