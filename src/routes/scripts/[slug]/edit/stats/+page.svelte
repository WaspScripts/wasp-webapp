<script lang="ts">
	import { superForm } from "sveltekit-superforms"
	import { zodClient } from "sveltekit-superforms/adapters"
	import { scriptStatsSchema } from "$lib/client/schemas"
	const { data } = $props()

	const { form, errors, enhance } = superForm(data.form!, {
		dataType: "json",
		multipleSubmits: "prevent",
		taintedMessage: "Are you sure you want to leave?",
		validators: zodClient(scriptStatsSchema),
		scrollToError: true
	})

	let customTracker = $state("")
	let customMinimum = $state(0)
	let customMaximum = $state(0)
	let trackersIndex = $state(-1)
</script>

<main>
	<header class="my-8 text-center">
		<h3>Edit Script Stats</h3>
	</header>
	<form method="POST" enctype="multipart/form-data" use:enhance>
		<div class="my-8 rounded-md preset-filled-surface-100-900 p-8">
			<h5 class="my-8 text-center">Stats limits (every 5 minutes)</h5>
			<div class="flex flex-col justify-between gap-4 md:flex-row">
				<div class="flex w-full flex-col gap-4 lg:flex-row">
					<div class="w-full">
						<label class="label">
							<span class="label-text">Minimum Experience:</span>
							<input
								type="number"
								id="xp_min"
								name="xp_min"
								class="input"
								class:ring-error-500={$errors.xp_min != null}
								bind:value={$form.xp_min}
							/>
						</label>
						{#if $errors.xp_min}
							<small class="text-error-500">{$errors.xp_min}</small>
						{/if}
					</div>

					<div class="w-full">
						<label class="label">
							<span class="label-text">Maximum Experience:</span>
							<input
								type="number"
								id="xp_max"
								name="xp_max"
								class="input"
								class:ring-error-500={$errors.xp_max}
								bind:value={$form.xp_max}
							/>
						</label>
						{#if $errors.xp_max}
							<small class="text-error-500">{$errors.xp_max}</small>
						{/if}
					</div>
				</div>

				<div class="flex w-full flex-col gap-4 lg:flex-row">
					<div class="w-full">
						<label class="label">
							<span class="label-text">Minimum Gold:</span>
							<input
								type="number"
								id="gp_min"
								name="gp_min"
								class="input"
								class:ring-error-500={$errors.gp_min != null}
								bind:value={$form.gp_min}
							/>
						</label>
						{#if $errors.gp_min}
							<small class="text-error-500">{$errors.gp_min}</small>
						{/if}
					</div>

					<div class="w-full">
						<label class="label">
							<span class="label-text">Maximum Gold:</span>
							<input
								type="number"
								id="gp_max"
								name="gp_max"
								class="input"
								class:ring-error-500={$errors.gp_max}
								bind:value={$form.gp_max}
							/>
						</label>
						{#if $errors.gp_max}
							<small class="text-error-500">{$errors.gp_max}</small>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<div class="my-8 rounded-md preset-filled-surface-100-900 p-8">
			<h5 class="my-8 text-center">Custom Stats (every 5 minutes)</h5>
			<span class="mx-auto my-16 flex flex-col text-center">
				<p>This is currently being tested and may not work. Consider it in an alpha state.</p>
				<p>All values below must have the same length and each index goes together with each other</p>
			</span>
			<div class="flex flex-col justify-between gap-4">
				<div class="flex w-full flex-col gap-4 lg:flex-row">
					<label class="label">
						<span class="label-text">Tracker:</span>
						<input type="text" class="input" bind:value={customTracker} />
					</label>

					<label class="label">
						<span class="label-text">Minimum:</span>
						<input type="number" class="input" bind:value={customMinimum} />
					</label>

					<label class="label">
						<span class="label-text">Maximum:</span>
						<input type="number" class="input" bind:value={customMaximum} />
					</label>
				</div>

				<button
					class="mx-auto btn preset-filled-primary-500 px-8 font-bold"
					onclick={(e) => {
						e.preventDefault()
						if (customTracker == "") return
						if (customMinimum >= customMaximum) return
						$form.trackers = [...$form.trackers, customTracker]
						$form.minima = [...$form.minima, customMinimum]
						$form.maxima = [...$form.maxima, customMaximum]

						customTracker = ""
						customMinimum = 0
						customMaximum = 0
						trackersIndex = $form.trackers.length - 1
					}}
				>
					Add
				</button>
			</div>
			<div class="flex flex-col justify-between gap-4 md:flex-row">
				<div class="flex w-full flex-col">
					<span class="mx-auto my-12 flex justify-center">Modify current trackers</span>

					<label class="label">
						<span class="label-text">Trackers:</span>
						<select
							class="select overflow-y-scroll"
							disabled={$form.trackers.length == 0}
							bind:value={trackersIndex}
						>
							{#each $form.trackers as tracker, idx (tracker)}
								<option value={idx} selected={idx === trackersIndex} class="selection:bg-primary-500">
									{tracker}
								</option>
							{/each}
						</select>
					</label>

					<div class="my-4 flex flex-col gap-4 md:flex-row">
						<label class="label">
							<span class="label-text">Custom tracker:</span>
							<input
								type="text"
								class="input"
								disabled={trackersIndex == -1}
								bind:value={$form.trackers[trackersIndex]}
							/>
						</label>

						<label class="label">
							<span class="label-text">Custom minimum:</span>
							<input
								type="number"
								class="input"
								disabled={trackersIndex == -1}
								class:ring-error-500={$errors.minima != null}
								bind:value={$form.minima[trackersIndex]}
							/>
						</label>

						<label class="label">
							<span class="label-text">Custom maximum:</span>
							<input
								type="number"
								class="input"
								disabled={trackersIndex == -1}
								class:ring-error-500={$errors.maxima != null}
								bind:value={$form.maxima[trackersIndex]}
							/>
						</label>
					</div>

					<button
						class="mx-auto my-4 btn preset-filled-primary-500 font-bold"
						disabled={trackersIndex == -1}
						onclick={(e) => {
							e.preventDefault()
							if ($form.trackers.length === 0) return
							form.update((form) => {
								form.trackers.splice(trackersIndex, 1)
								form.minima.splice(trackersIndex, 1)
								form.maxima.splice(trackersIndex, 1)
								return form
							})
							if ($form.trackers.length === 0) trackersIndex -= 1
						}}
					>
						Remove
					</button>
				</div>
			</div>
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
