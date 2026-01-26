<script lang="ts">
	import { superForm } from "sveltekit-superforms"
	import { zodClient } from "sveltekit-superforms/adapters"
	import { cropString, scriptCategories, scriptStages, scriptStatus, scriptTypes } from "$lib/utils"
	import { getScriptContent } from "$lib/client/utils"
	import ScriptHeader from "../ScriptHeader.svelte"
	import ScriptArticle from "../ScriptArticle.svelte"
	import { addScriptClientSchema } from "$lib/client/schemas"
	import { Combobox, FileUpload, Portal, Switch } from "@skeletonlabs/skeleton-svelte"
	import NewScriptCard from "$lib/components/NewScriptCard.svelte"
	import type { ScriptMetaData, ScriptPublic, TScriptStages } from "$lib/types/collection"
	import FileCode from "@lucide/svelte/icons/file-code"
	import ImagePlus from "@lucide/svelte/icons/image-plus"

	const { data } = $props()
	let profile = $derived(data.profile!)

	const { form, errors, enhance, validate } = superForm(data.form!, {
		dataType: "json",
		multipleSubmits: "prevent",
		taintedMessage: "Are you sure you want to leave?",
		validators: zodClient(addScriptClientSchema),
		scrollToError: true
	})

	const categories = Object.values(scriptCategories)

	let coverURL: string = $state("/cover.jpg")
	let bannerURL: string = $state("/banner.jpg")

	let cStyle: 0 | 1 | 2 = $state(0)
	let bStyle: 0 | 1 | 2 = $state(0)
	let sStyle: 0 | 1 | 2 = $state(0)

	let show: boolean[] = $state([false, false, false])

	let publicData: ScriptPublic = $derived({
		id: "SCRIPT_ID_UNDEFINED",
		title: $form.title,
		description: $form.description,
		content: $form.description,
		published: $form.published,
		url: ""
	})

	let metaData: ScriptMetaData = $derived({
		status: $form.status ? "official" : "community",
		type: $form.type ? "premium" : "free",
		categories: $form.categories,
		stage: $form.stage as TScriptStages
	})

	let simbaFiles: string[] = $state([])

	let dialog: HTMLDialogElement
	let newStage = $state($form.stage)
	let oldStage = $state($form.stage)
</script>

<main>
	{#if show[0]}
		<main class="mx-auto w-[90%] flex-col">
			<ScriptHeader
				id="SCRIPT_ID_UNDEFINED"
				title={$form.title}
				username={profile.username}
				description={$form.description}
			>
				<img class="rounded-md" src={bannerURL} alt="Script banner" loading="lazy" />
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
					content={getScriptContent(
						publicData,
						{
							xp_min: 0,
							xp_max: 0,
							gp_min: 0,
							gp_max: 0
						},
						profile.username ?? ""
					)}
				/>
			</div>
		</main>
	{/if}

	{#if show[1]}
		<div class="max-w-2x m-8">
			<div class="grid grid-cols-1 justify-items-center">
				<NewScriptCard script={publicData} metadata={metaData} customCover={coverURL} />
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
					<span class="text-lg font-semibold text-blue-400">{$form.title} - WaspScripts</span>
					<p>{cropString("RuneScape OSRS Color Bot - " + $form.description, 160)}</p>
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

		<article class="xs:w-full mx-auto my-8 rounded-md preset-outlined-surface-500 p-8 md:w-6/7 lg:w-3/4">
			<header class="my-8 text-center">
				<h3>Edit Script</h3>
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
							class:ring-error-500={$errors.title != null}
						>
							{#each Object.keys(scriptStages) as stage}
								<option
									value={scriptStages[stage as TScriptStages].value}
									disabled={scriptStages[stage as TScriptStages].value === "archived"}
									class="disabled:bg-surface-50-950 disabled:text-surface-400-600"
								>
									{scriptStages[stage as TScriptStages].icon +
										" " +
										scriptStages[stage as TScriptStages].name}
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
									- 💡 Prototype: Has a warning. Only you, moderators/administrators can see/download the
									script.
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
									- 💀 Archived: Has a warning. Only you, moderators/administrators can see/download the
									script.
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

				<div class="mx-auto my-12 flex flex-col justify-evenly md:flex-row">
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

					{#if $errors.categories?._errors}
						{#each $errors.categories._errors as err (err)}
							<small class="text-error-500">{err}</small>
						{/each}
					{/if}

					<span class="mx-auto">
						<kbd class="kbd">CTRL + Click</kbd>
						or
						<kbd class="kbd">SHIFT + Click</kbd>
						to select multiple categories on Desktop
					</span>
				</div>

				<div class="my-8 rounded-md p-8">
					<h5 class="my-8 text-center">Versions</h5>
					<div class="flex w-full flex-col gap-4 lg:flex-row">
						<div class="w-full">
							<Combobox
								value={[$form.simba]}
								onValueChange={(e) => ($form.simba = e.value[0])}
								class="w-full max-w-md"
								placeholder="Simba version"
								ids={{ input: "simba" }}
								allowCustomValue={true}
								defaultInputValue={$form.simba}
							>
								<Combobox.Label>Simba:</Combobox.Label>
								<Combobox.Control>
									<Combobox.Input />
									<Combobox.Trigger />
								</Combobox.Control>
								<Portal>
									<Combobox.Positioner class="z-1!">
										<Combobox.Content>
											{#each data.simbaVersions as version (version.version)}
												<Combobox.Item item={version.version}>
													<Combobox.ItemText>{version.version}</Combobox.ItemText>
													<Combobox.ItemIndicator />
												</Combobox.Item>
											{/each}
										</Combobox.Content>
									</Combobox.Positioner>
								</Portal>
							</Combobox>

							{#if $errors.simba}
								<small class="text-error-500">{$errors.simba}</small>
							{/if}
						</div>

						<div class="w-full">
							<Combobox
								value={[$form.wasplib]}
								onValueChange={(e) => ($form.wasplib = e.value[0])}
								class="w-full max-w-md"
								placeholder="WaspLib version"
								ids={{ input: "wasplib" }}
								allowCustomValue={true}
								defaultInputValue={$form.wasplib}
							>
								<Combobox.Label>WaspLib:</Combobox.Label>
								<Combobox.Control>
									<Combobox.Input />
									<Combobox.Trigger />
								</Combobox.Control>
								<Portal>
									<Combobox.Positioner class="z-1!">
										<Combobox.Content>
											{#each data.wlVersions as version (version.version)}
												<Combobox.Item item={version.version}>
													<Combobox.ItemText>{version.version}</Combobox.ItemText>
													<Combobox.ItemIndicator />
												</Combobox.Item>
											{/each}
										</Combobox.Content>
									</Combobox.Positioner>
								</Portal>
							</Combobox>
							{#if $errors.wasplib}
								<small class="text-error-500">{$errors.wasplib}</small>
							{/if}
						</div>
					</div>
				</div>

				<h5 class="my-8 text-center">Files</h5>
				<div class="flex flex-col justify-between gap-4 2xl:flex-row">
					<FileUpload
						name="cover"
						accept="image/jpeg"
						maxFiles={1}
						maxFileSize={1024 * 1024 * 50}
						onFileReject={console.error}
						class="w-full {cStyle === 0 ? '' : cStyle === 1 ? 'text-success-500' : 'text-error-500'}"
						allowDrop
						onFileChange={async (details) => {
							cStyle = 0
							coverURL = "/cover.jpg"
							if (details.acceptedFiles.length === 0) {
								if (details.rejectedFiles.length > 0) cStyle = 2
								return
							}

							$form.cover = details.acceptedFiles[0]
							cStyle = 2
							const invalid = await validate("cover")

							if (invalid) {
								console.error(invalid)
								return
							}

							cStyle = 1
							let reader = new FileReader()
							reader.onload = function () {
								coverURL = reader.result as string
							}
							reader.readAsDataURL(details.acceptedFiles[0])
						}}
					>
						<FileUpload.Dropzone
							class="preset-filled-surface-100-900 text-center hover:preset-filled-surface-200-800"
						>
							<ImagePlus class="mx-auto " />
							<span class="my-2">Cover Image</span>
							<span class="text-xs opacity-60">
								{$errors.cover == null
									? "Must be exactly 300x200 pixels and JPG format."
									: $errors.cover.toString()}</span
							>
							<FileUpload.HiddenInput />
						</FileUpload.Dropzone>

						<FileUpload.ItemGroup>
							<FileUpload.Context>
								{#snippet children(fileUpload)}
									{#each fileUpload().acceptedFiles as file (file.name)}
										<FileUpload.Item {file}>
											<FileUpload.ItemName>{file.name}</FileUpload.ItemName>
											<FileUpload.ItemSizeText>{file.size} bytes</FileUpload.ItemSizeText>
											<FileUpload.ItemDeleteTrigger />
										</FileUpload.Item>
									{/each}
								{/snippet}
							</FileUpload.Context>
						</FileUpload.ItemGroup>
					</FileUpload>

					<FileUpload
						name="banner"
						accept="image/jpeg"
						maxFiles={1}
						maxFileSize={1024 * 1024 * 50}
						onFileReject={console.error}
						class="w-full {bStyle === 0 ? '' : bStyle === 1 ? 'text-success-500' : 'text-error-500'}"
						allowDrop
						onFileChange={async (details) => {
							bStyle = 0
							bannerURL = "/banner.jpg"
							if (details.acceptedFiles.length === 0) {
								if (details.rejectedFiles.length > 0) bStyle = 2
								return
							}

							$form.banner = details.acceptedFiles[0]
							bStyle = 2
							const invalid = await validate("banner")

							if (invalid) {
								console.error(invalid)
								return
							}

							bStyle = 1
							let reader = new FileReader()
							reader.onload = function () {
								bannerURL = reader.result as string
							}
							reader.readAsDataURL(details.acceptedFiles[0])
						}}
					>
						<FileUpload.Dropzone
							class="preset-filled-surface-100-900 text-center hover:preset-filled-surface-200-800"
						>
							<ImagePlus class="mx-auto " />
							<span class="my-2">Banner Image</span>
							<span class="text-xs opacity-60">
								{$errors.banner == null
									? "Must be exactly 1920x768 pixels and JPG format."
									: $errors.banner.toString()}</span
							>
							<FileUpload.HiddenInput />
						</FileUpload.Dropzone>

						<FileUpload.ItemGroup>
							<FileUpload.Context>
								{#snippet children(fileUpload)}
									{#each fileUpload().acceptedFiles as file (file.name)}
										<FileUpload.Item {file}>
											<FileUpload.ItemName>{file.name}</FileUpload.ItemName>
											<FileUpload.ItemSizeText>{file.size} bytes</FileUpload.ItemSizeText>
											<FileUpload.ItemDeleteTrigger />
										</FileUpload.Item>
									{/each}
								{/snippet}
							</FileUpload.Context>
						</FileUpload.ItemGroup>
					</FileUpload>

					<FileUpload
						name="script"
						accept={[".simba", ".png", ".txt", ".ini", ".json", ".zip", ".bin", ".obj", ".mtl", ".graph"]}
						maxFiles={20}
						maxFileSize={1024 * 1024 * 50}
						onFileReject={console.error}
						class="w-full {sStyle === 0 ? '' : sStyle === 1 ? 'text-success-500' : 'text-error-500'}"
						allowDrop
						onFileChange={async (details) => {
							sStyle = details.rejectedFiles.length > 0 ? 2 : 0

							if (details.acceptedFiles.length === 0) {
								$form.main = ""
								return
							}

							$form.script = details.acceptedFiles
							simbaFiles = []
							for (const file of details.acceptedFiles) {
								if (file.name.endsWith(".simba")) simbaFiles.push(file.name)
							}

							sStyle = 1
							if (!$form.main && simbaFiles.length > 0) {
								$form.main = simbaFiles[0]
							}
						}}
					>
						<FileUpload.Dropzone
							class="preset-filled-surface-100-900 text-center hover:preset-filled-surface-200-800"
						>
							<FileCode class="mx-auto" />
							<span class="my-2">Script Files</span>
							<span class="text-xs opacity-60">
								{$errors.script == null
									? "Must be exactly 1920x768 pixels and JPG format."
									: $errors.script.toString()}</span
							>
							<FileUpload.HiddenInput />
						</FileUpload.Dropzone>

						<FileUpload.ItemGroup>
							<FileUpload.Context>
								{#snippet children(fileUpload)}
									{#each fileUpload().acceptedFiles as file (file.name)}
										<FileUpload.Item {file}>
											<FileUpload.ItemName>{file.name}</FileUpload.ItemName>
											<FileUpload.ItemSizeText>{file.size} bytes</FileUpload.ItemSizeText>
											<FileUpload.ItemDeleteTrigger />
										</FileUpload.Item>
									{/each}
								{/snippet}
							</FileUpload.Context>
						</FileUpload.ItemGroup>
					</FileUpload>
				</div>

				<div class="my-8 rounded-md preset-filled-surface-100-900 p-8">
					<label class="label">
						<span class="label-text">Main file:</span>
						<select
							id="main"
							name="main"
							class="select overflow-y-scroll"
							class:ring-error-500={$errors.main != null}
							bind:value={$form.main}
						>
							{#each simbaFiles as file (file)}
								<option value={file} class="selection:bg-primary-500">
									{file}
								</option>
							{/each}
						</select>
					</label>
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
		</article>
	</div>
</main>
