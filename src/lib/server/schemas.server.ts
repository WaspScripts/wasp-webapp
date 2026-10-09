import { z } from "zod"
import { bannerImage, scriptInfoSchema, coverImage, scriptFile } from "$lib/client/schemas"
import { supabaseAdmin } from "./supabase.server"
import { getSimbaVersions, getWaspLibVersions } from "./versions.server"

function fourCC(bytes: Uint8Array, offset: number) {
	return String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3])
}

async function getWebpDimensions(file: File) {
	const b = new Uint8Array(await file.slice(0, 30).arrayBuffer())
	if (b.length < 30 || fourCC(b, 0) !== "RIFF" || fourCC(b, 8) !== "WEBP") return null

	switch (fourCC(b, 12)) {
		case "VP8X":
			return {
				width: 1 + (b[24] | (b[25] << 8) | (b[26] << 16)),
				height: 1 + (b[27] | (b[28] << 8) | (b[29] << 16))
			}
		case "VP8 ":
			if (b[23] !== 0x9d || b[24] !== 0x01 || b[25] !== 0x2a) return null
			return {
				width: (b[26] | (b[27] << 8)) & 0x3fff,
				height: (b[28] | (b[29] << 8)) & 0x3fff
			}
		case "VP8L":
			if (b[20] !== 0x2f) return null
			return {
				width: 1 + (b[21] | ((b[22] & 0x3f) << 8)),
				height: 1 + ((b[22] >> 6) | (b[23] << 2) | ((b[24] & 0x0f) << 10))
			}
	}
	return null
}

async function checkServerImageDimensions(file: File, width: number, height: number): Promise<boolean> {
	if (file == null) return false
	const dimensions = await getWebpDimensions(file)
	return dimensions?.width === width && dimensions?.height === height
}

async function isValidSimbaVersion(version: string) {
	const versions = await getSimbaVersions()
	if (versions.some((v) => v.version === version)) return true

	const { count, error } = await supabaseAdmin
		.schema("scripts")
		.from("simba")
		.select("version", { head: true, count: "estimated" })
		.limit(1)
		.eq("version", version)

	return !error && !!count && count > 0
}

async function isValidWaspLibVersion(version: string) {
	const versions = await getWaspLibVersions()
	if (versions.some((v) => v.version === version)) return true

	const { count, error } = await supabaseAdmin
		.schema("scripts")
		.from("wasplib")
		.select("version", { head: true, count: "estimated" })
		.limit(1)
		.eq("version", version)

	return !error && !!count && count > 0
}

function hasUniqueFileNames(files: File[] | undefined, main: string | undefined) {
	if (!files) return true
	const names = files.map((file) => (file.name === main ? "script.simba" : file.name))
	return new Set(names).size === names.length
}

const duplicateFilesMessage =
	"Two files would end up with the same name. The main file is renamed to script.simba."

export const addScriptServerSchema = scriptInfoSchema
	.extend({
		simba: z
			.string()
			.length(10, "Simba versions must be exactly 10 characters long")
			.regex(/^[a-fA-F0-9]+$/, "Must be a valid hexadecimal string"),
		wasplib: z
			.string()
			.regex(/^\d{4}\.\d{2}\.\d{2}-[a-fA-F0-9]{7}$/, "Must match format YYYY.MM.DD-HEX with valid hex"),
		cover: coverImage,
		banner: bannerImage,
		script: z.array(scriptFile),
		main: z.string()
	})
	.refine((schema) => hasUniqueFileNames(schema.script, schema.main), duplicateFilesMessage)
	.refine(async (schema) => await checkServerImageDimensions(schema.cover, 300, 200))
	.refine(async (schema) => await checkServerImageDimensions(schema.banner, 1920, 768))
	.refine((schema) => isValidSimbaVersion(schema.simba), "Invalid Simba version.")
	.refine((schema) => isValidWaspLibVersion(schema.wasplib), "Invalid WaspLib version.")

export const scriptFilesServerSchema = z
	.object({
		simba: z
			.string()
			.length(10, "Simba versions must be exactly 10 characters long")
			.regex(/^[a-fA-F0-9]+$/, "Must be a valid hexadecimal string"),
		wasplib: z
			.string()
			.regex(/^\d{4}\.\d{2}\.\d{2}-[a-fA-F0-9]{7}$/, "Must match format YYYY.MM.DD-HEX with valid hex"),
		cover: coverImage.optional(),
		banner: bannerImage.optional(),
		script: scriptFile.array().optional(),
		main: z.string().nonempty().optional()
	})
	.refine((schema) => hasUniqueFileNames(schema.script, schema.main), duplicateFilesMessage)
	.refine((schema) => isValidSimbaVersion(schema.simba), "Invalid Simba version.")
	.refine((schema) => isValidWaspLibVersion(schema.wasplib), "Invalid WaspLib version.")
