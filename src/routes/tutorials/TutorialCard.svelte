<script lang="ts">
	import type { Tutorial } from "$lib/types/collection"
	import { encodeSEO } from "$lib/utils"

	const { tutorial }: { tutorial: Tutorial } = $props()

	const link = $derived(
		"/tutorials/" + (tutorial ? encodeSEO(tutorial.title + " by " + tutorial.username) : "")
	)

	const style =
		tutorial.level === 0
			? "ring-sky-400 dark:ring-sky-500"
			: tutorial.level === 1
				? "ring-orange-400 dark:ring-orange-500"
				: "ring-red-400 dark:ring-red-500"
</script>

<a
	href={link}
	class="m-4 block max-w-160 rounded-md preset-filled-surface-100-900 ring-2 hover:preset-tonal-surface {style}"
>
	<div>
		<div class="flex flex-col p-3">
			<div class="text-md text-shadow truncate font-semibold text-primary-500">
				{tutorial.title}
				{#if !tutorial.published}<small class="text-error-500">Unpublished</small>{/if}
			</div>

			<small class="mt-1 truncate text-xs text-surface-400">
				by {tutorial.username}
			</small>

			<div class="mt-4 mb-1 text-sm text-surface-600 dark:text-surface-300">
				{tutorial.description}
			</div>
		</div>

		<div class="flex">
			<span
				class="inline-block rounded-tr-md rounded-bl-md px-2.5 py-1 text-center text-xs font-bold text-white
				{tutorial.level === 0 ? 'bg-sky-500' : tutorial.level === 1 ? 'bg-orange-500 ' : 'bg-red-500 '}"
			>
				{#if tutorial.level === 0}Basic{:else if tutorial.level === 1}Intermediate{:else}Advanced{/if}
				tutorial
			</span>
		</div>
	</div>
</a>
