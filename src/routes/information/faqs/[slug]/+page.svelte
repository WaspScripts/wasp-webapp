<script>
	import { page } from "$app/state"
	import { replaceQuery } from "$lib/client/utils"
	import ChevronsDownUp from "svelte-lucide/ChevronsDownUp.svelte"
	import ChevronsUpDown from "svelte-lucide/ChevronsUpDown.svelte"

	const { data } = $props()
	const { faqs, content, meta } = $derived(data)

	let search = $state(decodeURIComponent(page.url.searchParams.get("search") || "").trim())
	let Content = $derived(content)
</script>

<a
	href="/information/"
	class="preset-outlined-surface-500 hover:preset-outlined-primary-500 inline-flex w-full justify-between px-4 py-2 text-sm font-medium"
>
	❓ Frequently Asked Questions
	<ChevronsDownUp class="h-5" />
</a>

<div>
	<form onchange={(e) => e.currentTarget.requestSubmit()}>
		<input
			type="text"
			placeholder="🔍Search for frequently asked questions"
			class="input mx-auto max-w-3xl"
			bind:value={search}
			oninput={() => replaceQuery(page.url, { search: search })}
		/>
	</form>

	{#each faqs as faq (faq)}
		{#if faq.order == meta.order}
			<a
				href="/information/faqs"
				class="text-surface-900-100 border-surface-200-800 hover:preset-outlined-primary-500 inline-flex w-full justify-between border px-4 py-2 text-left
		text-sm font-medium shadow-sm"
			>
				{faq.title} <ChevronsDownUp class="h-4" /></a
			>
			<Content />
		{:else}
			<a
				href="/information/faqs/{faq.url}"
				class="text-surface-900-100 border-surface-200-800 hover:preset-outlined-primary-500 inline-flex w-full justify-between border px-4 py-2 text-left
		text-sm font-medium shadow-sm"
			>
				{faq.title} <ChevronsUpDown class="h-4" /></a
			>
		{/if}
	{/each}
</div>

<a
	href="/information/errors"
	class="preset-outlined-surface-500 hover:preset-outlined-primary-500 inline-flex w-full justify-between px-4 py-2 text-sm font-medium"
>
	⚠️ Common Errors
	<ChevronsUpDown class="h-5" />
</a>
