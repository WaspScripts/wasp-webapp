import { getLlmsTxt, markdownHeaders } from "$lib/server/llms.server"

export const GET = async ({ locals: { supabaseServer } }) => {
	return new Response(await getLlmsTxt(supabaseServer), { headers: markdownHeaders })
}
