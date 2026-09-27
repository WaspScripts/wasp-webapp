<script lang="ts">
	import { enhance } from "$app/forms"
	import { page } from "$app/state"
	import { Popover, Portal } from "@skeletonlabs/skeleton-svelte"
	import ChevronDown from "@lucide/svelte/icons/chevron-down"
	import Palette from "@lucide/svelte/icons/palette"
	import X from "@lucide/svelte/icons/x"

	let theme = $state(page.data.theme)
	const keys: (typeof theme)[] = ["cerberus", "concord", "fennec", "wasp"]
	const values = ["Cerberus", "Concord", "Fennec", "Wasp"]
	let idx = $derived(keys.indexOf(theme))
	let open = $state(false)
</script>

<div class="my-auto input-group flex h-8 hover:preset-tonal">
	<Popover {open} onOpenChange={(e) => (open = e.open)}>
		<Popover.Trigger class="btn h-8 px-2 py-1.5 hover:preset-tonal xl:py-0.5" aria-label="Theme switcher">
			<Palette size="16" />
			<span class="mx-4 hidden lg:block xl:flex">{values[idx]}</span>
			<ChevronDown size="16" />
		</Popover.Trigger>
		<Portal>
			<Popover.Positioner>
				<Popover.Content class="max-w-md space-y-2 card bg-surface-100-900 p-4 shadow-xl">
					<form
						class="w-52 card"
						id="theme-form"
						method="POST"
						action="/?/setTheme"
						use:enhance={({ action }) => {
							const key = action.searchParams.get("theme")
							if (key && keys.includes(key as typeof theme)) {
								theme = key as typeof theme
								document.documentElement.setAttribute("data-theme", theme)
							}
							open = false
							return async () => {}
						}}
					>
						<header class="flex justify-between">
							<p class="text-xl font-bold">Themes</p>
							<button class="btn-icon hover:preset-tonal" onclick={() => (open = false)}>
								<X />
							</button>
						</header>
						<div class="my-4 flex flex-col">
							{#each keys as key, i (key)}
								<button
									type="submit"
									class="my-2 btn preset-outlined-surface-500 hover:border-primary-500"
									formaction="/?/setTheme&theme={key}"
								>
									{values[i]}
								</button>
							{/each}
						</div>
					</form>
				</Popover.Content>
			</Popover.Positioner>
		</Portal>
	</Popover>
</div>
