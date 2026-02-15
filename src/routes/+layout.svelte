<script lang="ts">
	import "../app.css"
	import { invalidate } from "$app/navigation"
	import { onMount } from "svelte"
	import Navigation from "./Navigation.svelte"
	import Footer from "./Footer.svelte"

	let { data, children } = $props()
	const { session, supabaseClient } = $derived(data)

	let callTimestamps: number[] = []
	onMount(() => {
		const { data } = supabaseClient.auth.onAuthStateChange((_, newSession) => {
			if (newSession?.expires_at !== session?.expires_at) {
				const now = Date.now()
				callTimestamps = callTimestamps.filter((ts) => now - ts < 10000)
				if (callTimestamps.length >= 10) {
					console.error(
						"Rate limit exceeded: invalidate('supabase:layout') blocked to prevent loop infinite loop."
					)
					return
				}
				callTimestamps.push(now)
				invalidate("supabase:auth")
			}
		})

		return () => data.subscription.unsubscribe()
	})
</script>

<div class="flex h-full flex-col">
	<Navigation />

	<main class="flex h-full w-full flex-col overflow-auto">
		{@render children()}

		<Footer />
	</main>
</div>
