import { error } from "@sveltejs/kit"

export function webhookError(status: number, message: string, detail?: unknown): never {
	const id = crypto.randomUUID().slice(0, 8)
	console.error(`[${id}] ${message}`, detail ?? "")
	error(status, `${message} (ref: ${id})`)
}
