import { superValidate, setError, message } from "sveltekit-superforms/server"
import { error } from "@sveltejs/kit"
import { scriptFilesServerSchema } from "$lib/server/schemas.server"
import { canEdit } from "$lib/client/supabase"
import { doLogin, supabaseAdmin, updateImgFile, uploadFile } from "$lib/server/supabase.server"
import { formatError, UUID_V4_REGEX } from "$lib/utils"
import { zod } from "sveltekit-superforms/adapters"
import { getScriptByID, getScriptByURL, updateScript } from "$lib/server/scripts.server"
import { pad } from "$lib/client/utils"

export const load = async ({ locals: { supabaseServer, user, session }, parent }) => {
	if (!user || !session) {
		return await doLogin(supabaseServer, origin, new URLSearchParams("login&provider=discord"))
	}

	const { script } = await parent()

	const promises = await Promise.all([
		supabaseServer
			.schema("scripts")
			.from("simba")
			.select("version")
			.limit(20)
			.order("created_at", { ascending: false }),
		supabaseServer
			.schema("scripts")
			.from("wasplib")
			.select("version")
			.limit(20)
			.order("created_at", { ascending: false }),
		supabaseServer
			.schema("scripts")
			.from("versions")
			.select("simba, wasplib")
			.eq("id", script.id)
			.eq("revision", script.protected.revision)
			.single()
	])

	for (let i = 0; i < promises.length; i++) {
		const { error: err } = promises[i]
		if (err) error(500, formatError(err))
	}

	const form = await superValidate(
		{
			simba: promises[2].data!.simba,
			wasplib: promises[2].data!.wasplib
		},
		zod(scriptFilesServerSchema),
		{ allowFiles: true, errors: false }
	)

	return {
		form,
		simbaVersions: promises[0].data ?? [],
		wlVersions: promises[1].data ?? []
	}
}

export const actions = {
	default: async ({ request, params: { slug }, locals: { supabaseServer, user, session, getProfile } }) => {
		if (!user || !session) {
			return await doLogin(supabaseServer, origin, new URLSearchParams("login&provider=discord"))
		}

		const promises = await Promise.all([
			getProfile(),
			superValidate(request, zod(scriptFilesServerSchema), { allowFiles: true })
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

		console.log("📜 Updating script files: ", title, " (", id + ")")

		const storagePromises = []
		const fileNames = []

		let revision = script.protected.revision

		if (form.data.script && form.data.script.length > 0) {
			revision = revision + 1
			console.log("Updating script revision to ", revision)
			const path = script.id + "/" + pad(revision, 9) + "/"
			for (let i = 0; i < form.data.script.length; i++) {
				const fileName =
					form.data.script[i].name == form.data.main ? "script.simba" : form.data.script[i].name
				fileNames.push(fileName)
				storagePromises.push(uploadFile(supabaseServer, "scripts", path + fileName, form.data.script[i]))
			}
		}

		if (form.data.cover) {
			console.log("Updating script cover")
			storagePromises.push(
				updateImgFile(supabaseServer, "imgs", "scripts/" + script.id + "/cover.jpg", form.data.cover)
			)
		}

		if (form.data.banner) {
			console.log("Updating script banner")
			storagePromises.push(
				updateImgFile(supabaseServer, "imgs", "scripts/" + script.id + "/banner.jpg", form.data.banner)
			)
		}

		const storage = Promise.all(storagePromises)
		const database = Promise.all([
			supabaseAdmin
				.schema("scripts")
				.from("protected")
				.update({
					revision: revision
				})
				.eq("id", id),
			supabaseServer
				.schema("scripts")
				.from("versions")
				.upsert({
					id: id,
					revision: revision,
					simba: form.data.simba,
					wasplib: form.data.wasplib,
					files: fileNames.length > 0 ? fileNames : undefined
				})
		])

		const awaitedPromises = await Promise.all([storage, database])

		let fileErrors: string | undefined
		for (let i = 0; i < awaitedPromises[0].length; i++) {
			if (awaitedPromises[0][i]) {
				fileErrors += "File upload failed!\n" + JSON.stringify(awaitedPromises[0][i]) + "\n\n"
			}
		}

		if (fileErrors) return setError(form, "", fileErrors)

		for (let i = 0; i < awaitedPromises[1].length; i++) {
			const { error: err } = awaitedPromises[1][i]
			if (err) return setError(form, "", "UPDATE versions and revisions failed\n\n" + formatError(err))
		}

		await updateScript(id)
		return message(form, "Script files data updated!")
	}
}
