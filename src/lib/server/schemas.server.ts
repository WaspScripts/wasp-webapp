import { z } from "zod"
import { bannerImage, scriptInfoSchema, coverImage, scriptFile } from "$lib/client/schemas"
import sharp from "sharp"
import { supabaseAdmin } from "./supabase.server"
import { getSimbaVersions, getWaspLibVersions } from "./versions.server"

async function checkServerImageDimensions(file: File, width: number, height: number): Promise<boolean> {
	if (file == null) return false
	try {
		const image = sharp(Buffer.from(await file.arrayBuffer()))
		const metadata = await image.metadata()
		return metadata.width === width && metadata.height === height
	} catch (error) {
		console.error("checkServerImageDimensions() failed: " + JSON.stringify(error))
		return false
	}
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
	.refine((schema) => isValidSimbaVersion(schema.simba), "Invalid Simba version.")
	.refine((schema) => isValidWaspLibVersion(schema.wasplib), "Invalid WaspLib version.")
