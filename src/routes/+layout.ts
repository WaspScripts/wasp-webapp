import { createBrowserClient, createServerClient, isBrowser } from "@supabase/ssr"
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from "$env/static/public"
import type { Database } from "$lib/types/supabase"

export const load = async ({ data, depends, fetch }) => {
	depends("supabase:auth")

	if (isBrowser()) {
		const supabaseClient = createBrowserClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
			global: { fetch }
		})

		const promises = await Promise.all([supabaseClient.auth.getSession(), supabaseClient.auth.getUser()])

		const expiresAt = promises[0].data.session?.expires_at ?? null
		const authUser = promises[1].data.user

		if (authUser) {
			const { data: profile } = await supabaseClient
				.schema("profiles")
				.from("profiles")
				.select("id, stripe, discord, username, avatar, role")
				.eq("id", authUser.id)
				.single()

			return {
				mode: data.mode,
				theme: data.theme,
				supabaseClient,
				user: authUser.id,
				expiresAt,
				profile
			}
		}

		return {
			mode: data.mode,
			theme: data.theme,
			supabaseClient,
			user: null,
			expiresAt,
			profile: null
		}
	}

	const supabaseClient = createServerClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		global: { fetch },
		cookies: {
			getAll() {
				return data.cookies
			}
		}
	})

	return {
		mode: data.mode,
		theme: data.theme,
		supabaseClient,
		user: data.user,
		expiresAt: data.expiresAt,
		profile: data.profile
	}
}
