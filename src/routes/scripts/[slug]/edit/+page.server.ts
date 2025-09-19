import { superValidate, setError } from "sveltekit-superforms/server"
import { error, redirect } from "@sveltejs/kit"
import { updateScriptServerSchema } from "$lib/server/schemas.server"
import { canEdit } from "$lib/client/supabase"
import { doLogin, updateImgFile, uploadFile } from "$lib/server/supabase.server"
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

	const { data: simbaVersions, error: simbaErr } = promises[0]
	if (simbaErr) error(500, simbaErr)

	const { data: wlversions, error: wlErr } = promises[1]
	if (wlErr) error(500, wlErr)

	const { data, error: err } = promises[2]
	if (err) error(404, formatError(err))

	const form = await superValidate(
		{
			published: script.published,
			status: script.metadata.status === "official",
			type: script.metadata.type === "premium",
			title: script.title,
			description: script.description,
			content: script.content,
			categories: script.metadata.categories,
			simba: data.simba,
			wasplib: data.wasplib,
			xp_min: script.stats_limits.xp_min,
			xp_max: script.stats_limits.xp_max,
			gp_min: script.stats_limits.gp_min,
			gp_max: script.stats_limits.gp_max
		},
		zod(updateScriptServerSchema),
		{ allowFiles: true, errors: false }
	)

	return {
		form,
		simbaVersions: simbaVersions.map((v) => {
			return {
				label: v.version,
				value: v.version
			}
		}),
		wlVersions: wlversions.map((v) => {
			return {
				label: v.version,
				value: v.version
			}
		})
	}
}

export const actions = {
	default: async ({
		request,
		params: { slug },
		locals: { supabaseServer, user, session, getProfile }
	}) => {
		if (!user || !session) {
			return await doLogin(supabaseServer, origin, new URLSearchParams("login&provider=discord"))
		}

		const promises = await Promise.all([
			getProfile(),
			superValidate(request, zod(updateScriptServerSchema), { allowFiles: true })
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

		if (form.data.status === true && profile.role != "administrator") {
			return setError(form, "", "You cannot a script official!")
		}

		if (!canEdit(user.id, profile.role, script.protected.author)) {
			return setError(form, "", "You can't edit a script that doesn't belong to you!")
		}

		console.log("📜 Updating script: ", script.title, " (", script.id + ")")

		const updates = []
		updates.push(
			supabaseServer
				.schema("scripts")
				.from("scripts")
				.update({
					title: form.data.title,
					description: form.data.description,
					content: form.data.content,
					published: form.data.published
				})
				.eq("id", script.id)
				.select("url")
				.single()
		)

		updates.push(
			supabaseServer
				.schema("scripts")
				.from("stats_limits")
				.update({
					xp_min: form.data.xp_min,
					xp_max: form.data.xp_max,
					gp_min: form.data.gp_min,
					gp_max: form.data.gp_max
				})
				.eq("id", script.id)
		)

		updates.push(
			supabaseServer
				.schema("scripts")
				.from("metadata")
				.update({
					status: form.data.status ? "official" : "community",
					type: form.data.type ? "premium" : "free",
					categories: form.data.categories
				})
				.eq("id", script.id)
		)

		const awaitedUpdates = await Promise.all(updates)
		const { data, error: errScript } = awaitedUpdates[0]
		if (errScript)
			return setError(form, "", "UPDATE scripts.scripts failed\n\n" + JSON.stringify(errScript))
		const { error: errLimits } = awaitedUpdates[1]
		if (errLimits)
			return setError(
				form,
				"",
				"UPDATE scripts.stats_limits failed\n\n" + JSON.stringify(errLimits)
			)
		const { error: errMetadata } = awaitedUpdates[2]
		if (errMetadata)
			return setError(form, "", "UPDATE scripts.metadata failed\n\n" + JSON.stringify(errMetadata))

		const files = []

		let revision = script.protected.revision

		if (form.data.script) {
			revision = revision + 1
			console.log("Updating script revision to ", revision)
			const path = script.id + "/" + pad(revision, 9) + "/script.simba"
			files.push(uploadFile(supabaseServer, "scripts", path, form.data.script))
		}

		if (form.data.cover) {
			console.log("Updating script cover")
			files.push(
				updateImgFile(
					supabaseServer,
					"imgs",
					"scripts/" + script.id + "/cover.jpg",
					form.data.cover
				)
			)
		}

		if (form.data.banner) {
			console.log("Updating script banner")
			files.push(
				updateImgFile(
					supabaseServer,
					"imgs",
					"scripts/" + script.id + "/banner.jpg",
					form.data.banner
				)
			)
		}

		const awaitedFiles = files.length > 0 ? await Promise.all(files) : []
		let fileErrors: string | undefined
		for (let i = 0; i < awaitedFiles.length; i++) {
			if (awaitedFiles[i]) {
				fileErrors += "File upload failed!\n" + JSON.stringify(promises[i]) + "\n\n"
			}
		}

		if (fileErrors) return setError(form, "", fileErrors)

		const lastPromises = await Promise.all([
			supabaseServer.schema("scripts").from("versions").upsert({
				id: script.id,
				revision: revision,
				simba: form.data.simba,
				wasplib: form.data.wasplib
			}),
			updateScript(script.id)
		])

		const { error: versionErr } = lastPromises[0]
		if (versionErr)
			return setError(form, "", "UPSERT scripts.versions failed\n\n" + JSON.stringify(versionErr))

		redirect(303, "/scripts/" + data!.url)
	}
}
