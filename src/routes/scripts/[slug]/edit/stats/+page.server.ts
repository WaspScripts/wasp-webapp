import { superValidate, setError, message } from "sveltekit-superforms/server"
import { error } from "@sveltejs/kit"
import { canEdit } from "$lib/client/supabase"
import { doLogin } from "$lib/server/supabase.server"
import { formatError, UUID_V4_REGEX } from "$lib/utils"
import { zod } from "sveltekit-superforms/adapters"
import { getScriptByID, getScriptByURL, updateScript } from "$lib/server/scripts.server"
import { scriptStatsSchema } from "$lib/client/schemas"

export const load = async ({ locals: { supabaseServer, user, session }, parent }) => {
	if (!user || !session) {
		return await doLogin(supabaseServer, origin, new URLSearchParams("login&provider=discord"))
	}

	const { script } = await parent()

	const promises = await Promise.all([
		supabaseServer
			.schema("stats")
			.from("limits")
			.select("xp_min, xp_max, gp_min, gp_max")
			.eq("id", script.id)
			.single(),
		supabaseServer
			.schema("stats")
			.from("limits_custom")
			.select("trackers, minima, maxima")
			.eq("id", script.id)
			.single()
	])

	for (let i = 0; i < promises.length; i++) {
		const { error: err } = promises[i]
		if (err) error(500, formatError(err))
	}

	const form = await superValidate(
		{
			xp_min: promises[0].data!.xp_min,
			xp_max: promises[0].data!.xp_max,
			gp_min: promises[0].data!.gp_min,
			gp_max: promises[0].data!.gp_max,
			trackers: promises[1].data!.trackers,
			minima: promises[1].data!.minima,
			maxima: promises[1].data!.maxima
		},
		zod(scriptStatsSchema)
	)

	return { form }
}

export const actions = {
	default: async ({ request, params: { slug }, locals: { supabaseServer, user, session, getProfile } }) => {
		if (!user || !session) {
			return await doLogin(supabaseServer, origin, new URLSearchParams("login&provider=discord"))
		}

		const promises = await Promise.all([
			getProfile(),
			superValidate(request, zod(scriptStatsSchema), { allowFiles: true })
		])

		const profile = promises[0]
		const form = promises[1]

		if (!profile) {
			return await doLogin(supabaseServer, origin, new URLSearchParams("login&provider=discord"))
		}

		if (!form.valid) {
			console.error("Form is not valid " + JSON.stringify(form.errors))
			return setError(form, "", "Form is not valid \n" + JSON.stringify(form.errors))
		}

		const isUUID = UUID_V4_REGEX.test(slug)
		const script = isUUID ? await getScriptByID(slug) : await getScriptByURL(slug)

		if (!script) {
			return setError(form, "", "Script not found!")
		}

		if (script.metadata.status === "official" && profile.role != "administrator") {
			return setError(form, "", "You cannot edit an official script!")
		}

		if (!canEdit(user.id, profile.role, script.protected.author)) {
			return setError(form, "", "You can't edit a script that doesn't belong to you!")
		}

		const { id, title } = script
		console.log("📊 Updating script stats: ", title, " (", id + ")")

		const limits = {
			xp_min: form.data.xp_min,
			xp_max: form.data.xp_max,
			gp_min: form.data.gp_min,
			gp_max: form.data.gp_max
		}

		const limits_custom = {
			trackers: form.data.trackers,
			minima: form.data.minima.map((value) => Number(value)),
			maxima: form.data.maxima.map((value) => Number(value))
		}

		const updates = [
			supabaseServer.schema("stats").from("limits").update(limits).eq("id", id),
			supabaseServer.schema("stats").from("limits_custom").update(limits_custom).eq("id", id)
		]

		const awaitedUpdates = await Promise.all(updates)
		const { error: errLimits } = awaitedUpdates[0]
		if (errLimits) return setError(form, "", "UPDATE stats.limits failed\n\n" + JSON.stringify(errLimits))
		const { error: errCLimits } = awaitedUpdates[1]
		if (errCLimits)
			return setError(form, "", "UPDATE stats.limits_custom failed\n\n" + JSON.stringify(errCLimits))

		await updateScript(id)
		return message(form, "Script stats data updated!")
	}
}
