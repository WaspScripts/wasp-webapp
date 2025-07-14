import adapter from "@sveltejs/adapter-node"
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte"

const config = {
	preprocess: [vitePreprocess()],
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
	extensions: [".svelte"]
}

export default config
