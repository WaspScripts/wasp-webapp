const themes = new Set(["wasp", "cerberus", "concord", "fennec"])
const cookieOpts = { path: "/", maxAge: 60 * 60 * 24 * 7 * 365 }

export const actions = {
	setMode: async ({ cookies, url: { searchParams }, locals }) => {
		locals.mode = searchParams.get("mode") === "light" ? "light" : "dark"
		cookies.set("mode", locals.mode, cookieOpts)
	},

	setTheme: async ({ cookies, url: { searchParams }, locals }) => {
		const theme = searchParams.get("theme")
		locals.theme = themes.has(theme ?? "") ? (theme as typeof locals.theme) : "wasp"
		cookies.set("theme", locals.theme, cookieOpts)
	}
}
