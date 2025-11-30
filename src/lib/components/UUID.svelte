<script lang="ts">
	import Clipboard from "@lucide/svelte/icons/clipboard"
	import ClipboardCheck from "@lucide/svelte/icons/clipboard-check"
	let { uuid }: { uuid: string } = $props()
	let copied = $state(false)
</script>

<button
	class="mx-auto btn cursor-pointer rounded-md preset-outlined-surface-500 p-2 text-xs"
	type="button"
	onclick={async (e) => {
		e.preventDefault()
		await navigator.clipboard.writeText(uuid)
		copied = true
		setTimeout(() => (copied = false), 2000)
	}}
>
	ID: <span class="w-18 truncate">{uuid}</span>
	{#if copied}
		<ClipboardCheck class="h-4" />
	{:else}
		<Clipboard class="h-4" />
	{/if}
</button>
