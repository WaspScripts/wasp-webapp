import { PUBLIC_SUPER_USER_ID } from "$env/static/public"
import { createCheckoutSession } from "$lib/server/stripe.server"
import { doLogin } from "$lib/server/supabase.server"
import { formatError } from "$lib/utils"
import { replaceScriptContent } from "$lib/client/utils"
import { renderMarkdown } from "$lib/markdown"
import { error, redirect } from "@sveltejs/kit"

const htmlCache = new Map<string, { content: string; html: string }>()

export const load = async ({ cookies, parent, locals: { supabaseServer } }) => {
	const { script } = await parent()

	const [limitsResult, statsResult] = await Promise.all([
		supabaseServer
			.schema("stats")
			.from("limits")
			.select("xp_min, xp_max, gp_min, gp_max")
			.eq("id", script.id)
			.maybeSingle(),
		supabaseServer
			.schema("stats")
			.from("values")
			.select("experience, gold, runtime")
			.eq("id", script.id)
			.maybeSingle()
	])

	if (limitsResult.error) console.error(limitsResult.error)
	if (statsResult.error) console.error(statsResult.error)

	const limits = limitsResult.data ?? { xp_min: 0, xp_max: 0, gp_min: 0, gp_max: 0 }
	const content = replaceScriptContent(script, limits)

	let cached = htmlCache.get(script.id)
	if (cached?.content !== content) {
		cached = { content, html: renderMarkdown(content) }
		htmlCache.set(script.id, cached)
	}

	return {
		dismissed: cookies.get("warning_dismissed") === "true",
		html: cached.html,
		stats: statsResult.data
	}
}

export const actions = {
	checkout: async ({
		locals: { supabaseServer, user, getProfile, getSubscriptions, getFreeAccess },
		url: { origin, searchParams }
	}) => {
		if (!user) {
			return await doLogin(supabaseServer, origin, new URLSearchParams("login&provider=discord"))
		}
		const promises = await Promise.all([getProfile(), getSubscriptions(), getFreeAccess()])
		const profile = promises[0]
		const subs = promises[1]
		const free = promises[2]
		if (!profile) {
			return await doLogin(supabaseServer, origin, new URLSearchParams("login&provider=discord"))
		}

		const productID = searchParams.get("product")
		const priceID = searchParams.get("price")

		if (!productID) {
			error(
				500,
				"Something went wrong! Seems like no product was selected. If this keeps occuring please contact support@waspscripts.com"
			)
		}

		if (!priceID) {
			error(
				500,
				"Something went wrong! Seems like no price was selected. If this keeps occuring please contact support@waspscripts.com"
			)
		}

		if (subs?.find((subscription) => subscription.product === productID)) {
			error(
				500,
				"Something went wrong! Seems like are already subscribed to this product. If this is not the case and this keeps occuring please contact support@waspscripts.com"
			)
		}

		if (free?.find((access) => access.product === productID)) {
			error(
				500,
				"Something went wrong! Seems like already have free access to this product. If this is not the case and this keeps occuring please contact support@waspscripts.com"
			)
		}

		const { data, error: priceErr } = await supabaseServer
			.schema("stripe")
			.from("prices")
			.select("id, products!prices_product_fkey (user_id, stripe)")
			.eq("product", productID)
			.eq("id", priceID)
			.eq("active", true)
			.single()

		if (priceErr) {
			error(
				500,
				"Something went wrong! Seems like that price doesn't belong to that product. If this keeps occuring please contact support@waspscripts.com Erorr message:" +
					formatError(priceErr)
			)
		}

		const stripeUser = data.products.user_id !== PUBLIC_SUPER_USER_ID ? data.products.stripe : null

		const url = await createCheckoutSession(profile.id, profile.stripe, stripeUser ?? null, data.id, origin)

		if (url) redirect(303, url)
		error(500, "Something went wrong!")
	}
}
