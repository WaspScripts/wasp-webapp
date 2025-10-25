<script lang="ts">
	import { countryCodeSchema, dbaSchema } from "$lib/client/schemas"
	import { superForm } from "sveltekit-superforms"
	import { zodClient } from "sveltekit-superforms/adapters"

	const { data } = $props()
	const { scripter, account } = $derived(data)

	const {
		form: countryForm,
		errors: countryErrors,
		enhance: countryEnhance,
		allErrors: countryAllErrors
	} = superForm(data.countryForm, {
		dataType: "json",
		multipleSubmits: "prevent",
		clearOnSubmit: "errors-and-message",
		validators: zodClient(countryCodeSchema),
		resetForm: true
	})

	const {
		form: dbaForm,
		errors: dbaErrors,
		enhance: dbaEnhance
	} = superForm(data.dbaForm, {
		dataType: "json",
		multipleSubmits: "prevent",
		clearOnSubmit: "errors-and-message",
		validators: zodClient(dbaSchema),
		resetForm: true
	})
</script>

<main class="m-4 min-h-96">
	{#if scripter.stripe == scripter.id}
		<form method="POST" action="?/createStripe" class="my-32 grid place-items-center" use:countryEnhance>
			<h3>Stripe Account</h3>

			<div class="my-4">
				<label for="code">Choose a country (this cannot be changed later):</label>
				<select class="my-2 select" name="code" id="code" bind:value={$countryForm.code}>
					<option value="AU">Australia (AU)</option>
					<option value="AT">Austria (AT)</option>
					<option value="BE">Belgium (BE)</option>
					<option value="BG">Bulgaria (BG)</option>
					<option value="CA">Canada (CA)</option>
					<option value="HR">Croatia (HR)</option>
					<option value="CY">Cyprus (CY)</option>
					<option value="CZ">Czech Republic (CZ)</option>
					<option value="DK">Denmark (DK)</option>
					<option value="EE">Estonia (EE)</option>
					<option value="FI">Finland (FI)</option>
					<option value="FR">France (FR)</option>
					<option value="DE">Germany (DE)</option>
					<option value="GI">Gibraltar (GI)</option>
					<option value="GR">Greece (GR)</option>
					<option value="HK">Hong Kong (HK)</option>
					<option value="HU">Hungary (HU)</option>
					<option value="IE">Ireland (IE)</option>
					<option value="IT">Italy (IT)</option>
					<option value="JP">Japan (JP)</option>
					<option value="LV">Latvia (LV)</option>
					<option value="LI">Liechtenstein (LI)</option>
					<option value="LT">Lithuania (LT)</option>
					<option value="LU">Luxembourg (LU)</option>
					<option value="MT">Malta (MT)</option>
					<option value="MX">Mexico (MX)</option>
					<option value="NL">Netherlands (NL)</option>
					<option value="NZ">New Zealand (NZ)</option>
					<option value="NO">Norway (NO)</option>
					<option value="PL">Poland (PL)</option>
					<option value="PT">Portugal (PT)</option>
					<option value="RO">Romania (RO)</option>
					<option value="SG">Singapore (SG)</option>
					<option value="SK">Slovakia (SK)</option>
					<option value="SI">Slovenia (SI)</option>
					<option value="ES">Spain (ES)</option>
					<option value="SE">Sweden (SE)</option>
					<option value="CH">Switzerland (CH)</option>
					<option value="TH">Thailand (TH)</option>
					<option value="AE">United Arab Emirates (AE)</option>
					<option value="GB">United Kingdom (GB)</option>
					<option value="US">United States (US)</option>
				</select>
			</div>
			{#if $countryErrors && $countryErrors.code}
				<div class="max-h-24 overflow-x-hidden overflow-y-scroll rounded-md bg-surface-700 text-error-500">
					{$countryErrors.code}
				</div>
			{/if}
			{#if $countryAllErrors}
				<div class="max-h-24 overflow-x-hidden overflow-y-scroll rounded-md bg-surface-700 text-error-500">
					{#each $countryAllErrors as err, i (err.path)}
						{#if i === 0}
							Errors:
						{/if}
						<small class="mx-8 flex rounded-md text-error-500">
							Error path: {err.path}
							{#each err.messages as message (message)}
								{message}
							{/each}
						</small>
					{/each}
				</div>
			{/if}
			<button disabled={$countryForm.code === ""} class="btn preset-filled-primary-500">
				Create stripe connected account
			</button>
		</form>
	{:else}
		<form method="POST" action="?/displayName" class="mx-auto my-32 flex justify-center" use:dbaEnhance>
			<div class="my-4">
				<label for="dba">Invoice display name:</label>
				<input class="my-2 input" name="dba" id="dba" bind:value={$dbaForm.dba} />
				{#if $dbaErrors.dba}
					<div class="max-h-24 overflow-x-hidden overflow-y-scroll rounded-md bg-surface-700 text-error-500">
						{#each $dbaErrors.dba as err (err)}
							{err}
						{/each}
					</div>
				{/if}
			</div>
			<button class="mx-4 mt-6 btn h-10 preset-filled-primary-500">Update</button>
		</form>

		<form method="POST" action="?/onboardStripe" class="flex justify-center">
			<button class="my-2 btn h-10 preset-filled-primary-500"> Update stripe connected account </button>
		</form>

		{#if account}
			{#if account.requirements?.currently_due && account.requirements?.currently_due.length > 0}
				<div class="mx-auto mb-24 flex flex-col">
					<span class="my-2 text-error-500">Missing account information:</span>

					<div class="my-2 grid bg-surface-700 text-error-500">
						{#each account.requirements?.currently_due as requirement (requirement)}
							<small class="mx-auto w-full">{requirement}</small>
						{/each}
					</div>
					<small>
						This can be updated on the "Update stripe connected account" button. Ask Torwent for help if
						needed.
					</small>
					<small class="text-error-500"> Not having this complete may result in you not getting paid. </small>
				</div>
			{/if}

			<form method="POST" action="?/stripeDashboard" class="flex justify-center">
				<button class="my-2 btn h-10 preset-filled-primary-500"> Stripe Dashboard </button>
			</form>
		{/if}
	{/if}
</main>
