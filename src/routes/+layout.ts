import { createBrowserClient, createServerClient, isBrowser } from "@supabase/ssr"
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from "$env/static/public"
import type { Database } from "$lib/types/supabase"

export const load = async ({ data, depends, fetch }) => {
	depends("supabase:auth")

	const supabaseClient = isBrowser()
		? createBrowserClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
				global: { fetch }
			})
		: createServerClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
				global: { fetch },
				cookies: {
					getAll() {
						return data.cookies
					}
				}
			})

	const promises = await Promise.all([
		supabaseClient.auth.getUser(),
		supabaseClient.auth.getSession()
	])

	const {
		data: { user }
	} = promises[0]

	const getProfile = async () => {
		if (!user) return null
		const { data, error: err } = await supabaseClient
			.schema("profiles")
			.from("profiles")
			.select("id, stripe, discord, username, avatar, role")
			.eq("id", user.id)
			.single()

		if (err) return null
		return data
	}

	return {
		darkMode: data.darkMode,
		theme: data.theme,
		supabaseClient,
		session: promises[1].data.session,
		profile: await getProfile()
	}
}
