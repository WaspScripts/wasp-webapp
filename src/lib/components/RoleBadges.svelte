<script lang="ts">
	import { page } from "$app/state"

	const role = $derived(page.data.profile?.role)

	const roles: Record<string, { label: string; class: string }> = {
		premium: { label: "Premium", class: "bg-yellow-500" },
		contributor: { label: "Contributor", class: "bg-blue-500" },
		tester: { label: "Tester", class: "bg-green-500" },
		scripter: { label: "Scripter", class: "bg-teal-500" },
		moderator: { label: "Moderator", class: "bg-purple-500" },
		administrator: { label: "Administrator", class: "bg-orange-500" }
	}

	const roleInfo = $derived(roles[role ?? ""] ?? { label: "OSRS Botter", class: "bg-stone-500" })
</script>

<span class={`mx-auto rounded-lg px-4 py-2 ${roleInfo.class}`}>
	{roleInfo.label}
</span>
