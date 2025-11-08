<script lang="ts">
	import { page } from "$app/state"
	import { Pagination } from "@skeletonlabs/skeleton-svelte"
	import ArrowLeft from "@lucide/svelte/icons/arrow-left"
	import ArrowRight from "@lucide/svelte/icons/arrow-right"
	import ChevronLeft from "@lucide/svelte/icons/chevron-left"
	import ChevronRight from "@lucide/svelte/icons/chevron-right"
	import { replaceQuery } from "$lib/client/utils"

	let {
		currentPage,
		count,
		pageSize = $bindable(),
		amounts = $bindable([Math.round(pageSize / 2), pageSize, pageSize * 2])
	}: {
		currentPage: number
		count: number
		pageSize: number
		amounts?: number[]
	} = $props()
</script>

{#if pageSize < count}
	<footer class="flex w-full flex-col justify-between gap-2 md:flex-row">
		<select
			name="size"
			id="size"
			class="mx-auto select max-w-[150px] md:mx-0"
			bind:value={pageSize}
			onchange={() => replaceQuery(page.url, { amount: pageSize.toString() })}
		>
			{#each amounts as v (v)}
				<option value={v}>Items {v}</option>
			{/each}
		</select>

		<Pagination
			{count}
			{pageSize}
			page={currentPage}
			onPageChange={(e) => {
				currentPage = e.page
				replaceQuery(page.url, { page: e.page.toString() }, false)
			}}
			onPageSizeChange={(e) => (pageSize = e.pageSize)}
			class="mx-auto w-fit md:mx-0"
		>
			<Pagination.FirstTrigger>
				<ChevronLeft class="size-4" />
			</Pagination.FirstTrigger>
			<Pagination.PrevTrigger>
				<ArrowLeft class="size-4" />
			</Pagination.PrevTrigger>
			<Pagination.Context>
				{#snippet children(pagination)}
					{#each pagination().pages as page, index (page)}
						{#if page.type === "page"}
							<Pagination.Item {...page}>
								{page.value}
							</Pagination.Item>
						{:else}
							<Pagination.Ellipsis {index}>&#8230;</Pagination.Ellipsis>
						{/if}
					{/each}
				{/snippet}
			</Pagination.Context>
			<Pagination.NextTrigger>
				<ArrowRight class="size-4" />
			</Pagination.NextTrigger>
			<Pagination.LastTrigger>
				<ChevronRight class="size-4" />
			</Pagination.LastTrigger>
		</Pagination>
	</footer>
{/if}
