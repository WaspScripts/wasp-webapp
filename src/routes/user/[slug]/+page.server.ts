import { profileSchema } from "$lib/client/schemas"
import { doLogin } from "$lib/server/supabase.server"
import { formatError } from "$lib/utils"
import { setError, superValidate } from "sveltekit-superforms"
import { zod4 } from "sveltekit-superforms/adapters"

export const load = async ({ locals: { supabaseServer, user }, url: { origin } }) => {
	if (!user) {
		return await doLogin(supabaseServer, origin, new URLSearchParams("login&provider=discord"))
	}
	return {
		form: await superValidate({ email: user?.email }, zod4(profileSchema))
	}
}

export const actions = {
	default: async ({ request, locals: { user, supabaseServer } }) => {
		const form = await superValidate(request, zod4(profileSchema))

		if (!user) return setError(form, "", "You need to login to add a script.")
		if (!form.valid) return setError(form, "", "Form is not valid!")

		const email = form.data.email === "" || user.email == form.data.email ? undefined : form.data.email
		const password = form.data.password === "" ? undefined : form.data.password
		const nonce = form.data.nonce === "" ? undefined : form.data.nonce

		if (email || password) {
			const { error: err } = await supabaseServer.auth.updateUser(
				{ email, password, nonce },
				{ emailRedirectTo: "https://waspscripts.com/auth/mail-change/" }
			)

			if (err?.code === "reauthentication_needed") {
				const { error: reauthErr } = await supabaseServer.auth.reauthenticate()
				if (reauthErr) return setError(form, "", formatError(reauthErr))
				return setError(
					form,
					"nonce",
					"Changing your password requires a verification code. We've sent one to " +
						user.email +
						", enter it here and submit again."
				)
			}

			if (err?.code === "reauthentication_not_valid") {
				return setError(form, "nonce", "That verification code is invalid or expired.")
			}

			if (err) return setError(form, "", formatError(err))
		}

		form.data.nonce = ""
		return { form, email: email != null, password: password != null }
	}
}
