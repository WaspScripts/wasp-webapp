import { type Handle, type HandleServerError, redirect } from "@sveltejs/kit"
import { createServerClient } from "@supabase/ssr"
import { sequence } from "@sveltejs/kit/hooks"
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from "$env/static/public"
import type { Database } from "$lib/types/supabase"

const themes = new Set(["wasp", "cerberus", "concord", "fennec"])

const redirects: Handle = async ({ event, resolve }) => {
	if (event.url.pathname.startsWith("/refresh_token")) {
		return redirect(303, "/auth/refresh-token")
	}

	if (event.url.pathname.startsWith("/auth/callback")) {
		const path = event.url.pathname.slice(14)
		if (path === "") return resolve(event)

		const searchParams = event.url.searchParams.toString() + "&path=" + encodeURI(path.replaceAll("_-_", "/"))

		return redirect(303, "/auth/callback?" + searchParams)
	}
	return resolve(event)
}

const supabase: Handle = async ({ event, resolve }) => {
	event.locals.supabaseServer = createServerClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, { ...options, path: "/" })
				})
			}
		}
	})

	let sessionPromise: ReturnType<typeof fetchSession> | null = null

	// Memoized per request so auth is only verified once, no matter how many loads ask for it.
	event.locals.safeGetSession = () => (sessionPromise ??= fetchSession())
	event.locals.resetSession = () => {
		sessionPromise = null
	}

	async function fetchSession() {
		const { supabaseServer } = event.locals

		const promises = await Promise.all([supabaseServer.auth.getSession(), supabaseServer.auth.getUser()])

		const session = promises[0].data.session
		const user = promises[1].data.user

		if (!session || !user || promises[0].error || promises[1].error)
			return { session: null, user: null, getProfile: null }

		const remadeSession = {
			access_token: session.access_token,
			refresh_token: session.refresh_token,
			expires_at: session.expires_at,
			expires_in: session.expires_in,
			provider_token: session.provider_token,
			provider_refresh_token: session.provider_refresh_token,
			token_type: session.token_type,
			user: user
		}

		return { session: remadeSession, user }
	}

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === "content-range" || name === "x-supabase-api-version"
		}
	})
}

const authGuard: Handle = async ({ event, resolve }) => {
	const { session, user } = await event.locals.safeGetSession()
	event.locals.session = session
	event.locals.user = user

	event.locals.getProfile = async () => {
		if (!user) return null

		const { data, error: err } = await event.locals.supabaseServer
			.schema("profiles")
			.from("profiles")
			.select("id, stripe, discord, username, avatar, role")
			.eq("id", user.id)
			.single()

		if (err) return null
		return data
	}

	const now = new Date().toISOString()

	event.locals.getSubscriptions = async () => {
		if (!user) return []
		const { data, error: err } = await event.locals.supabaseServer
			.schema("profiles")
			.from("subscriptions")
			.select("id, product, price, date_start, date_end, cancel, disabled")
			.eq("user_id", user.id)
			.gte("date_end", now)

		if (err) return []
		return data
	}

	event.locals.getFreeAccess = async () => {
		if (!user) return []
		const { data, error: err } = await event.locals.supabaseServer
			.schema("profiles")
			.from("free_access")
			.select("id, product, date_start, date_end")
			.eq("user_id", user.id)
			.gte("date_end", now)

		if (err) return []
		return data
	}

	if (!event.locals.session && event.url.pathname.startsWith("/dashboard")) {
		return redirect(303, "/auth")
	}

	const response = resolve(event)
	return response
}

const appearance: Handle = async ({ event, resolve }) => {
	event.locals.mode = event.cookies.get("mode") === "light" ? "light" : "dark"
	const theme = event.cookies.get("theme")
	event.locals.theme = themes.has(theme ?? "") ? (theme as typeof event.locals.theme) : "wasp"

	return await resolve(event, {
		transformPageChunk: ({ html }) => {
			return html.replace(
				'lang="en" data-mode="%mode%" data-theme="%theme%"',
				`lang="en" data-mode="${event.locals.mode}" data-theme="${event.locals.theme}"`
			)
		}
	})
}

const performanceCheck: Handle = async ({ event, resolve }) => {
	const start = performance.now()
	const { url } = event
	const response = await resolve(event)
	const loadTime = performance.now() - start
	console.log(`└🚀 ${url} took ${loadTime.toFixed(2)} ms to load!`)
	return response
}

export const handle: Handle = sequence(redirects, appearance, supabase, authGuard, performanceCheck)

export const handleError: HandleServerError = ({ error }) => {
	if (
		error instanceof Error &&
		error.constructor.name === "SvelteKitError" &&
		"status" in error &&
		error.status === 404
	) {
		console.log(error.message)
		return
	}

	console.error("Unexpected error ocurred: ", error)
	return { message: "An unexpected error occurred" }
}
