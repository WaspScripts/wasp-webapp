import { doLogin } from "$lib/server/supabase.server"
import { redirect } from "@sveltejs/kit"

export const load = async ({ params: { slug }, locals: { supabaseServer, user, session } }) => {
	if (!user || !session) {
		return await doLogin(supabaseServer, origin, new URLSearchParams("login&provider=discord"))
	}
	redirect(303, "/scripts/" + encodeURI(slug) + "/edit/information/")
}
