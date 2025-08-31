<script lang="ts">
	import { onMount } from "svelte"

	const { data } = $props()
	const { access_token, refresh_token, error } = $derived(data)
	let loading = $state(true)

	onMount(async () => {
		if (access_token && refresh_token) {
			await fetch("http://localhost:5217/", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ access_token, refresh_token })
			}).catch(() => "Failed to fetch with session")
		} else if (data.error) {
			await fetch("http://localhost:5217/", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ error })
			}).catch(() => "Failed to fetch with error")
		}

		loading = false
	})
</script>

<main class="my-32 h-screen text-center">
	{#if loading}
		<h1 class="text-xl font-bold">Loading...</h1>
	{:else if access_token && refresh_token}
		<h1 class="my-12 text-xl font-bold">You successfully logged in with WaspLauncher</h1>
		<h2 class="font-semibold">You may now close this page.</h2>
	{:else}
		<h1 class="text-xl font-bold">Failed to login!</h1>
	{/if}
</main>
