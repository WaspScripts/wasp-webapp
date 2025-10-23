<script>
	import { page } from "$app/state"
	import { replaceQuery } from "$lib/client/utils"
	import GitHubButton from "$lib/components/GitHubButton.svelte"
	import ChevronsDownUp from "svelte-lucide/ChevronsDownUp.svelte"
	import ChevronsUpDown from "svelte-lucide/ChevronsUpDown.svelte"

	const { data, children } = $props()
	const { errors, meta } = $derived(data)

	let search = $state(decodeURIComponent(page.url.searchParams.get("search") || "").trim())
</script>

<a
	href="/information/faqs"
	class="inline-flex w-full justify-between preset-outlined-surface-500 px-4 py-2 text-sm font-medium hover:preset-outlined-primary-500"
>
	❓ Frequently Asked Questions
	<ChevronsUpDown class="h-5" />
</a>
<a
	href="/information"
	class="inline-flex w-full justify-between preset-outlined-surface-500 px-4 py-2 text-sm font-medium hover:preset-outlined-primary-500"
>
	⚠️ Common Errors
	<ChevronsDownUp class="h-5" />
</a>

<div class="flex flex-col preset-filled-surface-100-900 py-4">
	<form onchange={(e) => e.currentTarget.requestSubmit()} class="mx-4">
		<input
			type="text"
			placeholder="🔍Search for common errors"
			class="mx-auto input max-w-3xl"
			bind:value={search}
			oninput={() => replaceQuery(page.url, { search: search })}
		/>
	</form>

	<GitHubButton link="new/main/faq" text="Add a FAQ on GitHub!"></GitHubButton>

	{#each errors as err (err)}
		{#if err.order == meta.order}
			{@render children()}
		{:else}
			<a
				href="/information/errors/{err.url}"
				class="mx-4 inline-flex justify-between border border-surface-200-800 px-4 py-2 text-left text-sm font-medium text-surface-900-100 shadow-sm hover:preset-outlined-primary-500"
			>
				{err.title} <ChevronsUpDown class="h-4" /></a
			>
		{/if}
	{/each}
</div>
