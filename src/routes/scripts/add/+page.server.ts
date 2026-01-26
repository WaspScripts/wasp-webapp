import { superValidate, setError, withFiles } from "sveltekit-superforms/server"
import { error, fail, redirect } from "@sveltejs/kit"
import { addScriptServerSchema } from "$lib/server/schemas.server"
import { scriptExists } from "$lib/client/supabase"
import { doLogin, uploadFile } from "$lib/server/supabase.server"
import { encodeSEO, formatError } from "$lib/utils"
import { zod } from "sveltekit-superforms/adapters"
import type { TScriptStages, TScriptStatus, TScriptTypes } from "$lib/types/collection"
import { pad } from "$lib/client/utils"
import { updateScript } from "$lib/server/scripts.server"
import { DISCORD_WEBHOOK } from "$env/static/private"

const scriptDefaultContent = `### {$title} by {$author}

Script ID: {$id}

Latest revision: {$revision}

Updated at: {$updated_at}

Date updated at: {$revision_date}

Time of update: {$revision_time}

{$description}

Can get {$min_xp}-{$max_xp} xp/h and {$min_gp}-{$max_gp} gp/h.

#### Required Setup:
- Item A visible in bank
- Item B visible in bank

#### Features:
- Does this cool task
- Supports X method
- Supports Y method

#### Known Issues:
- Buggy at doing Z.

#### Additional information:
You need quest ABC completed to use this.
`

export const load = async ({ locals: { supabaseServer, user, session } }) => {
	if (!user || !session) {
		return await doLogin(supabaseServer, origin, new URLSearchParams("login&provider=discord"))
	}

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
			.order("created_at", { ascending: false })
	])

	const { data: versions, error: errVersions } = promises[0]
	if (errVersions) error(500, formatError(errVersions))
	const { data: wasplib, error: errWasplib } = promises[1]
	if (errWasplib) error(500, formatError(errWasplib))

	return {
		form: await superValidate(
			{
				content: scriptDefaultContent,
				simba: versions[0].version,
				wasplib: wasplib[0].version
			},
			zod(addScriptServerSchema),
			{
				allowFiles: true,
				errors: false
			}
		),
		simbaVersions: versions ?? [],
		wlVersions: wasplib ?? []
	}
}

export const actions = {
	default: async ({ request, locals: { user, session, supabaseServer, getProfile }, fetch }) => {
		if (!user || !session) {
			return await doLogin(supabaseServer, origin, new URLSearchParams("login&provider=discord"))
		}

		const promises = await Promise.all([
			getProfile(),
			superValidate(request, zod(addScriptServerSchema), { allowFiles: true })
		])
		const profile = promises[0]
		const form = promises[1]

		if (profile?.id !== user.id) return setError(form, "", "You can't add a script for another user.")

		if (!form.valid) {
			console.error("Form is not valid " + JSON.stringify(form.errors))
			return fail(400, withFiles({ form }))
		}

		const tmp = await scriptExists(supabaseServer, encodeSEO(form.data.title + " by " + profile.username))
		if (tmp) {
			const msg = "A script with that name by you already exists! Choose a different name."
			console.error(msg)
			return setError(form, "", msg)
		}

		console.log("📜 Uploading ", form.data.title)

		if (!form.data.script) {
			return setError(form, "", "Script file is missing!")
		}

		if (!form.data.cover) {
			return setError(form, "", "Cover image is missing!")
		}

		if (!form.data.banner) {
			return setError(form, "", "Banner image is missing!")
		}

		const publicData = {
			title: form.data.title,
			description: form.data.description,
			content: form.data.content,
			published: form.data.published
		}

		const { data, error: errScript } = await supabaseServer
			.schema("scripts")
			.from("scripts")
			.insert(publicData)
			.select("id, url")
			.single()

		if (errScript) {
			return setError(form, "", "INSERT scripts.scripts failed!\n\n" + JSON.stringify(errScript))
		}

		const metadata = {
			status: (form.data.status ? "official" : "community") as TScriptStatus,
			type: (form.data.type ? "premium" : "free") as TScriptTypes,
			categories: form.data.categories,
			stage: form.data.stage as TScriptStages
		}

		const { error: errData } = await supabaseServer
			.schema("scripts")
			.from("metadata")
			.update(metadata)
			.eq("id", data.id)

		if (errData) {
			return setError(form, "", "UPDATE scripts.metadata failed!\n\n" + JSON.stringify(errData))
		}

		const path = data.id + "/" + pad(1, 9) + "/"

		const filePromises = []
		const fileNames = []

		for (let i = 0; i < form.data.script.length; i++) {
			const fileName = form.data.script[i].name == form.data.main ? "script.simba" : form.data.script[i].name
			fileNames.push(fileName)
			filePromises.push(uploadFile(supabaseServer, "scripts", path + fileName, form.data.script[i]))
		}

		filePromises.push(
			uploadFile(supabaseServer, "imgs", "scripts/" + data.id + "/cover.jpg", form.data.cover)
		)
		filePromises.push(
			uploadFile(supabaseServer, "imgs", "scripts/" + data.id + "/banner.jpg", form.data.banner)
		)

		const awaitedFiles = await Promise.all(filePromises)

		let fileErrors: string | undefined
		for (let i = 0; i < awaitedFiles.length; i++) {
			if (awaitedFiles[i]) {
				fileErrors += "File upload failed!\n" + JSON.stringify(promises[i]) + "\n\n"
			}
		}

		if (fileErrors) return setError(form, "", fileErrors)

		const versions = { revision: 1, simba: form.data.simba, wasplib: form.data.wasplib, files: fileNames }

		const { error: err } = await supabaseServer
			.schema("scripts")
			.from("versions")
			.update(versions)
			.eq("id", data.id)

		if (err) {
			return setError(form, "", formatError(err))
		}

		await updateScript(data.id)

		if (data.url) {
			const body = {
				embeds: [
					{
						title: "New Script: " + form.data.title,
						description: form.data.description,
						color: 0xf56f27,
						footer: {
							text: "Author: " + profile.username,
							icon_url: profile.avatar
						}
					}
				]
			}
			const res = await fetch(DISCORD_WEBHOOK, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body)
			})

			if (!res.ok) console.error("Failed to send webhook", await res.text())

			redirect(303, "/scripts/" + data.url)
		}
		redirect(303, "/scripts")
	}
}
