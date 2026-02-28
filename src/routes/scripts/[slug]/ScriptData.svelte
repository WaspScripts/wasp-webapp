<script lang="ts">
	import { page } from "$app/state"
	import UUID from "$lib/components/UUID.svelte"
	import { formatNumber } from "$lib/utils"
	import { SvelteDate } from "svelte/reactivity"
	const { id } = $props()

	async function getOnline() {
		const thirtyDaysAgo = new SvelteDate()
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

		const { data, error: err } = await page.data.supabaseClient
			.schema("stats")
			.from("online")
			.select("user_id, last_seen", { count: "exact" })
			.eq("script_id", id)
			.gte("last_seen", thirtyDaysAgo.toISOString())

		if (err) {
			console.error(err)
			return []
		}

		return data
	}

	let show = $state(false)
</script>

<header class="my-8 flex flex-col gap-8 text-center">
	<button class="mx-auto btn preset-filled-primary-500 font-bold" onclick={() => (show = !show)}>
		Currently Online
	</button>

	{#if show}
		<div class="flex flex-col rounded-md preset-outlined-surface-500 p-8">
			{#await getOnline()}
				Loading...
			{:then data}
				Total users: {data.length}
				{#each data as user}
					<small class="mx-auto my-1 w-fit rounded-md preset-outlined-surface-500 p-2">
						<UUID uuid={user.user_id}></UUID> Last seen:
						{new Date(user.last_seen).toLocaleString(navigator.language)}
					</small>
				{/each}
			{/await}
		</div>
	{/if}
</header>
