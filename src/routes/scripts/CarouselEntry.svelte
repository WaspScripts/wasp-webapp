<script lang="ts">
	import { goto } from "$app/navigation"
	import { PUBLIC_SUPABASE_URL } from "$env/static/public"
	import { encodeSEO } from "$lib/utils"

	const {
		id,
		title = "Loading...",
		username = null,
		priority = true
	}: { id?: string; title?: string; username?: string | null; priority?: boolean } = $props()

	const src = $derived(
		id
			? PUBLIC_SUPABASE_URL + "/storage/v1/object/public/imgs/scripts/" + id + "/banner.webp"
			: "/banner.webp"
	)
</script>

<img
	class="w-full rounded-lg object-fill brightness-90 md:h-44 lg:h-64"
	{src}
	alt={title}
	width="1920"
	height="768"
	fetchpriority={priority ? "high" : "auto"}
	loading={priority ? "eager" : "lazy"}
/>

<div class="absolute top-1/2 left-1/2 grid -translate-x-1/2 -translate-y-1/2">
	<span class="text-md text-shadow-strong font-bold drop-shadow-2xl lg:text-lg xl:text-4xl">
		{title}
	</span>
	<span class="lg:text-md text-xs xl:text-lg">
		{#if username}
			<button
				onclick={(e) => {
					e.preventDefault()
					goto("/scripters/" + encodeSEO(username.replaceAll(" ", "-")))
				}}
				class="text-shadow-strong m-2.5 font-semibold drop-shadow-2xl"
			>
				by {username}
			</button>
		{:else}
			<span class="text-shadow-strong m-2.5 font-semibold drop-shadow-2xl"> by Loading... </span>
		{/if}
	</span>
</div>
