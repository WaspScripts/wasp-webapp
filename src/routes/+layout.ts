import { createBrowserClient, isBrowser } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from "$env/static/public"
import type { Database } from "$lib/types/supabase"

export const load = async ({ data, depends, fetch }) => {
	depends("supabase:auth")

	if (isBrowser()) {
		const supabaseClient = createBrowserClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
			global: { fetch }
		})

		const {
			data: { session }
		} = await supabaseClient.auth.getSession()

		if ((session?.user.id ?? null) === data.user) {
			return {
				mode: data.mode,
				theme: data.theme,
				supabaseClient,
				user: data.user,
				expiresAt: session?.expires_at ?? null,
				profile: data.profile
			}
		}

		const expiresAt = session?.expires_at ?? null
		const authUser = (await supabaseClient.auth.getUser()).data.user

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

	const supabaseClient = createClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		global: { fetch },
		auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
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
