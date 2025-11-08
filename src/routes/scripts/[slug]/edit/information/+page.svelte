<script lang="ts">
	import { superForm } from "sveltekit-superforms"
	import { zodClient } from "sveltekit-superforms/adapters"
	import { scriptCategories, scriptStatus, scriptTypes } from "$lib/utils"
	import { scriptInfoSchema } from "$lib/client/schemas"
	import { Switch } from "@skeletonlabs/skeleton-svelte"

	const { data } = $props()
	let profile = $derived(data.profile!)

	const { form, errors, enhance } = superForm(data.form!, {
		dataType: "json",
		multipleSubmits: "prevent",
		taintedMessage: "Are you sure you want to leave?",
		validators: zodClient(scriptInfoSchema),
		scrollToError: true
	})

	const categories = Object.values(scriptCategories)
</script>

<main>
	<header class="my-8 text-center">
		<h3>Edit Script Information</h3>
	</header>
	<form method="POST" enctype="multipart/form-data" use:enhance>
		<div class="mx-auto my-8 flex flex-col justify-evenly md:flex-row">
			<Switch
				name="published"
				checked={$form.published}
				onCheckedChange={(e) => ($form.published = e.checked)}
				class="mx-auto"
			>
				<Switch.Control class="data-[state=checked]:preset-filled-success-500">
					<Switch.Thumb />
				</Switch.Control>
				<Switch.Label>
					{#if $form.published}Public{:else}Hidden{/if}
				</Switch.Label>
				<Switch.HiddenInput />
			</Switch>

			<Switch
				name="status"
				checked={$form.status}
				onCheckedChange={(e) => ($form.status = e.checked)}
				disabled={profile.role != "administrator"}
				class="mx-auto"
			>
				<Switch.Control class="data-[state=checked]:preset-filled-success-500">
					<Switch.Thumb />
				</Switch.Control>
				<Switch.Label>
					{#if $form.status}
						{scriptStatus.official.icon}{scriptStatus.official.name}
					{:else}
						{scriptStatus.community.icon}{scriptStatus.community.name}
					{/if}
				</Switch.Label>
				<Switch.HiddenInput />
			</Switch>

			<Switch
				name="type"
				checked={$form.type}
				onCheckedChange={(e) => ($form.type = e.checked)}
				class="mx-auto"
			>
				<Switch.Control class="data-[state=checked]:preset-filled-success-500">
					<Switch.Thumb />
				</Switch.Control>
				<Switch.Label>
					{#if $form.type}
						{scriptTypes.premium.icon}{scriptTypes.premium.name}
					{:else}
						{scriptTypes.free.icon}{scriptTypes.free.name}
					{/if}
				</Switch.Label>
				<Switch.HiddenInput />
			</Switch>
		</div>
		<div class="my-8 flex flex-col justify-evenly">
			<label class="label">
				<span class="label-text">Title:</span>
				<input
					type="text"
					id="title"
					name="title"
					class="input"
					class:ring-error-500={$errors.title != null}
					bind:value={$form.title}
				/>
			</label>
			{#if $errors.title}
				{#each $errors.title as err (err)}
					<small class="text-error-500">{err}</small>
				{/each}
			{/if}
		</div>

		<div class="my-8 flex flex-col">
			<label class="label">
				<span class="label-text">Description (recommended 60-80 characters):</span>
				<textarea
					id="description"
					name="description"
					class="textarea"
					class:ring-error-500={$errors.description != null}
					bind:value={$form.description}
				>
				</textarea>
			</label>
			{#if $errors.description}
				{#each $errors.description as err (err)}
					<small class="text-error-500">{err}</small>
				{/each}
			{/if}
		</div>

		<div class="my-8 flex flex-col">
			<label class="label">
				<span class="label-text">Content:</span>
				<textarea
					id="content"
					name="content"
					class="textarea h-64"
					class:ring-error-500={$errors.content != null}
					bind:value={$form.content}
				>
				</textarea>
			</label>
			{#if $errors.content}
				{#each $errors.content as err (err)}
					<small class="text-error-500">{err}</small>
				{/each}
			{/if}
		</div>

		<div class="my-16 flex flex-col">
			<label class="label">
				<span class="label-text">Categories:</span>
				<select
					id="categories"
					name="categories"
					class="select overflow-y-scroll"
					class:ring-error-500={$errors.categories != null}
					bind:value={$form.categories}
					multiple
				>
					{#each categories as category (category.value)}
						<option value={category.value} class="selection:bg-primary-500">
							{category.icon}{category.name}
						</option>
					{/each}
				</select>
			</label>
			<small class="my-2">
				{#each $form.categories as category (category)}
					<span class="mx-2">
						{scriptCategories[category].icon}{scriptCategories[category].name}
					</span>
				{/each}
			</small>
			<span class="mx-auto">
				<kbd class="kbd">CTRL + Click</kbd>
				or
				<kbd class="kbd">SHIFT + Click</kbd>
				to select multiple categories on Desktop
			</span>
			{#if $errors.categories?._errors}
				{#each $errors.categories._errors as err (err)}
					<small class="text-error-500">{err}</small>
				{/each}
			{/if}
		</div>

		{#if $errors._errors && $errors._errors.length > 0}
			<div class="my-8">
				{#each $errors._errors as err (err)}
					<div class="flex justify-center text-error-500">{err}</div>
				{/each}
			</div>
		{/if}

		<div class="flex justify-between">
			<a href="./">
				<button class="btn preset-filled-primary-500 font-bold">Back</button>
			</a>

			<button type="submit" class="btn preset-filled-primary-500 font-bold">Submit</button>
		</div>
	</form>
</main>
