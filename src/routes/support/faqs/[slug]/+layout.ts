import { error } from "@sveltejs/kit"

export const load = async ({ data, params: { slug } }) => {
	if (!data || !data.meta) error(404, "Could not find " + slug + " FAQ.")

	try {
		const faq = await import(`../../../../wasp-info/faq/${data.meta.order}.md`)
		return {
			content: faq.default,
			meta: data.meta
		}
	} catch {
		error(404, `Could not find ${slug} FAQ.`)
	}
}
