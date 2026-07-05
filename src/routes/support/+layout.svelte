<script lang="ts">
	import Discord from "$lib/components/Discord.svelte"
	import Head from "$lib/components/Head.svelte"
	const { children } = $props()
</script>

<Head
	title="FAQs and Errors"
	description="Need help botting? See if what you are looking for is in this list."
/>

<main class="container mx-auto my-16 max-w-2xl grow">
	<header class="py-12 text-center">
		<h2>Welcome to the Frequently Asked Questions and Common Errors section.</h2>
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
