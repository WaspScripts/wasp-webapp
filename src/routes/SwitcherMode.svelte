<script lang="ts">
	import { enhance } from "$app/forms"
	import { page } from "$app/state"
	import Sun from "@lucide/svelte/icons/sun"
	import Moon from "@lucide/svelte/icons/moon"

	let mode = $state(page.data.mode)
</script>

<form
	id="mode-form"
	method="POST"
	action="/?/setMode&mode={mode === 'light' ? 'dark' : 'light'}"
	class="my-auto flex"
	use:enhance={() => {
		mode = mode === "light" ? "dark" : "light"
		document.documentElement.setAttribute("data-mode", mode)
		// The DOM and local state are already updated, so skip re-running every load function.
		return async () => {}
	}}
>
	<button
		id="lightswitch"
		class="btn h-8 px-2 py-0.5 hover:preset-tonal xl:px-4"
		title="Toggle light/dark mode."
		type="submit"
		aria-label="Light/Dark mode"
	>
		{#if mode === "light"}
			<Moon />
		{:else}
			<Sun />
		{/if}
	</button>
</form>
