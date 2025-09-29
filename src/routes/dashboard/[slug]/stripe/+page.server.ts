import { countryCodeSchema, dbaSchema } from "$lib/client/schemas"
import { setError, superValidate } from "sveltekit-superforms/server"
import { zod } from "sveltekit-superforms/adapters"
import { doLogin } from "$lib/server/supabase.server"
import { UUID_V4_REGEX } from "$lib/utils"
import { error, redirect } from "@sveltejs/kit"
import { getScripter } from "$lib/client/supabase"
import {
	createAccount,
	getLoginLink,
	getOnboardingLink,
	getAccount,
	updateAccountDBA
} from "$lib/server/stripe.server"

export const load = async ({ locals: { supabaseServer }, params: { slug } }) => {
	const scripter = await getScripter(supabaseServer, slug)
	const promises = await Promise.all([
		superValidate(zod(countryCodeSchema)),
		superValidate(zod(dbaSchema)),
		getAccount(scripter)
	])

	promises[1].data.dba = promises[2]?.business_profile?.name ?? ""

	return {
		countryForm: promises[0],
		dbaForm: promises[1],
		account: promises[2]
	}
}

export const actions = {
	createStripe: async ({
		request,
		locals: { supabaseServer, user, getProfile },
		url: { origin },
		params: { slug }
	}) => {
		if (!user) return await doLogin(supabaseServer, origin, new URLSearchParams("login&provider=discord"))

		if (!UUID_V4_REGEX.test(slug)) error(403, "Invalid dashboard UUID.")

		const promises = await Promise.all([getProfile(), superValidate(request, zod(countryCodeSchema))])
		const profile = promises[0]
		const form = promises[1]

		if (user.id !== slug && profile?.role != "administrator")
			return setError(form, "", "You cannot access another scripter dashboard.")

		const scripter = await getScripter(supabaseServer, slug)
		if (scripter.stripe != scripter.id) return setError(form, "", "Stripe account is already created!")
		if (!form.valid) return setError(form, "", "The country code form is not valid!")

		const link = await createAccount(supabaseServer, origin, scripter, user.email!, form.data.code)
		if (link) redirect(303, link)
		return { form }
	},

	updateStripe: async ({
		locals: { supabaseServer, user, getProfile },
		url: { origin },
		params: { slug }
	}) => {
		if (!user) return await doLogin(supabaseServer, origin, new URLSearchParams("login&provider=discord"))
		if (!UUID_V4_REGEX.test(slug)) error(403, "Invalid dashboard UUID.")

		const profile = await getProfile()
		if (user.id !== slug && profile?.role != "administrator")
			error(403, "You cannot access another scripter dashboard.")

		const scripter = await getScripter(supabaseServer, slug)
		if (scripter.stripe == scripter.id) error(403, "You need a linked stripe account to edit it.")

		const link = await getOnboardingLink(origin, scripter)
		if (link) redirect(303, link)
		return
	},

	displayName: async ({
		request,
		locals: { supabaseServer, user, getProfile },
		url: { origin },
		params: { slug }
	}) => {
		if (!user) return await doLogin(supabaseServer, origin, new URLSearchParams("login&provider=discord"))

		if (!UUID_V4_REGEX.test(slug)) error(403, "Invalid dashboard UUID.")

		const promises = await Promise.all([getProfile(), superValidate(request, zod(dbaSchema))])
		const profile = promises[0]
		const form = promises[1]

		if (user.id !== slug && profile?.role != "administrator")
			error(403, "You cannot access another scripter dashboard.")

		const scripter = await getScripter(supabaseServer, slug)
		if (scripter.stripe == scripter.id) return setError(form, "", "The user is missing a stripe profile!")
		if (!form.valid) return setError(form, "", "The name you set is not valid!")

		const success = await updateAccountDBA(scripter.stripe, form.data.dba)
		if (!success) return setError(form, "", "Failed to update stripe's business name")
		return { form }
	},
	stripeDashboard: async ({
		locals: { supabaseServer, user, getProfile },
		url: { origin },
		params: { slug }
	}) => {
		if (!user) return await doLogin(supabaseServer, origin, new URLSearchParams("login&provider=discord"))
		if (!UUID_V4_REGEX.test(slug)) error(403, "Invalid dashboard UUID.")

		const profile = await getProfile()
		if (user.id !== slug && profile?.role != "administrator")
			error(403, "You cannot access another scripter dashboard.")

		const scripter = await getScripter(supabaseServer, slug)
		if (scripter.stripe == scripter.id) error(403, "You need a linked stripe account to edit it.")

		const link = await getLoginLink(scripter)
		if (link) redirect(303, link)
		return
	}
}
