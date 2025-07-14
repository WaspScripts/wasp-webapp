import { scripterSchema } from "$lib/client/schemas"
import { canEdit, getScripter } from "$lib/client/supabase"
import { mdvsvexCompile } from "$lib/server/markdown.server"
import { getPublishedScripts, getScripts, searchScriptsIndex } from "$lib/server/scripts.server"
import type { Script } from "$lib/types/collection"
import { formatError } from "$lib/utils"
import { redirect } from "@sveltejs/kit"
import { zod } from "sveltekit-superforms/adapters"
import { setError, superValidate } from "sveltekit-superforms/server"
import DOMPurify from "isomorphic-dompurify"

export const load = async ({
	url: { searchParams },
	params: { slug },
	locals: { supabaseServer, user, getProfile }
}) => {
	const pageStr = searchParams.get("page") || "-1"
	const page = Number(pageStr) < 0 || Number.isNaN(Number(pageStr)) ? 1 : Number(pageStr)

	const amountN = Number(searchParams.get("amount") || "12")
	const amount = amountN < 0 || Number.isNaN(amountN) ? 1 : amountN

	const search = decodeURIComponent(searchParams.get("search") || "").trim()

	const start = (page - 1) * amount
	const finish = start + amount - 1

	const promises = await Promise.all([getScripter(supabaseServer, slug), getProfile()])

	const scripter = promises[0]
	const profile = promises[1]

	let scripts: Script[]
	if (search !== "") scripts = await searchScriptsIndex(search)
	else {
		if (
			scripter.id === user?.id ||
			(profile && profile.role && ["moderator", "administrator"].includes(profile.role))
		)
			scripts = await getScripts()
		else scripts = await getPublishedScripts()
	}

	scripts = scripts.filter((script) => script.protected.author === scripter.id)

	const filteredScripts = scripts.slice(Math.max(0, start), Math.min(scripts.length, finish + 1))

	if (scripter.content)
		scripter.content = DOMPurify.sanitize((await mdvsvexCompile(scripter.content)).code)

	return {
		scripter,
		scripts: filteredScripts,
		amount,
		count: scripts.length,
		form: await superValidate(scripter, zod(scripterSchema))
	}
}

export const actions = {
	default: async ({ request, locals: { supabaseServer, user, getProfile }, url: { pathname } }) => {
		const promises = await Promise.all([getProfile(), superValidate(request, zod(scripterSchema))])
		const profile = promises[0]
		const form = promises[1]

		if (!form.valid) return setError(form, "", "Form is not valid.")
		if (!user || !profile) {
			const msg = "You need to login to edit a scripter."
			console.error(msg)
			return setError(form, "", msg)
		}

		if (!canEdit(profile.id, profile.role, form.data.id)) {
			const msg = "You can't edit another scripter profile."
			console.error(msg)
			return setError(form, "", msg)
		}

		const { error: err } = await supabaseServer
			.schema("profiles")
			.from("scripters")
			.update({
				content: form.data.content,
				description: form.data.description,
				github: form.data.github,
				paypal: form.data.paypal,
				realname: form.data.realname
			})
			.eq("id", form.data.id)

		if (err) return setError(form, "", formatError(err))

		redirect(303, pathname)
	}
}
