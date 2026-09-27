export const load = async ({ locals: { safeGetSession, mode, theme }, cookies, setHeaders }) => {
	setHeaders({
		"Strict-Transport-Security": "max-age=31536000; includeSubDomains",
		"X-Frame-Options": "SAMEORIGIN",
		"X-Content-Type-Options": "nosniff",
		"Referrer-Policy": "origin-when-cross-origin",
		"Permissions-Policy":
			"geolocation=(self), microphone=(self), camera=(self), fullscreen=(self), payment=(self), midi=(self)"
	})

	const { session, user } = await safeGetSession()

	return {
		mode,
		theme,
		session,
		user,
		cookies: cookies.getAll()
	}
}
