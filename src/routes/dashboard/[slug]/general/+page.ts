import { UUID_V4_REGEX, formatError } from "$lib/utils"
import { error } from "@sveltejs/kit"

export const load = async ({ parent, params: { slug } }) => {
	const { user, profile, supabaseClient, data } = await parent()
	if (!user) error(403, "You need to be logged in.")
	if (!UUID_V4_REGEX.test(slug)) error(403, "Invalid dashboard UUID.")
	if (user.id !== slug && profile?.role != "administrator")
		error(403, "You cannot access another scripter dashboard.")

	async function getStats() {
		const { data, error: err } = await supabaseClient
			.schema("scripts")
			.from("author_scripts")
			.select("*")
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

	return {
		stats: await getStats(),
		subscriptions: {
			subscribers: data.count,
			cancelling: data.cancelling,
			free_access: data.freeCount
		}
	}
}
