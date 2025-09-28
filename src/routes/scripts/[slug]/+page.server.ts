import { PUBLIC_SUPER_USER_ID } from "$env/static/public"
import { createCheckoutSession } from "$lib/server/stripe.server"
import { doLogin } from "$lib/server/supabase.server"
import { formatError } from "$lib/utils"
import { error, redirect } from "@sveltejs/kit"

export const load = async ({ cookies }) => {
	return { dismissed: cookies.get("warning_dismissed") === "true" }
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
		return error(500, "Something went wrong!")
	}
}
