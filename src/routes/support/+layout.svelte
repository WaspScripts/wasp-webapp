<script lang="ts">
	import { page } from "$app/state"
	import Discord from "$lib/components/Discord.svelte"
	import Head from "$lib/components/Head.svelte"
	const { children } = $props()
</script>

{#if !page.params.slug}
	<Head
		title="FAQs and Errors"
		description="Need help botting? Browse frequently asked questions and fixes for common errors with Simba, WaspLib and the wasp-launcher."
	/>
{/if}

<main class="container mx-auto my-16 max-w-2xl grow">
	<header class="py-12 text-center">
		<h1>Welcome to the Frequently Asked Questions and Common Errors section.</h1>
	</header>

	<header class="py-12 text-center">
		<p class="py-6">
			If you can't find what you need here it's highly recommended you join our discord server as that's the
			best place for you to get help.
		</p>
		<Discord />
	</header>

	{@render children()}
</main>
