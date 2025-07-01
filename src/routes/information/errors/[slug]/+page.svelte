<script lang="ts">
	import { Avatar } from "@skeletonlabs/skeleton-svelte"
	import { ChevronsDownUp } from "svelte-lucide"

	const { data } = $props()
	const { meta, content, supabaseClient } = $derived(data)

	async function getUsername(id: string) {
		const { data, error: err } = await supabaseClient
			.schema("profiles")
			.from("profiles")
			.select("username, avatar")
			.eq("id", id)
			.single()

		if (err) {
			console.error(err)
			return { username: "Error", avatar: "Error" }
		}

		return data
	}

	let Content = $derived(content)
</script>

<a
	href="/information/errors/"
	class="text-surface-900-100 border-surface-200-800 hover:preset-outlined-primary-500 inline-flex w-full justify-between border px-4 py-2 text-left
	text-sm font-medium shadow-sm"
>
	{meta.title}
	<ChevronsDownUp class="h-4" />
</a>
<div class="card preset-filled-surface-100-900 w-full p-4 text-center">
	<article class="prose border-surface-300 dark:prose-invert mx-auto my-8 py-6">
		<div class="mx-8 md:mx-auto">
			<Content />
		</div>
	</article>
	<footer class="flex flex-col p-4 opacity-60">
		<div class="flex justify-between">
			<div class="my-4 flex gap-2 text-center">
				<span class="my-auto">Author:</span>
				<span class="text-primary-500 flex justify-center">
					{#await getUsername(meta.author)}
						Loading...
					{:then author}
						<span class="my-auto">{author.username}</span>
						<Avatar src={author.avatar} name={author.username ?? "Error"} classes="mx-1 w-8 h-8" />
					{/await}
				</span>
			</div>
			<small class="my-4">Updated on {new Date(meta.updated_at).toLocaleDateString()}</small>
			{#if meta.coauthors}
				<h5 class="justify-center text-center">
					Co-Authors:
					<div class="text-secondary-500 my-2 flex items-baseline justify-center text-sm">
						{#each meta.coauthors as coauthor (coauthor)}
							{#await getUsername(coauthor)}
								Loading
							{:then author}
								<span class="mx-2 flex">
									<span class="my-auto">{author.username}</span>
									<Avatar
										src={author.avatar}
										name={author.username ?? "Error"}
										classes="mx-1 w-6 h-6"
									/>
								</span>
							{/await}
						{/each}
					</div>
				</h5>
			{/if}
		</div>
		<div>
			<a
				href="https://github.com/WaspScripts/wasp-info/edit/main/errors/{meta.order}.md"
				class="btn preset-filled-surface-200-800"
			>
				Edit on GitHub!
			</a>
		</div>
	</footer>
</div>
