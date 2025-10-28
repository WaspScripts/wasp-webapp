<script lang="ts">
	import Github from "svelte-lucide/Github.svelte"
	import Globe from "svelte-lucide/Globe.svelte"
	import Logo from "./Logo.svelte"
	import { page } from "$app/state"
	import { WaspScripters } from "$lib/client/supabase"
	import Coolify from "./logos/Coolify.svelte"
	import Sveltekit from "./logos/Sveltekit.svelte"
	import Skeleton from "./logos/Skeleton.svelte"
	import Mdsvex from "./logos/Mdsvex.svelte"
	import Superforms from "./logos/Superforms.svelte"
	import Zod from "./logos/Zod.svelte"
	import Supabase from "./logos/Supabase.svelte"
</script>

<footer class="z-40 my-auto h-fit preset-filled-surface-100-900">
	<div class="mx-8 flex flex-col md:mx-0">
		<div class="mx-auto my-12 flex flex-col justify-center text-center">
			<a href="/" aria-label="Navigate to WaspScripts">
				<Logo selected={true} />
			</a>
			<span class="mx-auto my-8">Open Source Built with Open Source</span>
			<div class="flex flex-col gap-8 fill-black text-black lg:flex-row dark:fill-black dark:text-white">
				<a href="https://coolify.io/" aria-label="Navigate to coolify" class="mx-auto flex">
					<Coolify />
				</a>
				<a href="https://svelte.dev/" aria-label="Navigate to svelte" class="mx-auto flex">
					<Sveltekit />
				</a>
				<a href="https://www.skeleton.dev/" aria-label="Navigate to skeleton" class="mx-auto flex">
					<Skeleton />
				</a>
				<a href="https://mdsvex.pngwn.io/" aria-label="Navigate to mdsvex" class="mx-auto flex">
					<Mdsvex />
				</a>
				<a href="https://superforms.rocks/" aria-label="Navigate to superforms" class="mx-auto flex">
					<Superforms />
				</a>
				<a href="https://zod.dev/" aria-label="Navigate to zod" class="mx-auto flex">
					<Zod />
				</a>
				<a href="https://supabase.com/" aria-label="Navigate to supabase" class="mx-auto flex">
					<Supabase />
				</a>
			</div>
		</div>

		<div class="flex flex-col justify-around gap-8 md:flex-row">
			<nav class="mx-auto">
				<span class="mb-6 text-sm font-semibold uppercase">Resources</span>
				<ul class="*:hover:text-primary-500">
					<li><a href="/setup">Setup</a></li>
					<li><a href="https://github.com/Villavu/Simba" target="_blank">Simba repo</a></li>
					<li>
						<a href="https://github.com/Villavu/SRL-Development" target="_blank">SRL repo</a>
					</li>
					<li>
						<a href="https://github.com/WaspScripts/WaspLib" target="_blank">WaspLib repo</a>
					</li>
					<li>
						<a href="https://waspscripts.github.io/WaspLib" target="_blank">WaspLib Documentation</a>
					</li>
					<li>
						<a href="https://map.waspscripts.com/" target="_blank">Interactive map</a>
					</li>
				</ul>
			</nav>
			<nav class="mx-auto">
				<span class="mb-6 text-sm font-semibold uppercase">Special thanks:</span>
				<ul class="*:hover:text-primary-500">
					{#await WaspScripters.getRandomScripters(page.data.supabaseClient)}
						{#each { length: 5 }}
							<li>Loading...</li>
						{/each}
					{:then scripters}
						{#each scripters as scripter (scripter.url)}
							<li><a href="/scripters/{scripter.url}">{scripter.profiles.username}</a></li>
						{/each}
						<li><a href="/scripters">Many more devs...</a></li>
					{/await}
				</ul>
			</nav>
			<nav class="mx-auto">
				<span class="mb-6 text-sm font-semibold uppercase">Legal</span>
				<ul class="*:hover:text-primary-500">
					<li><a href="/legal/privacy_policy">Privacy Policy</a></li>
					<li><a href="/legal/user_tos">User Terms &amp; Conditions</a></li>
					<li><a href="/legal/scripter_tos">Scripter Terms &amp; Conditions</a></li>
				</ul>
			</nav>
		</div>

		<footer class="my-8 flex flex-col sm:flex-row">
			<span class="mx-auto my-auto text-sm sm:text-center">
				This webapp is open source! Checkout
				<a class="anchor" href="https://github.com/torwent/wasp-webapp" target="_blank">
					WaspScripts source code
				</a>
				!
			</span>
			<div class="mx-auto my-auto flex space-x-6 sm:mt-0 sm:justify-center">
				<a href="https://github.com/torwent" target="_blank" aria-label="Navigate to GitHub" class="anchor">
					<Github />
				</a>
				<a href="https://waspscripts.dev" aria-label="Navigate to main site" class="anchor">
					<Globe />
				</a>
			</div>
		</footer>
	</div>
</footer>
