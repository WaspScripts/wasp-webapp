<script lang="ts">
	import UUID from "$lib/components/UUID.svelte"
	import type { TScriptStages } from "$lib/types/collection"
	import { scriptStages } from "$lib/utils"
	import StatsHeader from "./StatsHeader.svelte"

	const data = $props()
	let { children } = $derived(data)
	let id: string | undefined = $derived(data.id)
	let title: string | undefined = $derived(data.title)
	let username: string | undefined = $derived(data.username)
	let description: string | undefined = $derived(data.description)
	let hasLink: boolean = $derived(data.hasLink)
	let stage: TScriptStages = $derived(data.stage)
</script>

<header class="my-4 flex w-full flex-col justify-between lg:flex-row">
	<div class="my-auto lg:mx-4">
		{@render children()}
	</div>
	<div class="my-auto text-center lg:mx-4">
		<h1 class="my-4 font-bold">
			{title ? title : "Loading..."} by

			{#if hasLink && username}
				<a href="/scripters/{username}"> {username} </a>
			{:else}
				<span> {username ?? "Loading..."} </span>
			{/if}
		</h1>
		{#if stage !== "stable"}
			<div
				class="z-1 mx-auto my-4 w-fit cursor-default rounded-md preset-outlined-surface-600-400 preset-filled-surface-500 px-4 py-2 hover:preset-tonal"
			>
				{scriptStages[stage].icon + scriptStages[stage].name}
			</div>
		{/if}
		<h2 class="my-4">
			{description ?? "Loading..."}
		</h2>
		<h3 class="my-4">
			<UUID uuid={id ?? "Loading..."}></UUID>
		</h3>

		<StatsHeader {id} />
	</div>
</header>
