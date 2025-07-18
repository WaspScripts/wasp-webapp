import { SUPABASE_SCRIPTERS_WEBHOOK_SECRET } from "$env/static/private"
import { stripe } from "$lib/server/stripe.server"
import { supabaseAdmin } from "$lib/server/supabase.server"
import type { FullProfile } from "$lib/types/collection"
import { formatError } from "$lib/utils"
import { error, json } from "@sveltejs/kit"
import type Stripe from "stripe"

export const POST = async ({ request }) => {
	const hookPassword = request.headers.get("password")
	const req = await request.json()

	if (hookPassword !== SUPABASE_SCRIPTERS_WEBHOOK_SECRET)
		error(403, "Webhook secret doesn't match.")

	console.log("📌 POST => ", req)

	const { id, url }: { id: string; url: string } = req

	console.log("Creating connected account for " + id)

	const { data: profile, error: errProfile } = await supabaseAdmin
		.schema("profiles")
		.from("profiles")
		.select("id, discord, stripe, username, avatar, private!private_id_fkey (email)")
		.eq("id", id)
		.limit(1)
		.limit(1, { foreignTable: "private" })
		.single<FullProfile>()

	if (errProfile || !profile) error(500, "Counldn't find a profile for id: " + id)

	const params: Stripe.AccountCreateParams = {
		business_profile: {
			name: profile.username,
			url: "https://waspscripts.dev/"
		},
		metadata: { id: profile.id, discord: profile.discord, email: profile.private.email },
		email: profile.private.email,
		type: "express"
	}

	const account = await stripe.accounts.create(params)

	console.log("Inserting profiles.scripter for user: ", id)

	const { error: errScripter } = await supabaseAdmin
		.schema("profiles")
		.from("scripters")
		.insert({ id: profile.id, stripe: account.id, url: profile.username.replaceAll(" ", "-") })

	if (errScripter) error(500, formatError(errScripter))

	return json({ success: "true" })
}
