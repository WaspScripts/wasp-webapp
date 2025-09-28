import { SUPABASE_SERVICE_KEY } from "$env/static/private"
import { PUBLIC_SUPABASE_URL } from "$env/static/public"
import type { Database } from "$lib/types/supabase"
import { formatError } from "$lib/utils"
import { type SupabaseClient, createClient, type Provider } from "@supabase/supabase-js"
import { error, redirect } from "@sveltejs/kit"

export const supabaseAdmin = createClient<Database>(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY, {
	auth: { autoRefreshToken: true, persistSession: false }
})

export async function doLogin(supabase: SupabaseClient, origin: string, searchParams: URLSearchParams) {
	const provider = searchParams.get("provider") as Provider
	const path = searchParams.get("path")

	if (!provider) error(403, "Failed to login! Provider not specified!")

	const href = origin + "/auth/callback/" + (path?.slice(3) ?? "")

	const { data, error: err } = await supabase.auth.signInWithOAuth({
		provider: provider,
		options: {
			redirectTo: href,
			scopes: "identify email guilds guilds.members.read"
		}
	})

	if (err) error(400, formatError(err))

	redirect(303, data.url)
}

export async function updateScriptFile(file: File) {
	let fileString = await file.text()
	return new File([fileString], file.name, { type: "text/plain" })
}

export async function uploadFile(supabase: SupabaseClient, bucket: string, path: string, file: File) {
	const contentType = path.endsWith(".jpg") || path.endsWith(".jpeg") ? "image/jpeg" : undefined

	const { error: err } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType })

	if (err) {
		console.error(err)
		return (
			"storage " + bucket + " UPLOAD " + path + " failed with the following error: " + JSON.stringify(err)
		)
	}
}

export async function updateImgFile(supabase: SupabaseClient, bucket: string, path: string, file: File) {
	const { error: err } = await supabase.storage
		.from(bucket)
		.update(path, file, { upsert: true, contentType: "image/jpeg" })
	if (err) {
		console.error(err)
		return (
			"storage " + bucket + " UPLOAD " + path + " failed with the following error: " + JSON.stringify(err)
		)
	}
}

export async function getUsername(id: string) {
	const { data, error: err } = await supabaseAdmin
		.schema("profiles")
		.from("profiles")
		.select("username")
		.eq("id", id)
		.single()

	if (err) {
		console.error("getUsername(" + id + "): " + formatError(err))
		return null
	}
	return data.username
}

export async function getPrivateProfile(id: string) {
	console.log("Updating profiles.profiles for user: ", id)

	const { data, error: err } = await supabaseAdmin
		.schema("profiles")
		.from("profiles")
		.select("username, discord")
		.eq("id", id)
		.single()

	if (err) {
		console.error(formatError(err))
		return false
	}

	return data
}

export async function addFreeAccess(
	supabase: SupabaseClient,
	user_id: string,
	product: string,
	date_end: string
) {
	const { error: err } = await supabase
		.schema("profiles")
		.from("free_access")
		.insert({ product, user_id, date_end })

	return err
}

export async function cancelFreeAccess(supabase: SupabaseClient, id: string, product: string) {
	const { error: err } = await supabase
		.schema("profiles")
		.from("free_access")
		.delete()
		.eq("id", id)
		.eq("product", product)

	return err
}
