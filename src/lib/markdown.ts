import markdownit from "markdown-it"
import { fromHighlighter } from "@shikijs/markdown-it/core"
import { createHighlighterCore } from "shiki/core"
import { createJavaScriptRegexEngine } from "shiki/engine/javascript"
import { full } from "markdown-it-emoji"
import { imgLazyload } from "@mdit/plugin-img-lazyload"
import DOMPurify from "isomorphic-dompurify"

// Fine-grained shiki: only the grammars/themes we use and the JS regex engine,
// instead of the full bundle (every language + the ~600KB oniguruma wasm).
const shikiHighlighter = await createHighlighterCore({
	themes: [import("shiki/themes/github-light.mjs"), import("shiki/themes/github-dark.mjs")],
	langs: [
		import("shiki/langs/javascript.mjs"),
		import("shiki/langs/typescript.mjs"),
		import("shiki/langs/bash.mjs"),
		import("shiki/langs/cmd.mjs"),
		import("shiki/langs/yaml.mjs"),
		import("shiki/langs/pascal.mjs"),
		import("shiki/langs/java.mjs")
	],
	engine: createJavaScriptRegexEngine()
})

const markdownRenderer = markdownit("commonmark", {
	linkify: true,
	typographer: true
})
	.use(fromHighlighter(shikiHighlighter, { themes: { light: "github-light", dark: "github-dark" } }))
	.use(full)
	.use(imgLazyload)

export function renderMarkdown(content: string) {
	return DOMPurify.sanitize(markdownRenderer.render(content))
}
