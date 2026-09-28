<script lang="ts">
	import ScriptArticle from "./ScriptArticle.svelte"

	let { content = "" } = $props()

	// The markdown renderer (markdown-it + shiki) is heavy, only load it when a preview is shown.
	const renderer = import("$lib/markdown")
</script>

{#await renderer}
	<ScriptArticle html="Loading..." />
{:then { renderMarkdown }}
	<ScriptArticle html={renderMarkdown(content)} />
{/await}
