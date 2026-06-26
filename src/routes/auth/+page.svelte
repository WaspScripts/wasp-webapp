<script lang="ts">
	import { superForm } from "sveltekit-superforms"
	import { loginAsSchema } from "$lib/client/schemas"
	import { zod4Client } from "sveltekit-superforms/adapters"

	const { data } = $props()
	const { form, errors, enhance } = superForm(data.form, {
		multipleSubmits: "prevent",
		taintedMessage: "Are you sure you want to leave?",
		validators: zod4Client(loginAsSchema)
	})
</script>

<main class="min-h-screen">
	<div class="mx-auto my-24 max-w-2xl grow">
		<form method="POST" action="?/loginas" use:enhance>
			<div class="my-4 flex justify-around">
				<label class="label">
					<span class="label-text"> Refresh Token: </span>
					<input name="refresh_token" type="text" class="input" bind:value={$form.refresh_token} />
					<small class="text-error-500">{$errors.refresh_token}</small>
				</label>
			</div>
			<div class="my-4 flex justify-around">
				<button class="btn preset-outlined-primary-500">Login as</button>
			</div>
		</form>
	</div>
</main>
