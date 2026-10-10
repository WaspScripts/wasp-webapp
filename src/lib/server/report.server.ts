import { error } from "@sveltejs/kit"

export function errorRef(message: string, detail?: unknown) {
	const id = crypto.randomUUID().slice(0, 8)
	console.error(`[${id}] ${message}`, detail ?? "")
	return `${message} (ref: ${id})`
}

export function refError(status: number, message: string, detail?: unknown): never {
	error(status, errorRef(message, detail))
}
