import { error } from "@sveltejs/kit"
import { base64ToBytes } from "$lib/utils"

export function sendDiscordWebhook(url: string, body: object) {
	fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body)
	})
		.then(async (res) => {
			if (!res.ok) console.error("Failed to send Discord webhook", res.status, await res.text())
		})
		.catch((err) => console.error("Failed to send Discord webhook", err))
}

export function webhookError(status: number, message: string, detail?: unknown): never {
	const id = crypto.randomUUID().slice(0, 8)
	console.error(`[${id}] ${message}`, detail ?? "")
	error(status, `${message} (ref: ${id})`)
}

export async function verifySupabaseWebhook(request: Request, secret: string) {
	const signature = request.headers.get("x-supabase-signature")
	if (!signature) error(401, "Webhook signature is missing")

	const body = await request.text()

	const encoder = new TextEncoder()
	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["verify"]
	)

	let isValid = false
	try {
		isValid = await crypto.subtle.verify("HMAC", key, base64ToBytes(signature), encoder.encode(body))
	} catch (err) {
		console.log("Signature is malformed!\n", "Signature: ", signature, "\nError: ", err)
	}

	if (!isValid) {
		console.log("Signature is invalid!\n", "Signature: ", signature, "\nBody: ", body)
		error(403, "Webhook signature is not valid")
	}

	return body
}
