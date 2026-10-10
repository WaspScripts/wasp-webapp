import { json } from "@sveltejs/kit"
import { SUPABASE_WEBHOOK_SECRET } from "$env/static/private"
import { getScriptVersion, resetScriptVersions } from "$lib/server/versions.server"
import { verifySupabaseWebhook } from "$lib/server/webhooks.server"
import { refError } from "$lib/server/report.server"

export const POST = async ({ request }) => {
	const body = await verifySupabaseWebhook(request, SUPABASE_WEBHOOK_SECRET)

	const payload = JSON.parse(body)

	if (!payload || payload?.table != "versions") {
		refError(404, "Something is wrong with the payload.", { payload })
	}

	if (payload.type == "DELETE") {
		return json({ success: true })
	}

	if (payload.type == "INSERT") {
		const id: string | undefined = payload?.record?.id
		const revision: number | undefined = payload?.record?.revision

		if (!id || !revision) {
			refError(404, "Missing id or revision.", { payload })
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
			refError(404, "Missing id or revision.", { payload })
		}

		if (!old_id || !old_revision) {
			refError(404, "Missing old_id or old_revision.", { payload })
		}

		if (id !== old_id) {
			refError(404, "old_id and id are different.", { payload })
		}

		const promises = await Promise.all([
			resetScriptVersions(old_id, old_revision),
			getScriptVersion(id, revision)
		])

		return json({ success: promises[1] != null })
	}
}
