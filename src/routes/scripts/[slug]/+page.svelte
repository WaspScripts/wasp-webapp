<script lang="ts">
	import { ExternalLink } from "svelte-lucide"
	import ScriptHeader from "../ScriptHeader.svelte"
	import { canDownload, canEdit, getProducts } from "$lib/client/supabase"
	import ScriptData from "./ScriptData.svelte"
	import AdvancedButton from "../AdvancedButton.svelte"
	import { page } from "$app/state"
	import TableHeader from "$lib/components/TableHeader.svelte"
	import { getCurrentPrice, getPriceIntervalEx, setPriceInterval } from "$lib/utils"
	import ScriptArticle from "../ScriptArticle.svelte"
	import { replaceScriptContent } from "$lib/client/utils"
	import Head from "$lib/components/Head.svelte"
	import { PUBLIC_SUPABASE_URL } from "$env/static/public"

	const { data } = $props()
	const { script, profile, supabaseClient } = $derived(data)

	let products: Awaited<ReturnType<typeof getProducts>> | null = $state(null)

	async function canDownloadScript() {
		if (script.metadata.type === "free") return true
		const result = await canDownload(supabaseClient, profile?.role, script.id)
		if (!result) products = await getProducts(supabaseClient, script.id)
		return result
	}
</script>

<Head
	title="{script.title} - Scripts"
	description="The best open source OSRS botting scripts."
	keywords="Premium, Free, Automation, ComputerVision"
	author={script.protected.username}
	img={PUBLIC_SUPABASE_URL + "/storage/v1/object/public/imgs/scripts/" + script.id + "/banner.jpg"}
/>

<main class="mx-auto flex w-[90%] flex-col">
	<ScriptHeader
		id={script.id}
		title={script.title}
		username={script.protected.username}
		description={script.description}
	>
		<img
			class="rounded-md"
			src={PUBLIC_SUPABASE_URL +
				"/storage/v1/object/public/imgs/scripts/" +
				script.id +
				"/banner.jpg"}
			alt="Script banner"
			loading="lazy"
		/>
	</ScriptHeader>

	<div class="container mx-auto mb-6 max-w-lg flex-grow md:max-w-5xl">
		{#if canEdit(profile?.id, profile?.role, script.protected.author)}
			<ScriptData id={script.id} />
		{/if}

		{#if profile}
			<div class="text-center">
				{#await canDownloadScript()}
					<div class="grid animate-pulse justify-center justify-items-center gap-8 py-12">
						<div class="my-8 flex flex-col gap-8 lg:flex-row">
							<AdvancedButton id={script.id} title={script.title} rev={script.protected.revision} />
						</div>
					</div>
				{:then has_access}
					{#if has_access}
						<div class="grid justify-center justify-items-center gap-8 py-12">
							<div class="my-8 flex flex-col gap-8 lg:flex-row">
								<AdvancedButton
									id={script.id}
									title={script.title}
									rev={script.protected.revision}
								/>
							</div>
							{#if canEdit(profile?.id, profile?.role, script.protected.author)}
								<div class="my-8 grid place-items-center">
									<a href="{page.url.pathname}/edit" class="btn preset-filled-secondary-500">Edit</a
									>
								</div>
							{/if}
						</div>
					{:else}
						<div class="preset-outlined-surface-500 my-8 rounded-md p-4">
							<h4 class="py-2">
								This is a <span class="text-secondary-500">premium</span>
								script that you don't have access to.
							</h4>
							<h5>
								To be able to download this script buy a
								<a href="/subscriptions" class="text-secondary-500 font-semibold hover:underline">
									subscription
								</a>
								that gives you access to it! You can buy it with the following products
							</h5>

							{#if script.metadata.type === "premium" && products}
								<form method="POST" class="table-wrap my-12 flex justify-evenly overflow-auto">
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
															class="btn hover:text-primary-500 hover:cursor-pointer"
														>
															<ExternalLink size="16" />
															Bundle
														</a>
													</td>

													<td class="text-center">{getCurrentPrice(bundle.prices)}</td>

													<td>
														<div
															class="btn-group mx-auto flex w-fit flex-col rounded-md md:flex-row"
														>
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
															class="btn preset-filled-secondary-500"
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
															class="btn hover:text-primary-500 hover:cursor-pointer"
														>
															<ExternalLink size="16" />
															<span>Script</span>
														</a>
													</td>

													<td class="text-center">{getCurrentPrice(script.prices)}</td>

													<td>
														<div
															class="btn-group mx-auto flex w-fit flex-col rounded-md md:flex-row"
														>
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
															class="btn preset-filled-secondary-500"
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
			</div>
		{/if}
	</div>

	<ScriptArticle content={replaceScriptContent(script)} />
</main>
