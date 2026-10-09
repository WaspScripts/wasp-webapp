export const load = async ({ locals: { safeGetSession, getProfile, mode, theme }, setHeaders }) => {
	setHeaders({
		"Strict-Transport-Security": "max-age=31536000; includeSubDomains",
		"X-Frame-Options": "SAMEORIGIN",
		"X-Content-Type-Options": "nosniff",
		"Referrer-Policy": "origin-when-cross-origin",
		"Permissions-Policy": "geolocation=(), microphone=(), camera=(), fullscreen=(self), payment=(), midi=()"
	})

	const { session, user } = await safeGetSession()

	return {
		mode,
		theme,
		user: user?.id ?? null,
		expiresAt: session?.expires_at ?? null,
		profile: await getProfile()
	}
}
