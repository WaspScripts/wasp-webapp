import type { Session, SupabaseClient, User } from "@supabase/supabase-js"
import type { Database } from "$lib/types/supabase"
import type { ProfileBase, Subscription, FreeAccess } from "$lib/types/collection"

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			mode: "dark" | "light"
			theme: "wasp" | "cerberus" | "concord" | "fennec"
			supabaseServer: SupabaseClient<Database>
			safeGetSession: () => Promise<{ session: Session | null; user: User | null }>
			resetSession: () => void
			session: Session | null
			user: User | null
			getProfile: () => Promise<ProfileBase | null> | null
			getSubscriptions: () => Promise<Subscription[]>
			getFreeAccess: () => Promise<FreeAccess[]>
		}
		interface PageData {
			mode: "dark" | "light"
			theme: "wasp" | "cerberus" | "concord" | "fennec"
			supabaseClient: SupabaseClient<Database>
			user: string | null
			expiresAt: number | null
			profile: ProfileBase | null
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {}
