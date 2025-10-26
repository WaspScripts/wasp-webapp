import { createBrowserClient, createServerClient, isBrowser } from "@supabase/ssr"
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from "$env/static/public"
import type { Session, User } from "@supabase/supabase-js"

export const load = async ({ data, depends, fetch }) => {
	depends("supabase:auth")

	const supabaseClient = isBrowser()
		? createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
				global: { fetch }
			})
		: createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
				global: { fetch },
				cookies: {
					getAll() {
						return data.cookies
					}
				}
			})

	let session: Session | null
	let user: User | null
	if (isBrowser()) {
		const promises = await Promise.all([supabaseClient.auth.getSession(), supabaseClient.auth.getUser()])
		session = promises[0].data.session
		user = promises[1].data.user
	} else {
		session = data.session
		user = data.user
	}

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
		session,
		user,
		profile: await getProfile()
	}
}
