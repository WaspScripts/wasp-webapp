import { doLogin } from "$lib/server/supabase.server"
import { error, redirect } from "@sveltejs/kit"

export const load = async ({ parent, params: { slug }, locals: { supabaseServer } }) => {
	const { user, session } = await parent()
	if (!user || !session) {
		return await doLogin(supabaseServer, origin, new URLSearchParams("login&provider=discord"))
	}
	redirect(303, "/scripts/" + slug + "/edit/information/")
}
