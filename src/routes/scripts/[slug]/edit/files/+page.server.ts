import { superValidate, setError, message } from "sveltekit-superforms/server"
import { error } from "@sveltejs/kit"
import { scriptFilesServerSchema } from "$lib/server/schemas.server"
import { canEdit } from "$lib/client/supabase"
import { doLogin, reuseFile, supabaseAdmin, updateImgFile, uploadFile } from "$lib/server/supabase.server"
import { formatError, UUID_V4_REGEX } from "$lib/utils"
import { zod } from "sveltekit-superforms/adapters"
import { getScriptByID, getScriptByURL, updateScript } from "$lib/server/scripts.server"
import { pad } from "$lib/client/utils"
import { getScriptVersion, getSimbaVersions, getWaspLibVersions } from "$lib/server/versions.server.js"

export const load = async ({ locals: { supabaseServer, user, session }, parent }) => {
	if (!user || !session) {
		return await doLogin(supabaseServer, origin, new URLSearchParams("login&provider=discord"))
	}

	const { script } = await parent()

	const promises = await Promise.all([
		getSimbaVersions(),
		getWaspLibVersions(),
		getScriptVersion(script.id, script.protected.revision)
	])

	const simbaVersions = promises[0]
	const wasplibVersions = promises[1]
	const scriptVersions = promises[2]

	if (simbaVersions.length == 0) error(500, "Failed to get Simba versions.")
	if (wasplibVersions.length == 0) error(500, "Failed to get WaspLib versions.")
	if (!scriptVersions) error(500, "Script versions is empty")

	const form = await superValidate(
		{
			simba: scriptVersions.simba,
			wasplib: scriptVersions.wasplib
		},
		zod(scriptFilesServerSchema),
		{ allowFiles: true, errors: false }
	)

	return {
		form,
		simbaVersions: simbaVersions,
		wlVersions: wasplibVersions
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
		const fileNames: string[] = []

		const revision = script.protected.revision + 1
		console.log("Updating script revision to ", revision)

		if (form.data.script && form.data.script.length > 0) {
			const path = script.id + "/" + pad(revision, 9) + "/"
			for (let i = 0; i < form.data.script.length; i++) {
				const fileName =
					form.data.script[i].name == form.data.main ? "script.simba" : form.data.script[i].name
				fileNames.push(fileName)
				const promise = uploadFile(supabaseServer, "scripts", path + fileName, form.data.script[i])
				storagePromises.push(promise)
			}
		} else {
			const { data: filesData, error: filesError } = await supabaseServer
				.schema("scripts")
				.from("versions")
				.select("files")
				.eq("id", id)
				.eq("revision", script.protected.revision)
				.single()

			if (filesError) {
				console.error(filesError)
				error(500, "Server failed to retrieve old versions of the script.")
			}

			const old_path = script.id + "/" + pad(script.protected.revision, 9) + "/"
			const new_path = script.id + "/" + pad(revision, 9) + "/"

			filesData.files.forEach((name) => {
				fileNames.push(name)
				const promise = reuseFile(supabaseServer, "scripts", old_path + name, new_path + name)
				storagePromises.push(promise)
			})
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
			supabaseAdmin.schema("scripts").from("protected").update({ revision }).eq("id", id),
			supabaseServer
				.schema("scripts")
				.from("versions")
				.upsert({
					id,
					revision,
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
		return message(
			form,
			"Script files data updated! You may need to refresh the page to see the changes. Images may take 24h to change."
		)
	}
}
