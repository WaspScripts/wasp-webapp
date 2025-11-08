<script lang="ts">
	import DOMPurify from "isomorphic-dompurify"
	import { mardownRenderer } from "$lib/client/markdown"
	let { content = "" } = $props()
</script>

<header class="my-8 text-center text-primary-700 dark:text-primary-500">
	<span class="text-2xl">Description:</span>
</header>

<div class="mx-auto my-8 max-h-200 w-full max-w-4xl overflow-auto rounded-md preset-outlined-surface-500 p-8">
	<article class="text-md m-8 prose mb-12 max-w-lg md:max-w-7xl md:text-xl dark:prose-invert">
		{@html DOMPurify.sanitize(mardownRenderer.render(content))}
	</article>
</div>
