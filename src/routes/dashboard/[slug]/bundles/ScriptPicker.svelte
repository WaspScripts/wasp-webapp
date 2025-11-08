<script lang="ts">
	import { Dialog, Portal } from "@skeletonlabs/skeleton-svelte"
	import PanelBottomOpen from "@lucide/svelte/icons/panel-bottom-open"
	import PanelTopOpen from "@lucide/svelte/icons/panel-top-open"

	let { children } = $props()
	let open = $state(false)
</script>

<Dialog {open} onOpenChange={(e) => (open = e.open)}>
	<Dialog.Trigger class="mx-auto btn preset-tonal">
		{#if open}
			<PanelBottomOpen size="16" />
		{:else}
			<PanelTopOpen size="16" />
		{/if}
		<span>Edit Scripts</span>
	</Dialog.Trigger>
	<Portal>
		<Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-50-950/50 backdrop-blur-sm" />
		<Dialog.Positioner class="fixed inset-0 z-50 flex items-center justify-center">
			<Dialog.Content
				class="max-h-[95%] w-[95%] max-w-fit space-y-4 overflow-y-auto card bg-surface-100-900 p-4 shadow-xl"
			>
				<Dialog.Title class="flex justify-between text-2xl font-bold">
					Choose the scripts you want on this bundle:
				</Dialog.Title>
				<Dialog.Description>
					<article class="my-12 max-h-112 table-wrap w-full">
						<table class="table">
							<tbody class="[&>tr]:hover:preset-tonal">
								{@render children()}
							</tbody>
						</table>
					</article>
					<small class="mb-12 hidden justify-center md:flex">
						On Desktop you can also use your keyboard:
						<kbd class="kbd">Tab, Shift + Tab and Space</kbd>
					</small>
				</Dialog.Description>
				<Dialog.CloseTrigger class="btn preset-tonal">Confirm</Dialog.CloseTrigger>
			</Dialog.Content>
		</Dialog.Positioner>
	</Portal>
</Dialog>
