import { countryCodeSchema, dbaSchema } from "$lib/client/schemas"
import { setError, superValidate } from "sveltekit-superforms/server"
import { zod4 } from "sveltekit-superforms/adapters"
import { doLogin, supabaseAdmin } from "$lib/server/supabase.server"
import { UUID_V4_REGEX } from "$lib/utils"
import { error, redirect } from "@sveltejs/kit"
import { getScripter } from "$lib/client/supabase"
import { stripe } from "$lib/server/stripe.server"
import type Stripe from "stripe"
import type { Scripter } from "$lib/types/collection"

async function getConnectAccount(scripter: Scripter) {
	if (scripter.id == scripter.stripe) return null

	try {
		const account = await stripe.accounts.retrieve(scripter.stripe)
		return account
	} catch (err) {
		console.error("getConnectAccount error on stripe.accounts.retrieve: " + JSON.stringify(err))
		return null
	}
}

export const load = async ({ parent }) => {
	const { scripter } = await parent()
	const promises = await Promise.all([
		superValidate(zod4(countryCodeSchema)),
		superValidate(zod4(dbaSchema)),
		getConnectAccount(scripter)
	])

	promises[1].data.dba = promises[2]?.business_profile?.name ?? ""

	return {
		countryForm: promises[0],
		dbaForm: promises[1],
		account: promises[2]
	}
}

async function createConnectAccount(baseURL: string, scripter: Scripter, email: string, country: string) {
	const profile = scripter.profiles
	const requested = { requested: true }
	const params: Stripe.AccountCreateParams = {
		controller: {
			fees: { payer: "application" },
			losses: { payments: "application" },
			stripe_dashboard: { type: "express" },
			requirement_collection: "stripe"
		},
		email: email,
		country: country,
		business_type: "individual",
		business_profile: {
			mcc: "5734",
			name: profile.username,
			url: "https://waspscripts.dev/",
			support_url: "https://waspscripts.dev/",
			support_email: "support@waspscripts.com"
		},
		individual: { full_name_aliases: [profile.username, scripter.id, profile.discord] },
		capabilities: { card_payments: requested, link_payments: requested, transfers: requested },
		settings: {
			payouts: {
				schedule: { interval: "monthly", delay_days: 15, monthly_anchor: 31 },
				statement_descriptor: "waspscripts.dev",
				debit_negative_balances: false
			}
		},
		metadata: { id: scripter.id, discord: profile.discord, email: email }
	}

	let account: Stripe.Response<Stripe.Account>

	try {
		account = await stripe.accounts.create(params)
	} catch (err) {
		console.error("createConnectAccount error on stripe.accounts.create: " + JSON.stringify(err))
		return null
	}

	console.log("Stripe Account created: ", account.id, " for ", scripter.id)

	const promises = await Promise.all([
		supabaseAdmin.schema("profiles").from("scripters").update({ stripe: account.id }).eq("id", scripter.id),
		supabaseAdmin.schema("profiles").from("balances").update({ stripe: account.id }).eq("id", scripter.id),
		stripe.accountLinks
			.create({
				account: account.id,
				refresh_url: baseURL + "/dashboard/",
				return_url: baseURL + "/dashboard/",
				type: "account_onboarding"
			})
			.catch((err) => {
				console.error("createConnectAccount error on stripe.accountLinks.create: " + JSON.stringify(err))
				return null
			})
	])

	if (promises[0].error) {
		console.error(promises[0].error)
		return null
	}

	if (promises[1].error) {
		console.error(promises[1].error)
		return null
	}

	return promises[2] ? promises[2].url : null
}

async function getOnboardingLink(baseURL: string, scripter: Scripter) {
	try {
		const accountLink = await stripe.accountLinks.create({
			account: scripter.stripe,
			refresh_url: baseURL + "/api/stripe/connect/reauth",
			return_url: baseURL + "/api/stripe/connect/return",
			type: "account_onboarding"
		})
		return accountLink.url
	} catch (err) {
		console.error("getOnboardingLink error on stripe.accountLinks.create: " + JSON.stringify(err))
		return
	}
}

async function getLoginLink(scripter: Scripter) {
	const account = await getConnectAccount(scripter)
	if (!account) return null
	if (account.requirements?.currently_due && account.requirements.currently_due.length > 0) return null

	try {
		const link = await stripe.accounts.createLoginLink(account.id)
		return link.url
	} catch (err) {
		console.error("getLoginLink error on stripe.accounts.createLoginLink: " + JSON.stringify(err))
		return null
	}
}

async function updateAccountDBA(id: string, dba: string) {
	try {
		await stripe.accounts.update(id, { business_profile: { name: dba } })
		return true
	} catch (err) {
		console.error("updateAccountDBA error on stripe.accounts.update: " + JSON.stringify(err))
		return false
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
		if (user.id !== slug) {
			const profile = await getProfile()
			if (profile?.role != "administrator") error(403, "You cannot access another scripter dashboard.")
		}

		const promises = await Promise.all([
			getScripter(supabaseServer, slug),
			superValidate(request, zod4(countryCodeSchema))
		])
		const [scripter, form] = promises

		if (scripter.stripe != scripter.id) return setError(form, "", "Stripe account is already created!")
		if (!form.valid) return setError(form, "", "The country code form is not valid!")

		const link = await createConnectAccount(origin, scripter, user.email!, form.data.code)
		if (link) redirect(303, link)
		return { form }
	},

	onboardStripe: async ({
		locals: { supabaseServer, user, getProfile },
		url: { origin },
		params: { slug }
	}) => {
		if (!user) return await doLogin(supabaseServer, origin, new URLSearchParams("login&provider=discord"))
		if (!UUID_V4_REGEX.test(slug)) error(403, "Invalid dashboard UUID.")
		if (user.id !== slug) {
			const profile = await getProfile()
			if (profile?.role != "administrator") error(403, "You cannot access another scripter dashboard.")
		}

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
		if (user.id !== slug) {
			const profile = await getProfile()
			if (profile?.role != "administrator") error(403, "You cannot access another scripter dashboard.")
		}

		const [scripter, form] = await Promise.all([
			getScripter(supabaseServer, slug),
			superValidate(request, zod4(dbaSchema))
		])

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
		if (user.id !== slug) {
			const profile = await getProfile()
			if (profile?.role != "administrator") error(403, "You cannot access another scripter dashboard.")
		}

		const scripter = await getScripter(supabaseServer, slug)
		if (scripter.stripe == scripter.id) error(403, "You need a linked stripe account to edit it.")

		const link = await getLoginLink(scripter)
		if (link) redirect(303, link)
		return
	}
}
