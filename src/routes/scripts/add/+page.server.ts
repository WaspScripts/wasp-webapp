import { superValidate, setError, withFiles } from "sveltekit-superforms/server"
import { error, fail, redirect } from "@sveltejs/kit"
import { addScriptServerSchema } from "$lib/server/schemas.server"
import { scriptExists } from "$lib/client/supabase"
import { doLogin, uploadFile } from "$lib/server/supabase.server"
import { encodeSEO, formatError } from "$lib/utils"
import { zod } from "sveltekit-superforms/adapters"
import type { TScriptStatus, TScriptTypes } from "$lib/types/collection"
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

	for (let i = 0; i < promises.length; i++) {
		const { error: err } = promises[i]
		if (err) error(500, formatError(err))
	}

	return {
		form: await superValidate(
			{
				content: scriptDefaultContent,
				simba: promises[0].data![0].version,
				wasplib: promises[1].data![0].version,
				trackers: [],
				minima: [],
				maxima: []
			},
			zod(addScriptServerSchema),
			{
				allowFiles: true,
				errors: false
			}
		),
		simbaVersions: promises[0].data!.map((v) => ({ label: v.version, value: v.version })),
		wlVersions: promises[1].data!.map((v) => ({ label: v.version, value: v.version }))
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

		if (profile?.id !== user.id)
			return setError(form, "", "You can't add a script for another user.")

		if (!form.valid) {
			console.error("Form is not valid " + JSON.stringify(form.errors))
			return fail(400, withFiles({ form }))
		}

		const tmp = await scriptExists(
			supabaseServer,
			encodeSEO(form.data.title + " by " + profile.username)
		)
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
			categories: form.data.categories
		}

		const limits = {
			xp_min: form.data.xp_min,
			xp_max: form.data.xp_max,
			gp_min: form.data.gp_min,
			gp_max: form.data.gp_max
		}

		const limits_custom = {
			trackers: form.data.trackers,
			minima: form.data.minima,
			maxima: form.data.maxima
		}

		const versions = { revision: 1, simba: form.data.simba, wasplib: form.data.wasplib }

		const inserts = [
			supabaseServer.schema("scripts").from("metadata").update(metadata).eq("id", data.id),
			supabaseServer.schema("stats").from("limits").update(limits).eq("id", data.id),
			supabaseServer.schema("stats").from("limits_custom").update(limits_custom).eq("id", data.id),
			supabaseServer.schema("scripts").from("versions").update(versions).eq("id", data.id)
		]

		const awaitedInserts = await Promise.all(inserts)

		const { error: errData } = awaitedInserts[0]
		const { error: errLimits } = awaitedInserts[1]

		if (errData) {
			return setError(form, "", "UPDATE scripts.metadata failed!\n\n" + JSON.stringify(errData))
		}
		if (errLimits) {
			return setError(form, "", "UPDATE stats.limits failed!\n\n" + JSON.stringify(errLimits))
		}

		//rename all scripts to script so we can always fetch them later regardless of name changes.
		const path = data.id + "/" + pad(1, 9) + "/script.simba"

		const awaitedFiles = await Promise.all([
			uploadFile(supabaseServer, "scripts", path, form.data.script),
			uploadFile(supabaseServer, "imgs", "scripts/" + data.id + "/cover.jpg", form.data.cover),
			uploadFile(supabaseServer, "imgs", "scripts/" + data.id + "/banner.jpg", form.data.banner)
		])

		let fileErrors: string | undefined
		for (let i = 0; i < awaitedFiles.length; i++) {
			if (awaitedFiles[i]) {
				fileErrors += "File upload failed!\n" + JSON.stringify(promises[i]) + "\n\n"
			}
		}

		//FINISH!
		if (fileErrors) return setError(form, "", fileErrors)

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
