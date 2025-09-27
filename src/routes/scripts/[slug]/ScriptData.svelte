<script lang="ts">
	import { page } from "$app/state"
	import { formatNumber } from "$lib/utils"
	const { id } = $props()

	const authorButtons = ["none", "Currently Online", "All Downloads", "Downloads this month"]
	let selectedBtn = $state("none")

	async function getScriptStats() {
		const { data, error: err } = await page.data.supabaseClient
			.schema("stats")
			.from("values")
			.select("experience, gold, runtime, levels")
			.eq("id", id)
			.single()

		if (err) {
			console.error(err)
			return {
				experience: 0,
				gold: 0,
				runtime: 0,
				levels: 0
			}
		}

		return data
	}

	async function getScriptData() {
		const { data, error: err } = await page.data.supabaseClient
			.schema("stats")
			.from("website")
			.select("downloads, total")
			.eq("id", id)
			.single()

		if (err) {
			console.error(err)
			return {
				downloads: [],
				total: 0
			}
		}

		return { downloads: data.downloads, total: data.total ?? 0 }
	}

	async function getScriptMonthlyData() {
		const { data, error: err } = await page.data.supabaseClient
			.schema("stats")
			.from("website_monthly")
			.select("downloads, total")
			.eq("id", id)
			.order("date", { ascending: false })

		if (err) console.error(err)

		if (!data || data.length == 0) {
			return {
				downloads: [],
				total: 0
			}
		}

		return { downloads: data[0].downloads, total: data[0].total ?? 0 }
	}

	const scriptStats = getScriptStats()
	const scriptData = getScriptData()
	const scriptMonthlyData = getScriptMonthlyData()
</script>

<header class="text-center">
	<div class="btn-group flex-col preset-outlined-surface-200-800 p-2 md:flex-row">
		{#each authorButtons as btn, idx (btn)}
			{#if idx > 0}
				<button
					class="btn w-full {selectedBtn === btn ? 'preset-filled' : 'hover:preset-tonal'} "
					onclick={() => {
						if (selectedBtn === btn) selectedBtn = authorButtons[0]
						else selectedBtn = btn
					}}
				>
					{btn}
				</button>
			{/if}
		{/each}
	</div>

	{#if selectedBtn === authorButtons[1]}
		<h4>
			Currently Online:
			{#await scriptStats}
				Loading...
			{:then data}
				<!-- {formatNumber(data.online_users_total)} -->
				TODO...
			{/await}
		</h4>

		<div class="text-small max-h-[10rem] overflow-auto preset-outlined-surface-500">
			{#await scriptStats}
				Loading...
			{:then data}
				TODO...
				<!-- {#each data.online_users as user (user)}
					{#if user && Object.values(user).length > 0}
						{Object.values(user)[0]}
						<br />
					{/if}
				{/each} -->
			{/await}
		</div>
	{:else if selectedBtn === authorButtons[2]}
		<h4>
			Total downloads:
			{#await scriptData}
				Loading...
			{:then data}
				{formatNumber(data.total)}
			{/await}
		</h4>

		<div class="text-small max-h-[10rem] overflow-auto preset-outlined-surface-500">
			{#await scriptData}
				Loading...
			{:then data}
				{#each data.downloads as user (user)}
					{user}
					<br />
				{/each}
			{/await}
		</div>
	{:else if selectedBtn === authorButtons[3]}
		<h4>
			Total downloads/month:
			{#await scriptMonthlyData}
				Loading...
			{:then data}
				{formatNumber(data.total)}
			{/await}
		</h4>

		<div class="text-small max-h-[10rem] overflow-auto preset-outlined-surface-500">
			{#await scriptMonthlyData}
				Loading...
			{:then data}
				{#each data.downloads as user (user)}
					{user}
					<br />
				{/each}
			{/await}
		</div>
	{/if}
</header>
