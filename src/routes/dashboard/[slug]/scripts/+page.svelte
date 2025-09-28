<script lang="ts">
	import { newScriptSchema, scriptArraySchema } from "$lib/client/schemas"
	import { superForm } from "sveltekit-superforms"
	import { zodClient } from "sveltekit-superforms/adapters"
	import SubscriptionViewer from "../SubscriptionViewer.svelte"
	import FreeAccessViewer from "../FreeAccessViewer.svelte"

	const { data } = $props()
	const { available, subscriptions, freeAccess } = $derived(data)

	const {
		form: scriptsForm,
		errors: scriptErrors,
		enhance: scriptsEnhance
	} = superForm(data.scriptsForm, {
		id: "scripts",
		dataType: "json",
		multipleSubmits: "prevent",
		clearOnSubmit: "errors-and-message",
		validators: zodClient(scriptArraySchema)
	})

	const {
		form: newScriptForm,
		errors: newScriptErrors,
		enhance: newScriptEnhance
	} = superForm(data.newScriptForm, {
		id: "newscript",
		dataType: "json",
		multipleSubmits: "prevent",
		clearOnSubmit: "errors-and-message",
		validators: zodClient(newScriptSchema)
	})

	const headers = [
		"Title",
		"Weekly Price",
		"Monthly Price",
		"Yearly Price",
		"Subscribers",
		"Cancelling",
		"Free Access",
		"Action"
	]
</script>

<main class="m-4">
	<h1 class="my-24 text-center">
		By making premium scripts you automatically accept the
		<a href="/legal/scripter_tos" class="text-tertiary-500"> scripter terms or service</a>
		.
	</h1>
	<div class="my-12 text-center">
		<p>All prices are displayed in EUR (Euros €).</p>
		<p>
			Setting a price to 0 disables that interval. Setting all prices to 0 disables and hides the product from
			the subscriptions page.
		</p>
	</div>

	<form
		method="POST"
		class="mx-auto table-wrap max-w-fit rounded-md preset-outlined-surface-400-600"
		use:scriptsEnhance
	>
		<table class="table border-separate space-y-6 text-xs">
			<thead class="rounded-md preset-filled-surface-200-800 text-lg font-bold">
				<tr>
					{#each headers as header (header)}
						<th>
							<span class="flex justify-center text-center text-secondary-950-50">{header}</span>
						</th>
					{/each}
				</tr>
			</thead>

			<tbody class="preset-filled-surface-100-900 [&>tr]:hover:preset-tonal-surface">
				{#each $scriptsForm.scripts, i}
					<tr>
						<td class="text-center">
							<input
								name="name"
								class="mx-auto input w-fit preset-outlined-surface-500"
								type="text"
								bind:value={$scriptsForm.scripts[i].name}
							/>
							{#if $scriptErrors.scripts && $scriptErrors.scripts[i].name}
								{#each $scriptErrors.scripts[i].name as err (err)}
									<small class="text-error-500">{err}</small>
								{/each}
							{/if}
						</td>

						{#each $scriptsForm.scripts[i].prices, j}
							<td class="text-center">
								<input
									name="prices"
									class="mx-auto input w-24 preset-outlined-surface-500"
									type="number"
									bind:value={$scriptsForm.scripts[i].prices[j].amount}
									step="0.01"
								/>
								{#if $scriptErrors.scripts && $scriptErrors.scripts[i].prices && $scriptErrors.scripts[i].prices[j].amount}
									{#each $scriptErrors.scripts[i].prices[j].amount as err (err)}
										<small class="text-error-500">{err}</small>
									{/each}
								{/if}
							</td>
						{/each}

						<td class="text-center">
							<SubscriptionViewer
								id={$scriptsForm.scripts[i].id}
								name={$scriptsForm.scripts[i].name}
								count={subscriptions[i].length}
							/>
						</td>
						<td class="text-center">{subscriptions[i].filter((s) => s.cancel).length}</td>
						<td class="text-center">
							<FreeAccessViewer
								id={$scriptsForm.scripts[i].id}
								name={$scriptsForm.scripts[i].name}
								count={freeAccess[i].length}
							/>
						</td>

						<td class="text-center">
							<button
								id="button-{$scriptsForm.scripts[i].id}"
								type="submit"
								class="btn preset-filled-primary-500 font-bold"
								formaction="?/scriptEdit&product={$scriptsForm.scripts[i].id}"
							>
								Save
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</form>

	<form
		method="POST"
		action="?/scriptAdd"
		class="mx-auto my-12 flex flex-col rounded-md preset-outlined-surface-400-600 p-4 text-center"
		use:newScriptEnhance
	>
		<h1 class="my-4 text-lg">New Script</h1>

		{#if available.length === 0}
			<h2 class="my-24 text-center text-lg text-warning-500">
				You either have no premium scripts or all your premium scripts are already products in the table
				above.
			</h2>
		{/if}

		<label class="mx-auto label max-w-96">
			<span class="label-text">Script:</span>
			<select
				class="select"
				bind:value={$newScriptForm.id}
				class:disabled={available.length === 0}
				class:ring-error-500={$newScriptErrors.id}
			>
				{#each available as script (script.id)}
					<option value={script.id}>{script.name}</option>
				{/each}
			</select>
			{#if $newScriptErrors.id}
				{#each $newScriptErrors.id as err (err)}
					<small class="text-error-500">{err}</small>
				{/each}
			{/if}
		</label>

		<div class="mx-auto my-12 flex flex-col justify-center gap-4 md:flex-row">
			{#each ["Weekly", "Monthly", "Yearly"] as interval, i (interval)}
				<label class="label max-w-80">
					<span class="label-text">{interval} price:</span>
					<input
						type="number"
						class="input"
						step="0.01"
						bind:value={$newScriptForm.prices[i].amount}
						class:disabled={available.length === 0}
						class:ring-error-500={$newScriptErrors.prices && $newScriptErrors.prices[i]?.amount}
					/>
					{#if $newScriptErrors.prices && $newScriptErrors.prices[i]?.amount}
						{#each $newScriptErrors.prices[i].amount as err (err)}
							<small class="text-error-500">{err}</small>
						{/each}
					{/if}
				</label>
			{/each}
		</div>

		<button type="submit" class="mx-auto my-8 btn w-32 preset-filled-primary-500">Add</button>
	</form>
</main>
