<script lang="ts">
	import type { Price } from "$lib/types/collection"
	import { Dialog, Portal } from "@skeletonlabs/skeleton-svelte"
	import RotateCw from "@lucide/svelte/icons/rotate-cw"
	import { SvelteDate } from "svelte/reactivity"

	let {
		name,
		username,
		id,
		price,
		date_end
	}: {
		name: string
		username: Promise<string | null>
		id: string
		price: Price
		date_end: string
	} = $props()
	let open = $state(false)

	const value = price!.amount - Math.min(price!.amount * 0.15, 500)

	const priceStr = new Intl.NumberFormat("pt-PT", {
		style: "currency",
		currency: price?.currency ?? "eur"
	}).format((value ?? 0) / 100)

	const endDate = new Date(date_end)
	const startDate = new Date(endDate)

	switch (price.interval) {
		case "week":
			startDate.setDate(startDate.getDate() - 7)
			break
		case "month":
			startDate.setMonth(startDate.getMonth() - 1)
			break
		case "year":
			startDate.setFullYear(startDate.getFullYear() - 1)
			break
		default:
	}

	const start_date = startDate.getTime()
	const end_date = endDate.getTime()

	const DAY = 24 * 3600000
	const tenDayMS = 10 * DAY
	const intervalMs = end_date - start_date
	const tenPercentMs = intervalMs * 0.1
	const windowMs = Math.min(tenPercentMs, tenDayMS)

	const elapsedSinceStartMs = Date.now() - start_date

	const endWindow = new Date(start_date + DAY + windowMs)
</script>

<Dialog {open} onOpenChange={(e) => (open = e.open)}>
	<Dialog.Trigger disabled={elapsedSinceStartMs > windowMs} class="btn preset-tonal">
		<RotateCw size="16" />
		<span>Refund</span>
	</Dialog.Trigger>
	<Portal>
		<Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-50-950/50 backdrop-blur-sm" />
		<Dialog.Positioner class="fixed inset-0 z-50 flex items-center justify-center">
			<Dialog.Content
				class="max-h-[95%] w-[70%] max-w-fit space-y-4 overflow-y-auto card rounded-md bg-surface-100-900 p-12 shadow-xl"
			>
				<Dialog.Title class="flex justify-between text-2xl font-bold">
					<h5 class="flex flex-col gap-4 h5 lg:flex-row lg:h4">
						Refund
						<span>{name}</span>
						<span>
							{#await username}
								by Loading...
							{:then username}
								by {username}
							{/await}
						</span>
					</h5>
				</Dialog.Title>
				<Dialog.Description>
					<p>Are you sure you want to refund this product?</p>
					<p class="my-4">You are about to refund:</p>

					<b>
						<span>{name}</span>
						<span>
							{#await username}
								by Loading...
							{:then username}
								by {username}
							{/await}
						</span>
					</b>
					<p class="mt-8">You will not be refunded the processing fees and will lose instant access to it.</p>
					<p>
						Please consider
						<a href="https://discord.gg/Khp7RXpRz4" class="anchor">
							asking for help on Discord if you are having technical issues
						</a>.
					</p>
					<p class="my-8">The total amount you will be refunded will be roughly <b>{priceStr}</b>.</p>

					<div class="mx-2 my-8 flex flex-col gap-4 rounded-md bg-surface-300-700 p-2 text-warning-500">
						{#if elapsedSinceStartMs < DAY}
							<p>
								The refund option will be available after <span class="text-error-500">1 day</span>
								and you will have until the
								<span class="text-error-500">{endWindow.toLocaleString()}</span>
								to request it.
							</p>
							<p>
								While it's not available try reaching out to
								<span class="text-error-500">
									{#await username}
										Loading...
									{:then username}
										{username}
									{/await}
								</span>
								and let him know if you are having issues!
							</p>
						{:else}
							<p>
								Refunding will be available until <span class="text-error-500">
									{endWindow.toLocaleString()}
								</span>
							</p>
						{/if}
					</div>
				</Dialog.Description>

				<footer class="flex justify-end gap-4">
					<form id="refundsform" method="POST" action={"?/refund&id=" + id}>
						<button
							type="submit"
							disabled={elapsedSinceStartMs < DAY || elapsedSinceStartMs > windowMs}
							class="btn preset-filled-error-500"
						>
							Refund
						</button>
					</form>

					<Dialog.CloseTrigger class="btn preset-tonal">Cancel</Dialog.CloseTrigger>
				</footer>
			</Dialog.Content>
		</Dialog.Positioner>
	</Portal>
</Dialog>
