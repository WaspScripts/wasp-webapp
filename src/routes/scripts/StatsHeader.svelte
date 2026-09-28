<script lang="ts">
	import { browser } from "$app/environment"
	import { page } from "$app/state"
	import type { ScriptStats } from "$lib/types/collection"
	import { formatTime, formatNumber } from "$lib/utils"

	// stats can be passed in already loaded (e.g. by a server load), otherwise they are fetched in the browser
	let { id = undefined, stats = undefined }: { id?: string; stats?: ScriptStats | null } = $props()
	const { supabaseClient } = $derived(page.data)

	const statsPromise = $derived(
		stats !== undefined ? stats : browser ? getStats(id) : new Promise<ScriptStats | null>(() => {})
	)

	async function getStats(id: string | undefined) {
		if (!id) {
			return {
				experience: Math.random() * 1000000,
				gold: Math.random() * 1000000,
				runtime: Math.random() * 1000000000
			}
		}

		const { data, error: err } = await supabaseClient
			.schema("stats")
			.from("values")
			.select("experience, gold, runtime")
			.eq("id", id)
			.single()

		if (err) {
			console.error(err)
			return null
		}

		return data
	}
</script>

<div class="h-24 text-center">
	{#await statsPromise then stats}
		{#if stats}
			{#if stats.experience > 0 || stats.gold > 0 || stats.runtime > 0}
				<h4>Total Experience Gained: {formatNumber(stats.experience)}</h4>
				<h4>Total Gold Gained: {formatNumber(stats.gold)}</h4>
				<h4>Total Runtime: {formatTime(stats.runtime)}</h4>
			{/if}
		{:else}
			<h4>Total Experience Gained: Loading...</h4>
			<h4>Total Gold Gained: Loading...</h4>
			<h4>Total Runtime: Loading...</h4>
		{/if}
	{/await}
</div>
