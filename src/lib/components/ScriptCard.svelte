<script lang="ts">
	import { goto } from "$app/navigation"
	import { PUBLIC_SUPABASE_URL } from "$env/static/public"
	import type { Script } from "$lib/types/collection"
	import {
		cropString,
		encodeSEO,
		scriptCategories,
		scriptStages,
		scriptStatus,
		scriptTypes
	} from "$lib/utils"
	import { Portal, Tooltip } from "@skeletonlabs/skeleton-svelte"

	let { script, customCover, link }: { script: Script; customCover?: string; link?: string } = $props()

	let imgLink = $derived(
		customCover ?? PUBLIC_SUPABASE_URL + "/storage/v1/object/public/imgs/scripts/" + script.id + "/cover.jpg"
	)

	const categoriesTooltip: boolean[] = $state(new Array(script?.metadata.categories.length).fill(false))
	let status = $state(false)
	let type = $state(false)
</script>

<div
	class="mx-auto flex h-fit w-fit flex-col card preset-filled-surface-200-800 shadow-sm card-hover hover:preset-outlined"
	class:cursor-pointer={link}
>
	<button
		class="m-1"
		onclick={() => {
			if (link) goto(link)
		}}
	>
		{#if script.metadata.stage !== "stable"}
			<div
				class="absolute z-1 m-2 w-fit rounded-md preset-outlined-surface-600-400 preset-filled-surface-500 px-1"
			>
				{scriptStages[script.metadata.stage].icon + scriptStages[script.metadata.stage].name}
			</div>
		{/if}
		<img src={imgLink} alt="Script cover" class="rounded-md contain-content" loading="lazy" />
	</button>
	<button
		class="mx-auto my-2 flex h-44 w-64 flex-col"
		onclick={() => {
			if (link) goto(link)
		}}
	>
		<header class="flex h-fit flex-col">
			<span class="font-semibold whitespace-break-spaces text-primary-600 dark:text-primary-500">
				{script.title}
			</span>
			<span class="text-xs text-primary-700-300 drop-shadow">
				by
				<a href="/scripters/{encodeSEO(script.protected.username.replaceAll(' ', '-'))}" class="anchor">
					{script.protected.username}
				</a>
				{#if !script.published}<small class="text-error-500">Unpublished</small>{/if}
			</span>
		</header>
		<article
			class="my-4 h-full overflow-y-auto text-sm wrap-break-word text-surface-600 dark:text-surface-300"
		>
			{cropString(script.description, 80)}
		</article>
	</button>

	<footer class="m-2 flex cursor-default justify-between">
		<div class="flex">
			<Tooltip
				positioning={{ placement: "top" }}
				openDelay={200}
				open={status}
				onOpenChange={(e) => (status = e.open)}
			>
				<Tooltip.Trigger class="cursor-default">
					{scriptStatus[script.metadata.status].icon}
				</Tooltip.Trigger>
				<Portal>
					<Tooltip.Positioner>
						<Tooltip.Content class="card preset-filled p-4">
							{scriptStatus[script.metadata.status].name}
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
					{scriptTypes[script.metadata.type].icon}
				</Tooltip.Trigger>
				<Portal>
					<Tooltip.Positioner>
						<Tooltip.Content class="card preset-filled p-4">
							{scriptTypes[script.metadata.type].name}
						</Tooltip.Content>
					</Tooltip.Positioner>
				</Portal>
			</Tooltip>
		</div>
		<div class="flex">
			{#each script.metadata.categories as category, i (i)}
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
