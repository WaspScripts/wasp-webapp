import { json } from "@sveltejs/kit"
import { SUPABASE_WEBHOOK_SECRET } from "$env/static/private"
import { verifySupabaseWebhook } from "$lib/server/webhooks.server"
import { refError } from "$lib/server/report.server"
import { getSimbaVersions, resetSimbaVersions } from "$lib/server/versions.server"

export const POST = async ({ request }) => {
	await verifySupabaseWebhook(request, SUPABASE_WEBHOOK_SECRET)

	const old = await resetSimbaVersions()
	if (old.length > 0) refError(500, "Failed to reset old versions.", { old })

	const versions = await getSimbaVersions()
	return json({ success: versions.length > 0 })
}
