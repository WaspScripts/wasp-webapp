<script lang="ts">
	import { superForm } from "sveltekit-superforms"
	import { zodClient } from "sveltekit-superforms/adapters"
	import { scriptCategories, scriptStages, scriptStatus, scriptTypes } from "$lib/utils"
	import { scriptInfoSchema } from "$lib/client/schemas"
	import { Switch } from "@skeletonlabs/skeleton-svelte"

	const { data } = $props()
	let profile = $derived(data.profile!)

	const { form, errors, enhance, message } = superForm(data.form!, {
		dataType: "json",
		multipleSubmits: "prevent",
		taintedMessage: "Are you sure you want to leave?",
		validators: zodClient(scriptInfoSchema),
		scrollToError: true
	})

	const categories = Object.values(scriptCategories)

	let dialog: HTMLDialogElement

	const stages = Object.keys(scriptStages)
	const stageIdx = stages.indexOf($form.stage)
	let newStage = $state($form.stage)
	let oldStage = $state($form.stage)
</script>

<main>
	<header class="my-8 text-center">
		<h3>Edit Script Information</h3>
	</header>
	<form method="POST" enctype="multipart/form-data" use:enhance>
		<div class="mx-auto">
			<label class="mx-auto label w-94">
				<span class="label-text">Script stage:</span>
				<select
					class="mx-auto select"
					bind:value={newStage}
					onchange={() => {
						dialog.showModal()
					}}
					class:ring-error-500={$errors.stage != null}
				>
					{#each stages as stage, idx}
						<option
							value={scriptStages[stage as TScriptStages].value}
							disabled={idx < stageIdx}
							class="disabled:bg-surface-50-950 disabled:text-surface-400-600"
						>
							{scriptStages[stage as TScriptStages].icon + " " + scriptStages[stage as TScriptStages].name}
						</option>
					{/each}
				</select>
				{#if $errors.stage}
					{#each $errors.stage as err (err)}
						<small class="text-error-500">{err}</small>
					{/each}
				{/if}
			</label>

			<dialog
				bind:this={dialog}
				class="top-1/2 left-1/2 z-10 max-w-[840px] -translate-1/2 space-y-4 rounded-container bg-surface-100-900 p-4 text-inherit backdrop-blur-lg backdrop:bg-surface-50-950/90"
			>
				<h2 class="text-center h3">Script Stage</h2>
				<div class="m-4">
					<div class="text-lg">
						<p>Script stage represents the stage of your script lifecyle in a linear fashion.</p>
						<p>
							You can freely jump stages, e.g. from "prototype" to "stable", but you can never go back to
							previous stages. This means that once you make your script "stable" it can never again be
							"prototype", "alpha" or "beta".
						</p>
						<p class="my-4">Access rules:</p>
					</div>
					<ul class="mx-auto text-sm">
						<li>
							- 💡 Prototype: Has a warning. Only you, moderators/administrators can see/download the script.
						</li>
						<li>
							- 🧪 Alpha: Has a warning. Only you, testers/scripters/moderators/administrators can
							see/download the script.
						</li>
						<li>- 🔬 Beta: Has a warning. Everyone can see/download your script.</li>
						<li>
							- 🤖 Stable: No warning. Everyone can see the script and those with access can download it.
						</li>
						<li>
							- 💀 Archived: Has a warning. Only you, moderators/administrators can see/download the script.
						</li>
					</ul>
				</div>
				<footer class="flex justify-end gap-4">
					<button
						type="button"
						class="btn preset-tonal"
						onclick={() => {
							newStage = oldStage
							dialog.close()
						}}
					>
						Cancel
					</button>
					<button
						type="button"
						class="btn preset-filled-success-500"
						onclick={() => {
							oldStage = newStage
							$form.stage = newStage
							dialog.close()
						}}
					>
						Confirm
					</button>
				</footer>
			</dialog>
		</div>

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

	{#if $message}
		<div class="mx-auto my-12 flex justify-center font-bold text-success-500">{$message}</div>
	{/if}
</main>
