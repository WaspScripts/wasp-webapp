import { assertDashboardAccess, supabaseAdmin } from "$lib/server/supabase.server"
import { getSubscriptionCounts } from "$lib/server/dashboard.server"
import { error } from "@sveltejs/kit"
import { refError } from "$lib/server/report.server"

export const load = async ({ parent, params: { slug }, locals: { supabaseServer, user, getProfile } }) => {
	if (!user) error(403, "You need to be logged in.")
	await assertDashboardAccess(user.id, slug, getProfile)

	async function getStats() {
		const { data, error: err } = await supabaseAdmin
			.schema("scripts")
			.from("author_scripts")
			.select("premium, scripts, total")
			.eq("author", slug)
			.maybeSingle()

		if (err) {
			refError(
				500,
				"Server error, this is probably not an issue on your end!\n" +
					"SELECT scripts.author_scripts postgres function failed!",
				err
			)
		}

		return {
			premium: data?.premium ?? 0,
			scripts: data?.scripts ?? [],
			total: data?.total ?? 0
		}
	}

	const statsPromise = getStats()
	const { products } = await parent()

	return {
		statsPromise,
		subscriptions: await getSubscriptionCounts(
			supabaseServer,
			products.map((product) => product.id)
		)
	}
}
