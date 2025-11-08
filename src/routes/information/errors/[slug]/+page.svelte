<script lang="ts">
	import { Avatar } from "@skeletonlabs/skeleton-svelte"
	import ChevronsDownUp from "@lucide/svelte/icons/chevrons-down-up"

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
	class="mx-4 inline-flex justify-between border border-surface-200-800 px-4 py-2 text-left text-sm font-medium text-surface-900-100 shadow-sm hover:preset-outlined-primary-500"
>
	{meta.title}
	<ChevronsDownUp class="h-4" />
</a>
<div class="w-full card preset-filled-surface-100-900 p-4 text-center">
	<article class="mx-auto my-8 prose border-surface-300 py-6 dark:prose-invert">
		<div class="mx-8 md:mx-auto">
			<Content />
		</div>
	</article>
	<footer class="flex flex-col p-4 opacity-60">
		<div class="flex justify-between">
			<div class="my-4 flex gap-2 text-center">
				<span class="my-auto">Author:</span>
				<span class="flex justify-center text-primary-500">
					{#await getUsername(meta.author)}
						Loading...
					{:then author}
						<span class="my-auto">{author.username}</span>
						<Avatar class="mx-1 h-8 w-8">
							<Avatar.Image src={author.avatar} alt={author.username} />
							<Avatar.Fallback>{author.username ?? "Error"}</Avatar.Fallback>
						</Avatar>
					{/await}
				</span>
			</div>
			<small class="my-4">Updated on {new Date(meta.updated_at).toLocaleDateString()}</small>
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
										<Avatar.Image src={author.avatar} alt={author.username} />
										<Avatar.Fallback>{author.username ?? "Error"}</Avatar.Fallback>
									</Avatar>
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
