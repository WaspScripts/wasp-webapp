import { error, json } from "@sveltejs/kit"
import { SUPABASE_WEBHOOK_SECRET } from "$env/static/private"
import { hexToBytes } from "$lib/utils"
import { getSimbaVersions, resetSimbaVersions } from "$lib/server/versions.server"

export const POST = async ({ request }) => {
	const signature = request.headers.get("x-supabase-signature")
	const body = await request.text()

	if (!signature) error(401, "Webhook signature is missing")
	console.log("Signature: ", signature)

	const encoder = new TextEncoder()
	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(SUPABASE_WEBHOOK_SECRET),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["verify"]
	)

	const isValid = await crypto.subtle.verify("HMAC", key, hexToBytes(signature), encoder.encode(body))

	if (!isValid) error(403, "Webhook signature is not valid")

	const old = await resetSimbaVersions()
	if (old.length > 0) error(500, "Failed to reset old versions.")

	const versions = await getSimbaVersions()
	return json({ success: versions.length > 0 })
}
