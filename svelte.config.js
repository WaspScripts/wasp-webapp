import { mdsvex, escapeSvelte } from "mdsvex"
import adapter from "@sveltejs/adapter-node"
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte"
import { getSingletonHighlighter } from "shiki"

const shikiHighlighter = await getSingletonHighlighter({
	themes: ["github-dark", "github-light"],
	langs: ["javascript", "typescript", "bash", "cmd", "yml", "yaml", "pascal", "java", "json"]
})

const mdsvexOptions = {
	extensions: [".md"],
	highlight: {
		highlighter: async (code, lang = "text") => {
			if (lang === "freepascal") lang = "pascal"
			const html = escapeSvelte(
				shikiHighlighter.codeToHtml(code, {
					lang,
					themes: { light: "github-light", dark: "github-dark" }
				})
			)
			return `{@html \`${html}\` }`
		}
	}
}

const config = {
	preprocess: [vitePreprocess(), mdsvex(mdsvexOptions)],
	kit: {
		adapter: adapter(),
		csp: {
			mode: "auto",
			directives: {
				"connect-src": [
					"self",
					"ws://localhost:*",
					"https://db.waspscripts.dev",
					"ws://db.waspscripts.dev",
					"wss://db.waspscripts.dev"
				],
				"frame-src": [
					"self",
					"https://stripe-data-exports.s3.amazonaws.com/",
					"https://js.stripe.com",
					"https://connect-js.stripe.com",
					"https://www.youtube.com/"
				],
				"script-src": [
					"self",
					"https://js.stripe.com/",
					"https://connect-js.stripe.com",
					"unsafe-inline",
					"wasm-unsafe-eval"
				],
				"base-uri": ["self"],
				"object-src": ["none"]
			}
		}
	},
	extensions: [".svelte", ".svx", ".md"]
}

export default config
