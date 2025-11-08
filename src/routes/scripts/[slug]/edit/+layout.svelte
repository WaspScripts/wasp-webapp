<script lang="ts">
	import { goto } from "$app/navigation"
	import { page } from "$app/state"
	import { PUBLIC_SUPABASE_URL } from "$env/static/public"
	import Head from "$lib/components/Head.svelte"
	import { Tabs } from "@skeletonlabs/skeleton-svelte"
	import ChartBar from "@lucide/svelte/icons/chart-bar"
	import FileCode from "@lucide/svelte/icons/file-code"
	import Info from "@lucide/svelte/icons/info"

	import ScriptHeader from "../../ScriptHeader.svelte"
	import ScriptCard from "$lib/components/ScriptCard.svelte"
	import ScriptArticle from "../../ScriptArticle.svelte"
	import { replaceScriptContent } from "$lib/client/utils"
	import { cropString } from "$lib/utils"
	const { data, children } = $props()
	const { script, profile } = $derived(data)

	let tab = $derived(page.url.pathname.split("/").pop())

	let coverURL: string | undefined = $state()
	let bannerURL: string | undefined = $state()
	let show: boolean[] = $state([false, false, false])
</script>

<Head
	title="Edit{script.title} - Scripts"
	description="The best open source OSRS botting scripts."
	keywords="Premium, Free, Automation, ComputerVision"
	author={script.protected.username}
	img={PUBLIC_SUPABASE_URL + "/storage/v1/object/public/imgs/scripts/" + script.id + "/banner.jpg"}
/>
<main>
	{#if show[0]}
		<main class="mx-auto w-[90%] flex-col">
			<ScriptHeader
				id={script.id}
				title={script.title}
				username={script.protected.username}
				description={script.description}
			>
				<img
					class="rounded-md {!script ? 'animate-pulse' : ''}"
					src={bannerURL ??
						PUBLIC_SUPABASE_URL + "/storage/v1/object/public/imgs/scripts/" + script.id + "/banner.jpg"}
					alt="Script banner"
					loading="lazy"
				/>
			</ScriptHeader>

			<div class="container mx-auto mb-6 max-w-lg grow md:max-w-5xl">
				{#if profile}
					<div class="text-center">
						<div class="my-8 flex flex-col gap-2 lg:flex-row">
							You can download and run the script via the <a href="/setup" class="anchor">wasp-launcher</a>
						</div>
						<h4 class="pt-4">
							You should move this script to
							<b class="text-primary-500">/Simba/Scripts/</b>
							and place it in the respective folder.
						</h4>
					</div>
				{/if}

				<ScriptArticle
					content={script
						? replaceScriptContent(script, { gp_max: 0, gp_min: 0, xp_max: 0, xp_min: 0 })
						: "Loading..."}
				/>
			</div>
		</main>
	{/if}

	{#if show[1]}
		<div class="max-w-2x m-8">
			<div class="grid grid-cols-1 justify-items-center">
				<ScriptCard {script} customCover={coverURL} />
			</div>
		</div>
	{/if}

	{#if show[2]}
		<div class="max-w-2x m-8">
			<div class="mx-auto w-xl rounded-md bg-zinc-200 p-8 text-left dark:bg-zinc-900">
				<div class="flex">
					<div
						class="my-auto mr-3 grid h-8 w-8 content-center justify-center overflow-clip rounded-full bg-white"
					>
						<img src="/favicon.png" alt="WaspScripts Logo" class="h-5 align-middle" loading="lazy" />
					</div>
					<div class="block">
						<span class="block">WaspScripts</span>
						<small class="block">https://waspscripts.dev > scripts</small>
					</div>
				</div>
				<div>
					<span class="text-lg font-semibold text-blue-400">{script.title} - WaspScripts</span>
					<p>{cropString("RuneScape OSRS Color Bot - " + script.description, 160)}</p>
				</div>
			</div>
			<div class="mx-auto my-8 w-160">
				* this is not a real search result, just an example of what you might expect to see in
				google/bing/duckduckgo
			</div>
		</div>
	{/if}

	<div class="max-w-2x container mx-auto my-8 mb-6 flex flex-col">
		<div class="mx-auto btn-group flex flex-col preset-outlined-surface-500 md:flex-row">
			{#each [" script page", " script card", " search result example"] as str, idx (str)}
				<button
					class="btn {show[idx] ? 'preset-filled' : 'hover:preset-tonal'}"
					onclick={() => {
						const tmp = show[idx]
						for (let i = 0; i < show.length; i++) show[i] = false
						show[idx] = !tmp
					}}
				>
					{#if show[idx]}Hide{:else}Show{/if}{str}
				</button>
			{/each}
		</div>

		<div class="max-w-2x container mx-auto my-8 mb-6 flex flex-col">
			<article class="xs:w-full mx-auto my-8 rounded-md preset-outlined-surface-500 p-8 md:w-6/7 lg:w-3/4">
				<Tabs value={tab} onValueChange={(e) => goto(e.value)}>
					<Tabs.List class="flex flex-col justify-center sm:flex-row">
						<Tabs.Trigger value="information"><Info /> Information</Tabs.Trigger>
						<Tabs.Trigger value="files"><FileCode />Files</Tabs.Trigger>
						<Tabs.Trigger value="stats"><ChartBar /> Stats</Tabs.Trigger>
						<Tabs.Indicator />
					</Tabs.List>
				</Tabs>

				{@render children()}
			</article>
		</div>
	</div>
</main>
