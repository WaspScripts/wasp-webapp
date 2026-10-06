<script lang="ts">
	import { page } from "$app/state"
	import Paginator from "$lib/components/Paginator.svelte"
	import { replaceQuery } from "$lib/client/utils"
	import Head from "$lib/components/Head.svelte"
	import ScripterCard from "./ScripterCard.svelte"

	let { data } = $props()

	let { scripters, count, amount } = $derived(data)

	const pageStr = page.url.searchParams.get("page") || "-1"
	let currentPage = $state(Number(pageStr) < 0 || Number.isNaN(Number(pageStr)) ? 1 : Number(pageStr))

	let search = $state(decodeURIComponent(page.url.searchParams.get("search") || "").trim())
</script>

<Head
	title="Scripters"
	description="Meet the scripters and developers behind WaspScripts, directly and indirectly. Browse their profiles, scripts and ways to support their work."
	keywords="Scripters, Developers"
/>

<main class="min-h-screen max-w-screen">
	<header class="py-8 text-center">
		<h1>Welcome to the Developers section.</h1>
		<p>
			Here you can find information about the developers involved directly or indirectly with WaspScripts.
		</p>
	</header>

	<div class="mx-4 my-8 lg:mx-auto">
		<input
			type="text"
			placeholder="🔍 Search username, name, info, ..."
			class="mx-auto input max-w-3xl"
			bind:value={search}
			oninput={() =>
				replaceQuery(page.url, {
					page: "1",
					search: search
				})}
		/>
	</div>

	<div class="grid-cols-auto m-auto grid gap-8 lg:grid-cols-2 xl:grid-cols-3">
		{#each scripters as scripter (scripter.url)}
			<ScripterCard {scripter} />
		{/each}
	</div>

	<Paginator {currentPage} bind:pageSize={amount} {count} />
</main>
