<script lang="ts">
	import TableHeader from "$lib/components/TableHeader.svelte"
	import { Avatar } from "@skeletonlabs/skeleton-svelte"

	const { data } = $props()
	const { supabaseClient, profile, statsPromise, subscriptions } = $derived(data)

	interface Scripter {
		id: string
		profiles: {
			username: string
			avatar: string
		}
	}

	async function fetchcripters() {
		const start = performance.now()
		const { data, error: err } = await supabaseClient
			.schema("profiles")
			.from("scripters")
			.select(`id, profiles!left (username, avatar)`)
			.limit(1, { foreignTable: "profiles" })
			.overrideTypes<Scripter[]>()

		console.log(`└──💻 fetch all scripters loaded in ${(performance.now() - start).toFixed(2)} ms!`)
		if (err) {
			console.error(err)
			return []
		}

		return data.toSorted((a, b) => a.profiles.username.localeCompare(b.profiles.username))
	}
</script>

<main class="m-4 min-h-96">
	<h1 class="my-12 justify-center text-center">General stats</h1>

	<div
		class="xl:mx-w-7xl mx-auto table-wrap max-w-md rounded-md preset-outlined-surface-500 md:max-w-3xl lg:max-w-6xl"
	>
		<table class="table border-separate space-y-6 text-xs">
			<TableHeader headers={["Scripts", "Premium scripts", "Subscribers", "Cancelling", "Free access"]} />

			<tbody class="preset-filled-surface-200-800 [&>tr]:hover:preset-tonal">
				<tr class="table-row">
					{#await statsPromise}
						<td class="text-center">... / ...</td>
						<td class="text-center">... / ...</td>
					{:then stats}
						<td class="text-center">{stats.scripts.length} / {stats.total}</td>
						<td class="text-center">{stats.premium} / {stats.total}</td>
					{/await}

					<td class="text-center">{subscriptions.subscribers}</td>
					<td class="text-center">{subscriptions.cancelling}</td>
					<td class="text-center">{subscriptions.free_access}</td>
				</tr>
			</tbody>
		</table>
	</div>

	{#if profile?.role == "administrator"}
		<div class="my-16 text-center">
			<h1>Admin Powers</h1>

			<h1>View other scripters dashboard</h1>
			<div class="grid gap-4 sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-5">
				{#await fetchcripters()}
					Loading...
				{:then scripters}
					{#each scripters as { id, profiles: { avatar, username } } (id)}
						<a
							href="/dashboard/{id}/general"
							class="m-2 mx-auto btn flex w-full justify-around preset-outlined-tertiary-300-700 p-4 font-bold hover:border-primary-500"
						>
							<Avatar class="mx-2 h-11 w-11 md:h-11 md:w-12 xl:mx-1">
								<Avatar.Image src={avatar} alt={username} loading="eager" />
								<Avatar.Fallback>{username}</Avatar.Fallback>
							</Avatar>

							<span>
								{username}
							</span>
						</a>
					{/each}
				{/await}
			</div>
		</div>
	{/if}
</main>
