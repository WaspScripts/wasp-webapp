import { compile, escapeSvelte } from "mdsvex"
import { shikiHighlighter } from "$lib/markdown"

export async function mdvsvexCompile(content: string) {
	return await compile(content, {
		highlight: {
			highlighter: async (code: string, lang = "text") => {
				if (lang === "freepascal") lang = "pascal"
				else if (!shikiHighlighter.getLoadedLanguages().includes(lang)) lang = "text"
				return escapeSvelte(
					shikiHighlighter.codeToHtml(code, {
						lang,
						themes: { light: "github-light", dark: "github-dark" }
					})
				)
			}
		}
	})
}
