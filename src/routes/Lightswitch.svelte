<script lang="ts">
	import { enhance } from "$app/forms"
	import { page } from "$app/state"
	import SunMoon from "@lucide/svelte/icons/sun-moon"

	let dark = $state(page.data.darkMode)
</script>

<form
	id="dark-form"
	method="POST"
	action="/?/toggleDark"
	class="my-auto flex"
	use:enhance={() => {
		dark = !dark
		document.documentElement.classList.toggle("dark", dark)
	}}
>
	<button
		id="lightswitch"
		class="my-auto btn px-2 py-0.5 hover:preset-tonal xl:px-4"
		title="Toggle dark mode."
		type="submit"
	>
		<SunMoon />
	</button>
</form>
