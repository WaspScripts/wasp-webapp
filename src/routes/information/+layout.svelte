<script lang="ts">
	import Discord from "$lib/components/Discord.svelte"
	import Head from "$lib/components/Head.svelte"
	const { children } = $props()
</script>

<Head
	title="FAQs and Errors"
	description="Need help botting osrs? See if what you are looking for is in this list."
/>

<main class="container mx-auto my-16 max-w-2xl flex-grow">
	<header class="py-12 text-center">
		<h2>Welcome to the Frequently Asked Questions and Common Errors section.</h2>
	</header>

	{@render children()}

	<header class="py-12 text-center">
		<p class="py-6">
			Hopefully you found what you were looking for here, if not feel free to join the discord
			server and ask around!
		</p>
		<Discord />
	</header>
</main>
