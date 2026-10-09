import markdownit from "markdown-it"
import { fromHighlighter } from "@shikijs/markdown-it/core"
import { createHighlighterCore } from "shiki/core"
import { createJavaScriptRegexEngine } from "shiki/engine/javascript"
import type { BuiltinLanguage } from "shiki"
import { imgLazyload } from "@mdit/plugin-img-lazyload"
import { sanitizeHtml } from "$lib/sanitize"

export const shikiHighlighter = await createHighlighterCore({
	themes: [import("shiki/themes/github-light.mjs"), import("shiki/themes/github-dark.mjs")],
	langs: [
		import("shiki/langs/javascript.mjs"),
		import("shiki/langs/typescript.mjs"),
		import("shiki/langs/bash.mjs"),
		import("shiki/langs/cmd.mjs"),
		import("shiki/langs/yaml.mjs"),
		import("shiki/langs/pascal.mjs"),
		import("shiki/langs/java.mjs"),
		import("shiki/langs/json.mjs")
	],
	engine: createJavaScriptRegexEngine()
})

const plainText: string = "text"

const markdownRenderer = markdownit("commonmark", {
	linkify: true,
	typographer: true
})
	.use(
		fromHighlighter(shikiHighlighter, {
			themes: { light: "github-light", dark: "github-dark" },
			fallbackLanguage: plainText as BuiltinLanguage
		})
	)
	.use(imgLazyload)

export function renderMarkdown(content: string) {
	return sanitizeHtml(markdownRenderer.render(content))
}
