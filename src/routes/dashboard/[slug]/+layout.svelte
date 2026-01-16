<script lang="ts">
	import { goto } from "$app/navigation"
	import { page } from "$app/state"
	import Head from "$lib/components/Head.svelte"
	import { Avatar, Tabs } from "@skeletonlabs/skeleton-svelte"
	import FileCode from "@lucide/svelte/icons/file-code"
	import Landmark from "@lucide/svelte/icons/landmark"
	import Package from "@lucide/svelte/icons/package"
	import Settings from "@lucide/svelte/icons/settings"
	import UUID from "$lib/components/UUID.svelte"

	const { data, children } = $props()

	const { scripter } = $derived(data)
	let tab = $derived(page.url.pathname.split("/").pop())
</script>

<Head title="Dashboard" description="Scripter dashboard" keywords="Dashboard, Scripter, Developer" />

<main class="">
	<h3 class="my-4 flex justify-center gap-2">
		<span class="my-auto"> Viewing user: </span>
		<Avatar class="m-2 flex border-2 border-surface-300-700">
			<Avatar.Image src={scripter.profiles.avatar} alt={scripter.profiles.username} loading="eager" />
			<Avatar.Fallback>{scripter.profiles.username}</Avatar.Fallback>
		</Avatar>

		<span class="my-auto">
			{scripter.profiles.username}
		</span>
		<small class="my-auto"><UUID uuid={scripter.id}></UUID></small>
	</h3>

	<div class="my-8 grid place-items-center">
		<a href="/scripters/{scripter ? scripter.url : ''}" class="btn preset-filled-primary-500">
			Scripter profile
		</a>
	</div>

	<Tabs value={tab} onValueChange={(e) => goto(e.value)}>
		<Tabs.List class="flex flex-col justify-center sm:flex-row">
			<Tabs.Trigger value="general"><Settings /> General</Tabs.Trigger>
			<Tabs.Trigger value="stripe"><Landmark />Stripe</Tabs.Trigger>
			<Tabs.Trigger value="bundles"><Package /> Bundles</Tabs.Trigger>
			<Tabs.Trigger value="scripts"><FileCode /> Scripts</Tabs.Trigger>
			<Tabs.Indicator />
		</Tabs.List>
	</Tabs>
	{@render children()}
</main>
