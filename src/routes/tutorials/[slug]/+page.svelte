<script lang="ts">
	import { browser } from "$app/environment"
	import { getAuthorProfiles } from "$lib/client/supabase"
	import GitHubButton from "$lib/components/GitHubButton.svelte"
	import Head from "$lib/components/Head.svelte"
	import { isoDate, metaDescription, WEBSITE_URL } from "$lib/utils"
	import { Avatar } from "@skeletonlabs/skeleton-svelte"

	const { data } = $props()
	const { meta, content, supabaseClient } = $derived(data)

	const authors = $derived(
		browser
			? getAuthorProfiles(supabaseClient, [meta.author, ...(meta.coauthors ?? [])])
			: new Promise<never>(() => {})
	)

	function getUsername(id: string) {
		return authors.then((getAuthor) => getAuthor(id))
	}

	let Content = $derived(content)
</script>

<Head
	title="{meta.title} - Tutorials"
	description={metaDescription(meta.description || meta.title)}
	keywords="Tutorial, Tutorials, Guide, Guides, Learn, Coding"
	author={meta.username}
	type="article"
	jsonld={[
		{
			"@context": "https://schema.org",
			"@type": "TechArticle",
			headline: meta.title,
			description: meta.description,
			url: WEBSITE_URL + "/tutorials/" + meta.url,
			datePublished: isoDate(meta.created_at),
			dateModified: isoDate(meta.updated_at),
			author: { "@type": "Person", name: meta.username },
			publisher: {
				"@type": "Organization",
				name: "WaspScripts",
				url: WEBSITE_URL,
				logo: { "@type": "ImageObject", url: WEBSITE_URL + "/favicon.png" }
			}
		},
		{
			"@context": "https://schema.org",
			"@type": "BreadcrumbList",
			itemListElement: [
				{ "@type": "ListItem", position: 1, name: "Tutorials", item: WEBSITE_URL + "/tutorials" },
				{ "@type": "ListItem", position: 2, name: meta.title, item: WEBSITE_URL + "/tutorials/" + meta.url }
			]
		}
	]}
/>

<main class="container mx-auto my-6 max-w-4xl grow">
	<div class="my-8 grid place-items-center">
		<GitHubButton link="edit/main/tutorials/{meta.order}.md" text="Edit on GitHub!"></GitHubButton>
	</div>
	<h1 class="my-4 text-center text-3xl font-bold">{meta.title}</h1>
	<p class="my-4 text-center leading-normal font-semibold">{meta.description}</p>
	<h4 class="my-12 text-center">
		Author:
		<span class="flex justify-center text-primary-500">
			{#await getUsername(meta.author)}
				Loading...
			{:then author}
				<span class="my-auto">{author.username}</span>
				<Avatar class="mx-1 h-8 w-8">
					<Avatar.Image src={author.avatar} alt={author.username} loading="eager" />
					<Avatar.Fallback>{author.username}</Avatar.Fallback>
				</Avatar>
			{/await}
		</span>
	</h4>
	{#if meta.coauthors}
		<h5 class="justify-center text-center">
			Co-Authors:
			<div class="my-2 flex items-baseline justify-center text-sm text-secondary-500">
				{#each meta.coauthors as coauthor (coauthor)}
					{#await getUsername(coauthor)}
						Loading
					{:then author}
						<span class="mx-2 flex">
							<span class="my-auto">{author.username}</span>
							<Avatar class="mx-1 h-6 w-6">
								<Avatar.Image src={author.avatar} alt={author.username} loading="eager" />
								<Avatar.Fallback>{author.username}</Avatar.Fallback>
							</Avatar>
						</span>
					{/await}
				{/each}
			</div>
		</h5>
	{/if}
	<article
		class="mx-auto my-8 prose border-t-2 border-surface-300 py-6 dark:border-surface-800 dark:prose-invert"
	>
		<div class="mx-8 md:mx-auto">
			<Content />
		</div>
	</article>
</main>
