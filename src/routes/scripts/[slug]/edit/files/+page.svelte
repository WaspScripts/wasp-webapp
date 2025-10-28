<script lang="ts">
	import { superForm } from "sveltekit-superforms"
	import { zodClient } from "sveltekit-superforms/adapters"
	import { FileCode, ImagePlus } from "svelte-lucide"
	import { scriptFilesSchema } from "$lib/client/schemas"
	import { Combobox, FileUpload } from "@skeletonlabs/skeleton-svelte"

	const { data } = $props()

	const { form, errors, enhance } = superForm(data.form!, {
		dataType: "json",
		multipleSubmits: "prevent",
		taintedMessage: "Are you sure you want to leave?",
		validators: zodClient(scriptFilesSchema),
		scrollToError: true
	})

	let coverStyle: 0 | 1 | 2 = $state(0)
	let bannerStyle: 0 | 1 | 2 = $state(0)
	let scriptStyle: 0 | 1 | 2 = $state(0)

	let simbaFiles: string[] = $state([])
</script>

<main>
	<header class="my-8 text-center">
		<h3>Edit Script Files</h3>
	</header>
	<form method="POST" enctype="multipart/form-data" use:enhance>
		<div class="my-8 rounded-md p-8">
			<h5 class="my-8 text-center">Versions</h5>
			<div class="flex w-full flex-col gap-4 lg:flex-row">
				<div class="w-full">
					<Combobox
						data={data.simbaVersions}
						value={[$form.simba]}
						onValueChange={(e) => ($form.simba = e.value[0])}
						label="Simba:"
						ids={{ input: "simba" }}
						allowCustomValue={true}
						defaultInputValue={$form.simba}
						zIndex="1"
					></Combobox>
					{#if $errors.simba}
						<small class="text-error-500">{$errors.simba}</small>
					{/if}
				</div>

				<div class="w-full">
					<Combobox
						data={data.wlVersions}
						value={[$form.wasplib]}
						onValueChange={(e) => ($form.wasplib = e.value[0])}
						label="WaspLib:"
						ids={{ input: "wasplib" }}
						allowCustomValue={true}
						defaultInputValue={$form.wasplib}
						zIndex="1"
					></Combobox>

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
				label="Cover image"
				accept="image/jpeg"
				maxFiles={1}
				maxFileSize={1024 * 1024 * 50}
				subtext={$errors.cover == null
					? "Must be exactly 300x200 pixels and JPG format."
					: $errors.cover.toString()}
				onFileReject={console.error}
				interfaceIcon={coverStyle === 0 ? "" : coverStyle === 1 ? "text-success-500" : "text-error-500"}
				interfaceText={coverStyle === 0 ? "" : coverStyle === 1 ? "text-success-500" : "text-error-500"}
				interfaceSubtext="type-scale-1 opacity-60 {coverStyle === 0
					? ''
					: coverStyle === 1
						? 'text-success-500'
						: 'text-error-500'}"
				classes="w-full"
				interfaceBase="preset-filled-surface-100-900 text-center hover:preset-filled-surface-200-800"
				allowDrop
				onFileChange={async (details) => {
					coverStyle = details.rejectedFiles.length > 0 ? 2 : 0
					if (details.acceptedFiles.length === 0) return
					$form.cover = details.acceptedFiles[0]
					coverStyle = 1
				}}
			>
				{#snippet iconInterface()}<ImagePlus class="mx-auto" />{/snippet}
			</FileUpload>

			<FileUpload
				name="banner"
				label="Banner image"
				accept="image/jpeg"
				maxFiles={1}
				maxFileSize={1024 * 1024 * 50}
				subtext={$errors.banner == null
					? "Must be exactly 1920x768 pixels and JPG format."
					: $errors.banner.toString()}
				interfaceIcon={bannerStyle === 0 ? "" : bannerStyle === 1 ? "text-success-500" : "text-error-500"}
				interfaceText={bannerStyle === 0 ? "" : bannerStyle === 1 ? "text-success-500" : "text-error-500"}
				interfaceSubtext="type-scale-1 opacity-60 {bannerStyle === 0
					? ''
					: bannerStyle === 1
						? 'text-success-500'
						: 'text-error-500'}"
				onFileReject={console.error}
				classes="w-full"
				interfaceBase="preset-filled-surface-100-900 text-center hover:preset-filled-surface-200-800"
				allowDrop
				onFileChange={async (details) => {
					bannerStyle = details.rejectedFiles.length > 0 ? 2 : 0
					if (details.acceptedFiles.length === 0) return
					$form.banner = details.acceptedFiles[0]
					bannerStyle = 1
				}}
			>
				{#snippet iconInterface()}<ImagePlus class="mx-auto" />{/snippet}
			</FileUpload>

			<FileUpload
				name="script"
				label="Simba script"
				accept={[".simba", ".png", ".txt", ".ini", ".json", ".zip", ".bin", ".obj", ".mtl", ".graph"]}
				maxFiles={20}
				maxFileSize={1024 * 1024 * 50}
				subtext={$errors.script == null ? "Must be a simba script file." : $errors.script.toString()}
				interfaceIcon={scriptStyle === 0 ? "" : scriptStyle === 1 ? "text-success-500" : "text-error-500"}
				interfaceText={scriptStyle === 0 ? "" : scriptStyle === 1 ? "text-success-500" : "text-error-500"}
				interfaceSubtext="type-scale-1 opacity-60 {scriptStyle === 0
					? ''
					: scriptStyle === 1
						? 'text-success-500'
						: 'text-error-500'}"
				onFileReject={console.error}
				classes="w-full"
				interfaceBase="preset-filled-surface-100-900 text-center hover:preset-filled-surface-200-800"
				allowDrop
				onFileChange={async (details) => {
					scriptStyle = details.rejectedFiles.length > 0 ? 2 : 0

					if (details.acceptedFiles.length === 0) {
						$form.main = undefined
						return
					}

					$form.script = details.acceptedFiles
					simbaFiles = details.acceptedFiles
						.map((file) => file.name)
						.filter((file) => file.endsWith(".simba"))

					scriptStyle = 1
					if (!$form.main) {
						$form.main = $form.script[0].name
					}
				}}
			>
				{#snippet iconInterface()}<FileCode class="mx-auto" />{/snippet}
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
</main>
