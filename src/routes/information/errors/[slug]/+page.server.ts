import { getError } from "$lib/server/errors.server"

export const load = async ({ params: { slug } }) => {
	return { meta: await getError(slug) }
}
