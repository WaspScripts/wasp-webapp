<script lang="ts">
	import ScriptArticle from "./ScriptArticle.svelte"

	let { content = "" } = $props()

	const renderer = import("$lib/markdown")
</script>

{#await renderer}
	<ScriptArticle html="Loading..." />
{:then { renderMarkdown }}
	<ScriptArticle html={renderMarkdown(content)} />
{/await}
