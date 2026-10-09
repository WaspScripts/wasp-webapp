import { assertDashboardAccess, supabaseAdmin } from "$lib/server/supabase.server"
import { formatError } from "$lib/utils"
import { error } from "@sveltejs/kit"

export const load = async ({ parent, params: { slug }, locals: { user, getProfile } }) => {
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
			error(
				500,
				"Server error, this is probably not an issue on your end!\n" +
					"SELECT scripts.author_scripts postgres function failed!\n\n" +
					formatError(err)
			)
		}

		return {
			premium: data?.premium ?? 0,
			scripts: data?.scripts ?? [],
			total: data?.total ?? 0
		}
	}

	const statsPromise = getStats()
	const { data } = await parent()

	return {
		statsPromise,
		subscriptions: {
			subscribers: data.count,
			cancelling: data.cancelling,
			free_access: data.freeCount
		}
	}
}
