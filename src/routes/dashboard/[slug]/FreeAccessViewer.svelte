<script lang="ts">
	import { page } from "$app/state"
	import TableHeader from "$lib/components/TableHeader.svelte"
	import { Dialog, Portal } from "@skeletonlabs/skeleton-svelte"
	import UserRoundPlus from "@lucide/svelte/icons/user-round-plus"

	let {
		id,
		name,
		count
	}: {
		id: string
		name: string
		count: number
	} = $props()

	async function getFreeAccess(id: string) {
		const { data, error } = await page.data.supabaseClient
			.schema("profiles")
			.from("free_access")
			.select("id, user_id, date_start, date_end, profiles(username)")
			.eq("product", id)

		if (error) {
			console.error(error)
			return []
		}

		return data.map((access) => {
			return {
				id: access.id,
				user_id: access.user_id,
				date_start: access.date_start,
				date_end: access.date_end,
				username: access.profiles?.username ?? "Null"
			}
		})
	}

	const headers = ["WaspScripts ID", "Username", "Start Date", "End Date", "Action"]

	let userLocale = navigator.language ?? "pt-PT"
	let open = $state(false)
</script>

<Dialog {open} onOpenChange={(e) => (open = e.open)}>
	<Dialog.Trigger class="btn preset-filled-primary-500 font-bold">
		<UserRoundPlus size="16" />
		<span>{count}</span>
	</Dialog.Trigger>
	<Portal>
		<Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-50-950/50 backdrop-blur-sm" />
		<Dialog.Positioner class="fixed inset-0 z-50 flex items-center justify-center">
			<Dialog.Content
				class="max-h-[95%] w-[95%] max-w-fit space-y-4 overflow-y-auto card bg-surface-100-900 p-4 shadow-xl"
			>
				<Dialog.Title class="flex flex-col justify-between text-2xl font-bold">
					<h1 class="my-4 flex flex-col gap-4 text-lg lg:flex-row lg:h4">{name} Free Access</h1>
					<h2>Total: {count}</h2>
				</Dialog.Title>
				<Dialog.Description>
					<div class="rounded-md preset-outlined-surface-500 p-1">
						<form method="POST" class="max-h-112 table-wrap">
							<table class="table">
								<TableHeader {headers} />
								<tbody class="text-xs md:text-sm xl:text-base [&>tr]:hover:preset-tonal">
									{#await getFreeAccess(id)}
										<tr class="flex w-full">
											<td class="h-full w-full p-0 text-xs"> Loading... </td>
										</tr>
									{:then freeAccess}
										{#each freeAccess as row (row.id)}
											<tr>
												<td>{row.user_id}</td>
												<td class="text-center">{row.username}</td>

												<td class="text-center">{new Date(row.date_start).toLocaleString(userLocale)}</td>
												<td class="text-center">{new Date(row.date_end).toLocaleString(userLocale)}</td>

												<td class="text-center">
													<button
														type="submit"
														class="btn preset-outlined-error-500"
														formaction="?/cancelFree&product={id}&id={row.id}"
													>
														Cancel
													</button>
												</td>
											</tr>
										{/each}
									{/await}
								</tbody>
							</table>
						</form>
					</div>
					<form
						method="POST"
						class="mx-auto flex flex-col justify-around rounded-md preset-outlined-surface-500 p-8 md:flex-row"
					>
						<label>
							<span class="label-text">Add user:</span>
							<input name="userid" type="text" placeholder="User UUID" class="input" />
						</label>

						<label>
							<span class="label-text">End date:</span>
							<input name="enddate" type="date" class="input" />
						</label>

						<button
							type="submit"
							class="my-4 btn preset-filled-success-500"
							formaction="?/addFree&product={id}"
						>
							<UserRoundPlus /> Add user</button
						>
					</form>
				</Dialog.Description>
				<Dialog.CloseTrigger class="btn preset-tonal">Close</Dialog.CloseTrigger>
			</Dialog.Content>
		</Dialog.Positioner>
	</Portal>
</Dialog>
