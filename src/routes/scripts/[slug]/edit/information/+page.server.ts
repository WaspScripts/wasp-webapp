import { superValidate, setError, message } from "sveltekit-superforms/server"
import { canEdit } from "$lib/client/supabase"
import { doLogin } from "$lib/server/supabase.server"
import { UUID_V4_REGEX } from "$lib/utils"
import { zod } from "sveltekit-superforms/adapters"
import { getScriptByID, getScriptByURL, updateScript } from "$lib/server/scripts.server"
import { scriptInfoSchema } from "$lib/client/schemas.js"

export const load = async ({ locals: { supabaseServer, user, session }, parent }) => {
	if (!user || !session) {
		return await doLogin(supabaseServer, origin, new URLSearchParams("login&provider=discord"))
	}

	const { script } = await parent()

	const form = await superValidate(
		{
			published: script.published,
			status: script.metadata.status === "official",
			type: script.metadata.type === "premium",
			title: script.title,
			description: script.description,
			content: script.content,
			categories: script.metadata.categories
		},
		zod(scriptInfoSchema)
	)

	return { form }
}

export const actions = {
	default: async ({ request, params: { slug }, locals: { supabaseServer, user, session, getProfile } }) => {
		if (!user || !session) {
			return await doLogin(supabaseServer, origin, new URLSearchParams("login&provider=discord"))
		}

		const promises = await Promise.all([getProfile(), superValidate(request, zod(scriptInfoSchema))])

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

		if (form.data.status === true && profile.role != "administrator") {
			return setError(form, "", "You cannot make a script official!")
		}

		if (!canEdit(user.id, profile.role, script.protected.author)) {
			return setError(form, "", "You can't edit a script that doesn't belong to you!")
		}

		const { id, title } = script
		console.log("🧢 Updating script information: ", title, " (", id + ")")

		const main = {
			title: form.data.title,
			description: form.data.description,
			content: form.data.content,
			published: form.data.published
		}

		const metadata = {
			status: (form.data.status ? "official" : "community") as "official" | "community",
			type: (form.data.type ? "premium" : "free") as "premium" | "free",
			categories: form.data.categories
		}

		const updates = [
			supabaseServer.schema("scripts").from("scripts").update(main).eq("id", id).select("url").single(),
			supabaseServer.schema("scripts").from("metadata").update(metadata).eq("id", id)
		]

		const awaitedUpdates = await Promise.all(updates)
		const { error: errScript } = awaitedUpdates[0]
		if (errScript) return setError(form, "", "UPDATE scripts.scripts failed\n\n" + JSON.stringify(errScript))
		const { error: errMetadata } = awaitedUpdates[1]
		if (errMetadata)
			return setError(form, "", "UPDATE scripts.metadata failed\n\n" + JSON.stringify(errMetadata))

		await updateScript(id)
		return message(form, "Script information updated!")
	}
}
