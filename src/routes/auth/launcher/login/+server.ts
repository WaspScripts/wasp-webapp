import { formatError } from "$lib/utils"
import { error, redirect } from "@sveltejs/kit"

export const GET = async ({ url: { origin }, locals: { launcherSupabase } }) => {
	console.log("💻 Starting launcher login!")
	const { data, error: err } = await launcherSupabase.auth.signInWithOAuth({
		provider: "discord",
		options: {
			redirectTo: origin + "/auth/launcher/",
			scopes: "identify email guilds guilds.members.read"
		}
	})

	if (err) error(400, formatError(err))

	redirect(303, data.url)
}
