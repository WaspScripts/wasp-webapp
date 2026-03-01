<script lang="ts">
	import { page } from "$app/state"
	import UUID from "$lib/components/UUID.svelte"
	import { SvelteDate } from "svelte/reactivity"
	const { id } = $props()

	async function getOnline(minutes: number) {
		const cutoffDate = new SvelteDate()
		cutoffDate.setMinutes(cutoffDate.getMinutes() - minutes)

		const { data, error: err } = await page.data.supabaseClient
			.schema("stats")
			.from("online")
			.select("user_id, last_seen", { count: "exact" })
			.eq("script_id", id)
			.gte("last_seen", cutoffDate.toISOString())

		if (err) {
			console.error(err)
			return []
		}

		return data
	}

	let show = $state(false)
	let timeframe: number = $state(5)
</script>

<header class="my-8 flex flex-col gap-8 text-center">
	<button class="mx-auto btn preset-filled-primary-500 font-bold" onclick={() => (show = !show)}>
		Currently Online
	</button>

	{#if show}
		<div class="flex flex-col gap-6 rounded-md preset-outlined-surface-500 p-8">
			<label class="label">
				<span class="label-text">Timeframe:</span>
				<select class="mx-auto select w-fit" bind:value={timeframe}>
					<option value={5}>5 Minutes</option>
					<option value={24 * 60}>24 Hours</option>
					<option value={7 * 24 * 60}>7 Days</option>
					<option value={30 * 24 * 60}>30 Days</option>
				</select>
			</label>

			<div class="flex flex-col gap-2">
				{#await getOnline(timeframe)}
					Loading...
				{:then data}
					Total users: {data.length}
					{#each data as user (user.user_id)}
						<small class="mx-auto my-1 w-fit rounded-md preset-outlined-surface-500 p-2">
							<UUID uuid={user.user_id}></UUID> Last seen:
							{new Date(user.last_seen).toLocaleString(navigator.language)}
						</small>
					{/each}
				{/await}
			</div>
		</div>
	{/if}
</header>
