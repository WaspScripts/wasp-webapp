import { SUPABASE_SERVICE_KEY } from "$env/static/private"
import { PUBLIC_SUPABASE_URL } from "$env/static/public"
import type { Database } from "$lib/types/supabase"
import { formatError, UUID_V4_REGEX } from "$lib/utils"
import { type SupabaseClient, createClient, type Provider } from "@supabase/supabase-js"
import { error, redirect } from "@sveltejs/kit"

export const supabaseAdmin = createClient<Database>(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY, {
	auth: { autoRefreshToken: true, persistSession: false }
})

export async function doLogin(
	supabase: SupabaseClient,
	origin: string,
	searchParams: URLSearchParams
): Promise<never> {
	const provider = searchParams.get("provider") as Provider

	if (!provider) error(403, "Failed to login! Provider not specified!")

	const { data, error: err } = await supabase.auth.signInWithOAuth({
		provider: provider,
		options: {
			redirectTo: origin + "/auth/callback/",
			scopes: "identify email guilds guilds.members.read"
		}
	})

	if (err) {
		error(400, formatError(err))
	}

	redirect(303, data.url)
}

export async function uploadFile(supabase: SupabaseClient, bucket: string, path: string, file: File) {
	const contentType = bucket === "imgs" ? "image/webp" : "application/octet-stream"
	const body = new Blob([file], { type: contentType })
	const { error: err } = await supabase.storage.from(bucket).upload(path, body, { upsert: true, contentType })

	if (err) {
		console.error(err)
		return (
			"storage " + bucket + " UPLOAD " + path + " failed with the following error: " + JSON.stringify(err)
		)
	}
}

export async function reuseFile(supabase: SupabaseClient, bucket: string, oldPath: string, newPath: string) {
	const { error: err } = await supabase.storage.from("scripts").copy(oldPath, newPath)
	if (err) {
		console.error(err)
		return (
			"storage " +
			bucket +
			" COPY " +
			oldPath +
			" TO " +
			newPath +
			" failed with the following error: " +
			JSON.stringify(err)
		)
	}
}

export async function updateImgFile(supabase: SupabaseClient, bucket: string, path: string, file: File) {
	const { error: err } = await supabase.storage
		.from(bucket)
		.update(path, file, { upsert: true, contentType: "image/webp" })
	if (err) {
		console.error(err)
		return (
			"storage " + bucket + " UPLOAD " + path + " failed with the following error: " + JSON.stringify(err)
		)
	}
}

export async function getUsernames(ids: string[]) {
	const usernames = new Map<string, string>()
	if (ids.length === 0) return usernames

	const { data, error: err } = await supabaseAdmin
		.schema("profiles")
		.from("profiles")
		.select("id, username")
		.in("id", [...new Set(ids)])

	if (err) {
		console.error("getUsernames(" + ids.join(", ") + "): " + formatError(err))
		return usernames
	}

	for (const { id, username } of data) usernames.set(id, username)
	return usernames
}

export async function addFreeAccess(user_id: string, product: string, date_end: string) {
	const { error: err } = await supabaseAdmin
		.schema("profiles")
		.from("free_access")
		.insert({ product, user_id, date_end })

	return err
}

export async function addFreeAccessRole(role: string, product: string, date_end: string) {
	role = role.toLowerCase()
	if (["administrator", "moderator", "scripter", "tester"].includes(role)) return null
	if (!["contributor"].includes(role)) return null

	const { data, error, count } = await supabaseAdmin
		.schema("profiles")
		.from("profiles")
		.select("id", { count: "exact", head: false })
		.eq("role", role as Database["profiles"]["Enums"]["roles"])

	if (error) return formatError(error)
	if (!data || data.length === 0) return "No users found for that role."
	if (!count || count === 0) return "No users found for that role."

	const inserts = data.slice(0, 100).map((user) => ({
		product,
		user_id: user.id,
		date_end
	}))

	const { error: err } = await supabaseAdmin.schema("profiles").from("free_access").insert(inserts)

	if (err) return formatError(err)

	if (count > 100) {
		return "This role has too many users, only the first 100 in the database were added."
	}
	return null
}

export async function cancelFreeAccess(id: string, product: string) {
	const { error: err } = await supabaseAdmin
		.schema("profiles")
		.from("free_access")
		.delete()
		.eq("id", id)
		.eq("product", product)

	return err
}

type GetProfile = App.Locals["getProfile"]

export async function assertDashboardAccess(userID: string, slug: string, getProfile: GetProfile) {
	if (!UUID_V4_REGEX.test(slug)) error(403, "Invalid dashboard UUID.")
	if (userID === slug) return
	const profile = await getProfile()
	if (profile?.role != "administrator") error(403, "You cannot access another scripter dashboard.")
}

export async function assertOwnerOrAdmin(owned: boolean, getProfile: GetProfile) {
	if (owned) return
	const profile = await getProfile()
	if (profile?.role != "administrator") error(403, "That doesn't belong to this dashboard.")
}

export async function assertProductAccess(product: string, slug: string, getProfile: GetProfile) {
	const { count, error: err } = await supabaseAdmin
		.schema("stripe")
		.from("products")
		.select("id", { count: "exact", head: true })
		.eq("id", product)
		.eq("user_id", slug)

	if (err) error(500, formatError(err))
	await assertOwnerOrAdmin(!!count, getProfile)
}

export async function assertSubscriptionAccess(subscription: string, slug: string, getProfile: GetProfile) {
	const { data, error: err } = await supabaseAdmin
		.schema("profiles")
		.from("subscriptions")
		.select("product")
		.eq("id", subscription)
		.maybeSingle()

	if (err) error(500, formatError(err))
	if (!data) return await assertOwnerOrAdmin(false, getProfile)
	await assertProductAccess(data.product, slug, getProfile)
}

export const LOGIN_REDIRECT_COOKIE = "login_redirect"

/** Only same-origin absolute paths, so the post-login redirect can't leave the site. */
export function isSafePath(path: string) {
	return path.startsWith("/") && !path.startsWith("//") && !path.includes("\\")
}
