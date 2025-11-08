<script lang="ts">
	import { page } from "$app/state"
	import type { ScriptMetaData, ScriptPublic } from "$lib/types/collection"
	import { cropString, encodeSEO, scriptCategories, scriptStatus, scriptTypes } from "$lib/utils"
	import { Portal, Tooltip } from "@skeletonlabs/skeleton-svelte"

	let {
		script,
		metadata,
		customCover = $bindable(undefined)
	}: { script: ScriptPublic; metadata: ScriptMetaData; customCover: string | undefined } = $props()

	let imgLink = $derived(customCover ?? "/cover.jpg")
	const username = page.data.profile?.username ?? "USERNAME"

	const categoriesTooltip: boolean[] = $state(new Array(metadata.categories.length).fill(false))
	let status = $state(false)
	let type = $state(false)
</script>

<div
	class="flex h-96 w-64 flex-col card preset-filled-surface-200-800 shadow-sm card-hover hover:preset-outlined"
>
	<header class="m-1">
		<img src={imgLink} alt="Script cover" class="rounded-md contain-content" loading="lazy" />
	</header>
	<section class="m-2 flex h-full flex-col">
		<header class="flex h-fit flex-col">
			<span class="font-semibold whitespace-break-spaces text-primary-600 dark:text-primary-500">
				{script.title}
			</span>
			<span class="text-xs text-primary-700-300 drop-shadow">
				by
				<a href="/scripters/{encodeSEO(username.normalize('NFKC'))}" class="anchor">
					{username}
				</a>
				{#if !script.published}<small class="text-error-500">Unpublished</small>{/if}
			</span>
		</header>
		<article class="my-4 h-full overflow-y-auto text-sm break-words text-surface-600 dark:text-surface-300">
			{cropString(script.description, 80)}
		</article>
	</section>

	<footer class="m-2 flex justify-between">
		<div class="flex">
			<Tooltip
				positioning={{ placement: "top" }}
				openDelay={200}
				open={status}
				onOpenChange={(e) => (status = e.open)}
			>
				<Tooltip.Trigger class="cursor-default">
					{scriptStatus[metadata.status].icon}
				</Tooltip.Trigger>
				<Portal>
					<Tooltip.Positioner>
						<Tooltip.Content class="card preset-filled p-4">
							{scriptStatus[metadata.status].name}
						</Tooltip.Content>
					</Tooltip.Positioner>
				</Portal>
			</Tooltip>

			<Tooltip
				positioning={{ placement: "top" }}
				openDelay={200}
				open={type}
				onOpenChange={(e) => (type = e.open)}
			>
				<Tooltip.Trigger class="cursor-default">
					{scriptTypes[metadata.type].icon}
				</Tooltip.Trigger>
				<Portal>
					<Tooltip.Positioner>
						<Tooltip.Content class="card preset-filled p-4">
							{scriptTypes[metadata.type].name}
						</Tooltip.Content>
					</Tooltip.Positioner>
				</Portal>
			</Tooltip>
		</div>
		<div class="flex">
			{#each metadata.categories as category, i (category)}
				<Tooltip
					positioning={{ placement: "top" }}
					openDelay={200}
					open={categoriesTooltip[i]}
					onOpenChange={(e) => (categoriesTooltip[i] = e.open)}
				>
					<Tooltip.Trigger class="cursor-default">
						{scriptCategories[category].icon}
					</Tooltip.Trigger>
					<Portal>
						<Tooltip.Positioner>
							<Tooltip.Content class="card preset-filled p-4">
								{scriptCategories[category].name}
							</Tooltip.Content>
						</Tooltip.Positioner>
					</Portal>
				</Tooltip>
			{/each}
		</div>
	</footer>
</div>
