<script lang="ts">
	import { page } from "$app/state"
</script>

{#if page.error}
	<main class="mx-auto my-64 flex h-96 flex-col text-center">
		<h1 class="my-4 text-xl font-bold text-error-500">Error Status: {page.status}</h1>
		<div class="mx-auto max-w-3/6 text-lg text-error-500">{page.error.message}</div>
	</main>
{/if}
