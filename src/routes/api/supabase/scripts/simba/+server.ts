import { error, json } from "@sveltejs/kit"
import { SUPABASE_WEBHOOK_SECRET } from "$env/static/private"
import { base64ToBytes } from "$lib/utils"
import { getSimbaVersions, resetSimbaVersions } from "$lib/server/versions.server"

export const POST = async ({ request }) => {
	const signature = request.headers.get("x-supabase-signature")
	const bodyPromise = request.text()
	if (!signature) error(401, "Webhook signature is missing")

	const encoder = new TextEncoder()
	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(SUPABASE_WEBHOOK_SECRET),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["verify"]
	)

	const body = await bodyPromise
	const isValid = await crypto.subtle.verify("HMAC", key, base64ToBytes(signature), encoder.encode(body))

	if (!isValid) {
		console.log("Signature is invalid!\n", "Signature: ", signature, "\nBody: ", body)
		error(403, "Webhook signature is not valid")
	}

	const old = await resetSimbaVersions()
	if (old.length > 0) error(500, "Failed to reset old versions.")

	const versions = await getSimbaVersions()
	return json({ success: versions.length > 0 })
}
