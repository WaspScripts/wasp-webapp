<script lang="ts">
	import ExternalLink from "@lucide/svelte/icons/external-link"
	import ScriptHeader from "../ScriptHeader.svelte"
	import { canDownload, canEdit, getProducts } from "$lib/client/supabase"
	import ScriptData from "./ScriptData.svelte"
	import { page } from "$app/state"
	import { browser } from "$app/environment"
	import TableHeader from "$lib/components/TableHeader.svelte"
	import {
		getCurrentPrice,
		getPriceIntervalEx,
		isoDate,
		metaDescription,
		setPriceInterval,
		WEBSITE_URL
	} from "$lib/utils"
	import ScriptArticle from "../ScriptArticle.svelte"
	import Head from "$lib/components/Head.svelte"
	import { PUBLIC_SUPABASE_URL } from "$env/static/public"

	const { data } = $props()
	const { script, profile, supabaseClient, html, stats } = $derived(data)

	let products: Awaited<ReturnType<typeof getProducts>> | null = $state(null)

	async function canDownloadScript() {
		if (script.metadata.type === "free") return true
		const result = await canDownload(supabaseClient, profile?.role, script.id)
		if (!result) products = await getProducts(supabaseClient, script.id)
		return result
	}

	const hasAccess = $derived(browser && profile ? canDownloadScript() : null)

	const banner = $derived(
		PUBLIC_SUPABASE_URL + "/storage/v1/object/public/imgs/scripts/" + script.id + "/banner.webp"
	)
</script>

<Head
	title="{script.title} by {script.protected.username} - Scripts"
	description={metaDescription(script.description) ||
		`${script.title}, an open source colour script by ${script.protected.username}.`}
	keywords="Premium, Free, Automation, ComputerVision"
	author={script.protected.username}
	img={banner}
	imgWidth={1920}
	imgHeight={768}
	imgAlt="{script.title} banner"
	type="article"
	jsonld={[
		{
			"@context": "https://schema.org",
			"@type": "SoftwareApplication",
			name: script.title,
			description: script.description,
			url: WEBSITE_URL + "/scripts/" + script.url,
			image: banner,
			applicationCategory: "UtilitiesApplication",
			operatingSystem: "Windows, macOS, Linux",
			softwareVersion: script.protected.revision?.toString(),
			dateModified: isoDate(script.protected.updated_at),
			isAccessibleForFree: script.metadata.type === "free",
			author: { "@type": "Person", name: script.protected.username },
			publisher: { "@type": "Organization", name: "WaspScripts", url: WEBSITE_URL }
		},
		{
			"@context": "https://schema.org",
			"@type": "BreadcrumbList",
			itemListElement: [
				{ "@type": "ListItem", position: 1, name: "Scripts", item: WEBSITE_URL + "/scripts" },
				{ "@type": "ListItem", position: 2, name: script.title, item: WEBSITE_URL + "/scripts/" + script.url }
			]
		}
	]}
/>

<main class="mx-auto flex w-[90%] flex-col">
	<ScriptHeader
		id={script.id}
		title={script.title}
		username={script.protected.username}
		description={script.description}
		stage={script.metadata.stage}
		{stats}
	>
		<img
			class="rounded-md"
			src={banner}
			alt="{script.title} banner"
			fetchpriority="high"
			width="1920"
			height="768"
		/>
	</ScriptHeader>

	<div class="container mx-auto mb-6 max-w-lg grow md:max-w-5xl">
		{#if canEdit(profile?.id, profile?.role, script.protected.author)}
			<ScriptData id={script.id} />
		{/if}

		{#if profile}
			<div class="text-center">
				{#if hasAccess}
					{#await hasAccess then has_access}
						{#if has_access}
							<div class="grid justify-center justify-items-center gap-8 py-12">
								<div class="my-8 flex flex-col gap-2 lg:flex-row">
									You can download and run the script via the <a href="/setup" class="anchor">wasp-launcher</a
									>
								</div>
								{#if canEdit(profile?.id, profile?.role, script.protected.author)}
									<div class="my-8 grid place-items-center">
										<a
											href="{page.url.pathname}/edit/information"
											class="btn preset-filled-primary-500 font-bold">Edit</a
										>
									</div>
								{/if}
							</div>
						{:else}
							<div class="my-8 rounded-md preset-outlined-surface-500 p-4">
								<h4 class="py-2">
									This is a <span class="text-primary-500">premium</span>
									script that you don't have access to.
								</h4>
								<h5>
									To be able to download this script buy a
									<a href="/subscriptions" class="anchor font-semibold"> subscription </a>
									that gives you access to it! You can buy it with the following products
								</h5>

								{#if script.metadata.type === "premium" && products}
									<form method="POST" class="my-12 flex table-wrap justify-evenly overflow-auto">
										<table class="table">
											<TableHeader headers={["Product", "Type", "Price", "Interval", "Checkout"]} />
											<tbody class="[&>tr]:hover:preset-tonal">
												{#each products.bundles as bundle (bundle.id)}
													<tr class="table-row">
														<td>
															{bundle.name}
														</td>

														<td class="text-center">
															<a
																href="/subscriptions"
																class="btn hover:cursor-pointer hover:text-primary-500"
															>
																<ExternalLink size="16" />
																Bundle
															</a>
														</td>

														<td class="text-center">{getCurrentPrice(bundle.prices)}</td>

														<td>
															<div class="mx-auto btn-group flex w-fit flex-col rounded-md md:flex-row">
																{#each bundle.prices as price, j (price.id)}
																	<button
																		type="button"
																		class="btn preset-outlined-surface-500"
																		class:border-primary-500={price.active}
																		onclick={(e) => {
																			e.preventDefault()
																			setPriceInterval(j, bundle.prices)
																		}}
																	>
																		{getPriceIntervalEx(price)}
																	</button>
																{/each}
															</div>
														</td>

														<td class="text-center">
															<button
																class="btn preset-filled-primary-500"
																formaction="?/checkout&product={bundle.id}&price={bundle.prices.find(
																	(p) => p.active
																)?.id}"
															>
																Checkout
															</button>
														</td>
													</tr>
												{/each}

												{#each products.scripts as script (script.id)}
													<tr>
														<td>
															{script.name}
														</td>

														<td class="text-center">
															<a
																href="/subscriptions"
																class="btn hover:cursor-pointer hover:text-primary-500"
															>
																<ExternalLink size="16" />
																<span>Script</span>
															</a>
														</td>

														<td class="text-center">{getCurrentPrice(script.prices)}</td>

														<td>
															<div class="mx-auto btn-group flex w-fit flex-col rounded-md md:flex-row">
																{#each script.prices as price, j (price.id)}
																	<button
																		type="button"
																		class="btn preset-outlined-surface-500"
																		class:border-primary-500={price.active}
																		onclick={(e) => {
																			e.preventDefault()
																			setPriceInterval(j, script.prices)
																			products = products
																		}}
																	>
																		{getPriceIntervalEx(price)}
																	</button>
																{/each}
															</div>
														</td>

														<td class="text-center">
															<button
																class="btn preset-filled-primary-500"
																formaction="?/checkout&product={script.id}&price={script.prices.find(
																	(p) => p.active
																)?.id}"
															>
																Checkout
															</button>
														</td>
													</tr>
												{/each}
											</tbody>
										</table>
									</form>
								{/if}
							</div>
						{/if}
					{/await}
				{/if}
			</div>
		{/if}
	</div>

	<ScriptArticle {html} />
</main>
