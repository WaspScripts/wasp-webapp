<script lang="ts">
	import { superForm } from "sveltekit-superforms"
	import { zodClient } from "sveltekit-superforms/adapters"
	import FileCode from "@lucide/svelte/icons/file-code"
	import ImagePlus from "@lucide/svelte/icons/image-plus"
	import { scriptFilesSchema } from "$lib/client/schemas"
	import { Combobox, FileUpload, Portal } from "@skeletonlabs/skeleton-svelte"

	const { data } = $props()

	const { form, errors, enhance, message } = superForm(data.form!, {
		dataType: "json",
		multipleSubmits: "prevent",
		taintedMessage: "Are you sure you want to leave?",
		validators: zodClient(scriptFilesSchema),
		scrollToError: true
	})

	let cStyle: 0 | 1 | 2 = $state(0)
	let bStyle: 0 | 1 | 2 = $state(0)
	let sStyle: 0 | 1 | 2 = $state(0)

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
					cStyle = details.rejectedFiles.length > 0 ? 2 : 0
					if (details.acceptedFiles.length === 0) return
					$form.cover = details.acceptedFiles[0]
					cStyle = 1
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
					bStyle = details.rejectedFiles.length > 0 ? 2 : 0
					if (details.acceptedFiles.length === 0) return
					$form.banner = details.acceptedFiles[0]
					bStyle = 1
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
						$form.main = undefined
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

	{#if $message}
		<div class="text-success-500">{$message}</div>
	{/if}
</main>
