import { getFAQ } from "$lib/server/faqs.server"

export const load = async ({ params: { slug } }) => {
	return { meta: await getFAQ(slug) }
}
