<script lang="ts">
	import { page } from "$app/state"
	import Head from "$lib/components/Head.svelte"
	import AdvancedButton from "./AdvancedButton.svelte"

	let { data } = $props()
	let { policies } = $derived(data)
	let index = $state(0)

	let currentPolicy: (typeof policies)[number] = $derived(policies[index])

	let userLocale = "pt-PT"

	const titles: Record<string, string> = {
		user_tos: "User Terms and Conditions",
		scripter_tos: "Scripter Terms and Conditions",
		privacy_policy: "Privacy Policy"
	}

	const legalTitle = $derived(titles[page.params.slug?.toLowerCase() ?? ""] ?? "Terms and Conditions")
</script>

<Head
	title={legalTitle}
	description="Read the WaspScripts {legalTitle.toLowerCase()}, including every previous version of the document."
	keywords="Privacy, Policy, Terms, Conditions"
/>

<h1 class="sr-only">{legalTitle}</h1>

<main class="container mx-auto my-6 max-w-4xl grow">
	<div class="mx-auto grid max-w-4xl">
		<a href={page.url.pathname + "/add"} class="mx-auto btn preset-filled-secondary-500">Add</a>
		<div class="mx-auto my-6 flex">
			<AdvancedButton bind:index total={policies.length} />
		</div>
		<div class="mx-auto my-6 flex">
			Updated on: {currentPolicy
				? new Date(currentPolicy.created_at).toLocaleString(userLocale)
				: "Loading..."}
		</div>

		{#if index !== 0}
			<div class="mx-auto my-6 grid max-w-4xl text-center text-secondary-500">
				<p>Old versions of this document are merely informative and for the sake of transparency.</p>
				<p>
					The moment it's updated, the old version is not considered valid or applicable, and only the most
					recent version holds legal and operational significance.
				</p>
			</div>
		{/if}
	</div>
	<article class="mx-auto prose max-w-md py-6 md:max-w-4xl dark:prose-invert">
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html currentPolicy.content}
	</article>
</main>
