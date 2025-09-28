<script lang="ts">
	import type { ScripterBase } from "$lib/types/collection"
	import { Avatar } from "@skeletonlabs/skeleton-svelte"

	let { scripter }: { scripter: ScripterBase } = $props()
</script>

<a
	href="/scripters/{scripter.url}"
	class="m-4 mx-auto w-full max-w-md min-w-xs card rounded-md border-2 border-surface-300-700 preset-filled-surface-200-800 card-hover hover:border-primary-300-700"
>
	<div class="text-md flex truncate font-semibold text-primary-600 dark:text-primary-500">
		<Avatar
			src={scripter.profiles.avatar}
			name={scripter.profiles.username}
			classes="border-surface-300-700 m-4 flex border-2"
		/>
		<span class="mx-8 my-auto">
			{scripter.profiles.username}
			{#if scripter.realname}
				<!-- Name -->
				<small class="truncate text-xs text-surface-400">
					A.K.A {scripter.realname}
				</small>
			{/if}
		</span>
	</div>
	<div class="flex h-24 flex-col p-3">
		<!-- content -->
		<div class="mt-4 mb-1 truncate text-sm text-stone-500">{scripter.description ?? ""}</div>
	</div>
</a>
