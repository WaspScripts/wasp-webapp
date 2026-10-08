import { getLlmsFullTxt, markdownHeaders } from "$lib/server/llms.server"

export const GET = async ({ locals: { supabaseServer } }) => {
	return new Response(await getLlmsFullTxt(supabaseServer), { headers: markdownHeaders })
}
