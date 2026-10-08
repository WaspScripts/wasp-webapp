import { markdownResponse } from "$lib/server/llms.server"

export const GET = async ({ params: { slug }, locals: { supabaseServer } }) =>
	markdownResponse("scripters", slug, supabaseServer)
