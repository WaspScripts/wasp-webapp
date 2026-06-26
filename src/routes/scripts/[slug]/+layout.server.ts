import { getScript } from "$lib/server/scripts.server"
import { error } from "@sveltejs/kit"

export const load = async ({ params: { slug } }) => {
	const script = await getScript(slug)
	if (script) return { script }

	error(404, "Script not found!")
}
