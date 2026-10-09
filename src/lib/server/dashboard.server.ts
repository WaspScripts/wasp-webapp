import type { Database } from "$lib/types/supabase"
import { formatError } from "$lib/utils"
import type { SupabaseClient } from "@supabase/supabase-js"
import { error } from "@sveltejs/kit"

function queryError(table: string, err: Parameters<typeof formatError>[0]): never {
	error(
		500,
		"Server error, this is probably not an issue on your end!\n" +
			"SELECT " +
			table +
			" failed!\n\n" +
			formatError(err)
	)
}

export async function getActiveSubscriptions(supabase: SupabaseClient<Database>, products: string[]) {
	const now = new Date().toISOString()

	const [subscriptions, freeAccess] = await Promise.all([
		supabase
			.schema("profiles")
			.from("subscriptions")
			.select("user_id, product, price, cancel")
			.in("product", products)
			.gte("date_end", now),
		supabase
			.schema("profiles")
			.from("free_access")
			.select("id, product")
			.in("product", products)
			.gte("date_end", now)
	])

	if (subscriptions.error) queryError("profiles.subscriptions", subscriptions.error)
	if (freeAccess.error) queryError("profiles.free_access", freeAccess.error)

	return { subscriptions: subscriptions.data, freeAccess: freeAccess.data }
}

export async function getSubscriptionCounts(supabase: SupabaseClient<Database>, products: string[]) {
	const now = new Date().toISOString()

	const [subscribers, cancelling, freeAccess] = await Promise.all([
		supabase
			.schema("profiles")
			.from("subscriptions")
			.select("id", { count: "exact", head: true })
			.in("product", products)
			.gte("date_end", now),
		supabase
			.schema("profiles")
			.from("subscriptions")
			.select("id", { count: "exact", head: true })
			.in("product", products)
			.gte("date_end", now)
			.eq("cancel", true),
		supabase
			.schema("profiles")
			.from("free_access")
			.select("id", { count: "exact", head: true })
			.in("product", products)
			.gte("date_end", now)
	])

	if (subscribers.error) queryError("profiles.subscriptions", subscribers.error)
	if (cancelling.error) queryError("profiles.subscriptions", cancelling.error)
	if (freeAccess.error) queryError("profiles.free_access", freeAccess.error)

	return {
		subscribers: subscribers.count ?? 0,
		cancelling: cancelling.count ?? 0,
		free_access: freeAccess.count ?? 0
	}
}
