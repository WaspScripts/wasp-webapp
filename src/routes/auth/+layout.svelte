<script lang="ts">
	import Head from "$lib/components/Head.svelte"

	const { children } = $props()
</script>

<Head title="Authentication" description="Log in to your WaspScripts account." noindex />

{@render children()}
