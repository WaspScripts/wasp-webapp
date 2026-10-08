import { canViewScript, getScript, isPublicScript } from "$lib/server/scripts.server"
import { error } from "@sveltejs/kit"

export const load = async ({ params: { slug }, locals: { user, getProfile } }) => {
	const script = await getScript(slug)
	if (!script) error(404, "Script not found!")
	if (isPublicScript(script)) return { script }

	const profile = user ? await getProfile() : null
	if (canViewScript(script, user?.id, profile?.role)) return { script }

	error(404, "Script not found!")
}
