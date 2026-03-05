import { error, json } from "@sveltejs/kit"
import { SUPABASE_WEBHOOK_SECRET } from "$env/static/private"
import { hexToBytes } from "$lib/utils"
import { getScriptVersion, resetScriptVersions } from "$lib/server/versions.server"

export const POST = async ({ request }) => {
	const signature = request.headers.get("x-supabase-signature")
	const body = await request.text()

	if (!signature) error(401, "Webhook signature is missing")

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

	const payload = JSON.parse(body)

	if (!payload || payload?.table != "versions") {
		error(404, `Something is wrong with the payload: ${payload}`)
	}

	if (payload.type == "DELETE") {
		return json({ success: true })
	}

	if (payload.type == "INSERT") {
		const id: string | undefined = payload?.record?.id
		const revision: number | undefined = payload?.record?.revision

		if (!id || !revision) {
			error(404, `Missing id or revision: ${payload}`)
		}

		const version = await getScriptVersion(id, revision)
		return json({ success: version != null })
	}

	if (payload.type == "UPDATE") {
		const id: string | undefined = payload?.record?.id
		const revision: number | undefined = payload?.record?.revision
		const old_id: string | undefined = payload?.old_record?.id
		const old_revision: number | undefined = payload?.old_record?.revision

		if (!id || !revision) {
			error(404, `Missing id or revision: ${payload}`)
		}

		if (!old_id || !old_revision) {
			error(404, `Missing old_id or old_revision: ${payload}`)
		}

		if (id !== old_id) {
			error(404, `old_id and id are different: ${payload}`)
		}

		const promises = await Promise.all([
			resetScriptVersions(old_id, old_revision),
			getScriptVersion(id, revision)
		])

		return json({ success: promises[1] != null })
	}
}
