<script lang="ts">
	import { goto } from "$app/navigation"
	import type { BundleProduct } from "$lib/types/collection"
	import { Dialog, Portal } from "@skeletonlabs/skeleton-svelte"
	import PanelBottomOpen from "@lucide/svelte/icons/panel-bottom-open"
	import PanelTopOpen from "@lucide/svelte/icons/panel-top-open"
	import ExternalLink from "@lucide/svelte/icons/external-link"

	let { bundle }: { bundle: BundleProduct } = $props()
	let open = $state(false)
</script>

<Dialog {open} onOpenChange={(e) => (open = e.open)}>
	<Dialog.Trigger class="btn preset-tonal">
		{#if open}
			<PanelBottomOpen size="16" />
		{:else}
			<PanelTopOpen size="16" />
		{/if}
		Bundle
	</Dialog.Trigger>
	<Portal>
		<Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-50-950/50 backdrop-blur-sm" />
		<Dialog.Positioner class="fixed inset-0 z-50 flex items-center justify-center">
			<Dialog.Content
				class="max-h-[95%] w-[95%] max-w-fit space-y-4 overflow-y-auto card bg-surface-100-900 p-4 shadow-xl"
			>
				<Dialog.Title class="text-2xl font-bold">
					<span>{bundle.name}</span>
					<span>
						{#await bundle.username}
							by Loading...
						{:then username}
							by {username}
						{/await}
					</span>
				</Dialog.Title>
				<Dialog.Description>
					<article class="table-wrap">
						<table class="table">
							<tbody class="[&>tr]:hover:preset-tonal">
								{#each bundle.scripts as script (script.id)}
									<tr
										class="flex h-full w-full cursor-pointer"
										onclick={() => goto("/scripts/" + script.url)}
									>
										<td class="text-xs">
											<div class="align-items-center ml-3 flex">
												<ExternalLink size="16" class="mr-4" />
												{script.title}
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</article>
				</Dialog.Description>
				<Dialog.CloseTrigger class="mx-auto btn flex preset-tonal">Close</Dialog.CloseTrigger>
			</Dialog.Content>
		</Dialog.Positioner>
	</Portal>
</Dialog>
