import { SUPABASE_SERVICE_KEY } from "$env/static/private"
import { PUBLIC_SUPABASE_URL } from "$env/static/public"
import type { Price, Product, Profile, ProfileSubscriptions } from "$lib/types/collection"
import type { Database } from "$lib/types/supabase"
import { UUID_V4_REGEX, formatError } from "$lib/utils"
import { type SupabaseClient, createClient, type Provider } from "@supabase/supabase-js"
import { error, redirect } from "@sveltejs/kit"

export const supabaseAdmin = createClient<Database>(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY, {
	auth: { autoRefreshToken: true, persistSession: false }
})

export async function doLogin(
	supabase: SupabaseClient,
	origin: string,
	searchParams: URLSearchParams
) {
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

function updateID(str: string, id: string) {
	const regex = /{\$DEFINE SCRIPT_ID := '(.*?)'}/
	const replace = "{$DEFINE SCRIPT_ID := '" + id + "'}"
	str = str.match(regex) ? str.replace(regex, replace) : replace.concat("\n").concat(str)

	return str
}

function updateRevision(str: string, rev: number) {
	const regex = /{\$DEFINE SCRIPT_REVISION := '(.*?)'}/
	const replace = "{$DEFINE SCRIPT_REVISION := '" + rev.toString() + "'}"
	str = str.match(regex) ? str.replace(regex, replace) : replace.concat("\n").concat(str)

	return str
}

export async function updateScriptFile(file: File, id: string, revision: number) {
	let fileString = await file.text()
	fileString = updateID(updateRevision(fileString, revision), id)

	return new File([fileString], file.name, { type: "text/plain" })
}

export async function uploadFile(
	supabase: SupabaseClient,
	bucket: string,
	path: string,
	file: File
) {
	const { error: err } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
	if (err) {
		return (
			"storage " +
			bucket +
			" UPLOAD " +
			path +
			" failed with the following error: " +
			JSON.stringify(err)
		)
	}
}

export async function updateImgFile(
	supabase: SupabaseClient,
	bucket: string,
	path: string,
	file: File
) {
	const { error: err } = await supabase.storage.from(bucket).update(path, file, { upsert: true })
	if (err) {
		return (
			"storage " +
			bucket +
			" UPLOAD " +
			path +
			" failed with the following error: " +
			JSON.stringify(err)
		)
	}
}

export async function getProfile(id: string) {
	const { data, error } = await supabaseAdmin
		.schema("profiles")
		.from("profiles")
		.select("id, discord, stripe, username, avatar, private (email)")
		.eq("id", id)
		.limit(1)
		.limit(1, { foreignTable: "private" })
		.single<Profile>()

	if (error) return null
	return data
}

export async function getUsername(id: string) {
	const { data, error: err } = await supabaseAdmin
		.schema("profiles")
		.from("profiles")
		.select("username")
		.eq("id", id)
		.single()

	if (err) {
		console.error("getUsername(id): " + formatError(err))
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

export async function updateCustomerID(id: string, customer_id: string) {
	console.log("Updating profiles.profiles for user: ", id)

	const { error: err } = await supabaseAdmin
		.schema("profiles")
		.from("profiles")
		.update({ stripe: customer_id })
		.eq("id", id)

	if (err) throw error(500, formatError(err))

	return true
}

export async function removeScriptBroken(script: string) {
	console.log("Updating scripts.protected.broken for script: ", script)

	const isUUID = UUID_V4_REGEX.test(script)

	const { error: err } = await supabaseAdmin
		.schema("scripts")
		.from("protected")
		.update({ broken: false })
		.eq(isUUID ? "id" : "url", script)

	if (err) {
		error(
			500,
			"Server error, this is probably not an issue on your end!\n" +
				"UPDATE scripts.protected failed!\n\n" +
				formatError(err)
		)
	}

	return true
}

export async function updateReporters(script: string, user: string) {
	const { error: err } = await supabaseAdmin
		.schema("scripts")
		.rpc("add_reporter", { script_id: script, user_id: user })

	if (err) {
		error(
			500,
			"Server error, this is probably not an issue on your end!\n" +
				"UPDATE scripts.add_reporter postgres function failed!\n\n" +
				formatError(err)
		)
	}

	return true
}

export async function updateDownloaders(script: string, user: string) {
	const { error: err } = await supabaseAdmin
		.schema("scripts")
		.rpc("add_downloader", { script_id: script, user_id: user })

	if (err) {
		error(
			500,
			"Server error, this is probably not an issue on your end!\n" +
				"UPDATE scripts.stats_site failed!\n\n" +
				formatError(err)
		)
	}

	return true
}

export async function updateScriptNotification(id: string) {
	console.log("Updating scripts.stats_site.notified for script: ", id)

	const { error: err } = await supabaseAdmin
		.schema("scripts")
		.from("stats_site")
		.update({ notified: true })
		.eq("id", id)

	if (err) {
		console.error("scripts.stats_site.notified UPDATE failed: " + formatError(err))
		error(500, formatError(err))
	}

	return true
}

export async function addFreeAccess(
	supabase: SupabaseClient,
	id: string,
	product: string,
	date_end: string
) {
	const { error: err } = await supabase
		.schema("profiles")
		.from("free_access")
		.insert({ product: product, id: id, date_end: date_end })

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

export async function updateScripterAccount(id: string, account_id: string) {
	console.log("Updating profiles.profiles for user: ", id)

	const { error: err } = await supabaseAdmin
		.schema("profiles")
		.from("scripters")
		.update({ stripe: account_id })
		.eq("id", id)

	if (err) error(500, formatError(err))

	return true
}

export class WaspSubscription {
	static async insert(subscriptions: ProfileSubscriptions) {
		console.log("INSERT profile.subscriptions for user: ", subscriptions.user)

		const { error } = await supabaseAdmin
			.schema("profiles")
			.from("subscriptions")
			.insert(subscriptions)
		return { error }
	}

	static async upsert(subscriptions: ProfileSubscriptions) {
		console.log("UPDATE profile.subscription for user: ", subscriptions.user)

		const { data: activeData, error: errSub } = await supabaseAdmin
			.schema("profiles")
			.from("subscriptions")
			.update({
				date_end: subscriptions.date_end,
				date_start: subscriptions.date_start,
				cancel: subscriptions.cancel
			})
			.eq("subscription", subscriptions.subscription)
			.select()
			.single()

		if (!activeData) {
			console.log("UPDATE profile.subscriptions_old for user: ", subscriptions.user)
			const { data: oldData, error: errSubOld } = await supabaseAdmin
				.schema("profiles")
				.from("subscriptions_old")
				.update({
					date_end: subscriptions.date_end,
					date_start: subscriptions.date_start,
					cancel: subscriptions.cancel
				})
				.eq("subscription", subscriptions.subscription)
				.select()
				.single()

			if (!oldData) {
				console.log("UPSERT profile.subscriptions for user: ", subscriptions.user)
				const { error: errInsert } = await supabaseAdmin
					.schema("profiles")
					.from("subscriptions")
					.insert(subscriptions)

				if (errInsert) {
					console.error("errSub: " + errSub)
					console.error("errSubOld: " + errSubOld)
					console.error("errInsert: " + errInsert)
					return {
						error:
							"id: " +
							subscriptions.user +
							"errSub:" +
							JSON.stringify(errSub) +
							"errSubOld: " +
							JSON.stringify(errSubOld) +
							"errInsert: " +
							JSON.stringify(errInsert) +
							"subscriptionData:" +
							JSON.stringify(subscriptions)
					}
				}
			}
		}

		return { error: null }
	}

	static async delete(id: string) {
		console.log("DELETE profile.subscriptions: ", id)

		const { error: errSubscription } = await supabaseAdmin
			.schema("profiles")
			.from("subscriptions")
			.delete()
			.eq("subscriptions", id)

		if (errSubscription) {
			console.error(errSubscription)
			return { error: errSubscription }
		}

		return { error: null }
	}
}

export class WaspProduct {
	static async insert(product: Product) {
		console.log("INSERT stripe.products: ", product.id)
		const { error: errProducts } = await supabaseAdmin.schema("stripe").from("products").insert({
			id: product.id,
			bundle: product.bundle,
			script: product.script,
			stripe: product.stripe,
			user: product.user,
			active: true
		})

		if (errProducts) {
			console.error(errProducts)
			console.log("object: ", product)
			error(500, errProducts)
		}

		return true
	}

	static async update(id: string, name: string) {
		console.log("UPDATE stripe.products: ", id)

		const { error: err } = await supabaseAdmin
			.schema("stripe")
			.from("products")
			.update({})
			.eq("id", id)

		if (err) {
			console.error(err)
			error(500, err)
		}

		return true
	}

	static async delete(id: string) {
		console.log("DELETE scripts.products: ", id)

		const { error: errProduct } = await supabaseAdmin
			.schema("stripe")
			.from("products")
			.delete()
			.eq("id", id)

		if (errProduct) {
			console.error(errProduct)
			error(500, errProduct)
		}

		return true
	}
}

export class WaspPrice {
	static async insert(price: Price) {
		function sleep(ms: number) {
			return new Promise((resolve) => {
				setTimeout(resolve, ms)
			})
		}

		for (let attempt = 0; attempt < 3; attempt++) {
			console.log("INSERT scripts.prices: ", price.id, " attmpt: ", attempt)

			const { error: err } = await supabaseAdmin.schema("stripe").from("prices").insert(price)

			if (err) {
				console.error(err)
				console.log("object: ", price)
				if (attempt < 2) {
					await sleep(1000)
					continue
				}

				error(500, err)
			}
			break
		}

		return true
	}

	static async update(price: Price) {
		console.log("UPDATE scripts.prices: ", price.id)

		const { error: err } = await supabaseAdmin
			.schema("stripe")
			.from("prices")
			.update(price)
			.eq("id", price.id)

		if (err) {
			console.error(err)
			console.log("object: ", price)
			error(500, err)
		}

		return true
	}

	static async delete(id: string) {
		console.log("DELETE scripts.prices: ", id)

		const { error: err } = await supabaseAdmin.schema("stripe").from("prices").delete().eq("id", id)

		if (err) {
			console.error(err)
			throw error(500, err)
		}

		return true
	}
}
