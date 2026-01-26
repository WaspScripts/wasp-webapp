import type { Database } from "./supabase"

//profile

export type ProfileBase = Database["profiles"]["Tables"]["profiles"]["Row"]
export type ProfileRole = ProfileBase["role"] | undefined

export interface Profile extends ProfileBase {
	subscriptions: Database["profiles"]["Tables"]["subscriptions"]["Row"][]
	free_access: Database["profiles"]["Tables"]["free_access"]["Row"][]
}

export type ProfileSubscriptions = Database["profiles"]["Tables"]["subscriptions"]["Row"]

export interface ScripterBase {
	realname: string | undefined
	description: string | undefined
	url: string
	profiles: {
		username: string
		discord: string
		avatar: string
	}
}

export interface SimpleScripter {
	url: string
	profiles: { username: string }
}

export interface Scripter extends ScripterBase {
	id: Database["profiles"]["Tables"]["scripters"]["Row"]["id"]
	stripe: Database["profiles"]["Tables"]["scripters"]["Row"]["stripe"]
	github: Database["profiles"]["Tables"]["scripters"]["Row"]["github"]
	paypal: Database["profiles"]["Tables"]["scripters"]["Row"]["paypal"]
	content: Database["profiles"]["Tables"]["scripters"]["Row"]["content"]
}

export interface ScripterProfile {
	profiles: { username: string }
}

//stats
export type StatsTotal = Database["stats"]["Views"]["totals"]["Row"]

export type Stats = {
	username: string
	experience: number
	gold: number
	levels: number
	runtime: number
}

//info
export type FAQEntry = {
	order: number
	url: string
	title: string
	content: string
	created_at: string
	updated_at: string
	author: string
	username: string
	coauthors: string[] | null
	published: boolean
}

export interface Tutorial {
	order: number
	title: string
	description: string
	content: string
	created_at: string
	updated_at: string
	level: number
	author: string
	username: string
	coauthors: string[] | null
	published: boolean
	url: string
}

//scripts
export interface ScriptBase {
	title: string
	description: string
	published: boolean
	url: string
	protected: {
		username: string
		avatar: string
	}
}

export type ScriptPublic = Database["scripts"]["Tables"]["scripts"]["Row"]

export interface ScriptProtected {
	author: Database["scripts"]["Tables"]["protected"]["Row"]["author"]
	username: Database["scripts"]["Tables"]["protected"]["Row"]["username"]
	avatar: Database["scripts"]["Tables"]["protected"]["Row"]["username"]
	revision: Database["scripts"]["Tables"]["protected"]["Row"]["revision"]
	updated_at: Database["scripts"]["Tables"]["protected"]["Row"]["updated_at"]
}

export type TScriptStatus = Database["scripts"]["Enums"]["status"]
export type TScriptTypes = Database["scripts"]["Enums"]["type"]
export type TScriptCategories = Database["scripts"]["Enums"]["category"][]
export type TScriptStages = Database["scripts"]["Enums"]["stage"]

export interface ScriptMetaData {
	status: TScriptStatus
	type: TScriptTypes
	categories: TScriptCategories
	stage: TScriptStages
}

export interface ScriptLimits {
	xp_min: Database["stats"]["Tables"]["limits"]["Row"]["xp_min"]
	xp_max: Database["stats"]["Tables"]["limits"]["Row"]["xp_max"]
	gp_min: Database["stats"]["Tables"]["limits"]["Row"]["gp_min"]
	gp_max: Database["stats"]["Tables"]["limits"]["Row"]["gp_max"]
}

export type Script = ScriptPublic & {
	protected: ScriptProtected
	metadata: ScriptMetaData
}

export interface ScriptSimple {
	id: string
	title: string
	url: string
	product: string
	protected: { username: string }
	metadata: { type: TScriptTypes }
}

export interface ProductData {
	id: string
	user_id: string
	name: string
	bundle: string | null
	script: string | null
	active: boolean
	profiles: { username: string }
}

export type Product = Database["stripe"]["Tables"]["products"]["Row"]
export type Price = Database["stripe"]["Tables"]["prices"]["Row"]

export interface ProductEx {
	id: string
	user_id: string
	name: string
	bundle: string | null
	script: string | null
	bundles: { username: string } | null
	scripts: {
		url: string
		protected: { username: string }
	} | null
	active: boolean
}

export interface Subscription {
	id: string
	product: string
	price: string
	date_start: string
	date_end: string
	cancel: boolean
	disabled: boolean
}

export interface FreeAccess {
	id: string
	product: string
	date_start: string
	date_end: string
}

export type Bundle = Database["scripts"]["Tables"]["bundles"]["Row"]

export interface BundleProduct {
	index: number
	id: string
	user_id: string
	name: string
	username: Promise<string | null>
	bundle: string
	prices: Price[]
	scripts: ScriptSimple[]
	active: boolean
}

export interface ScriptProduct {
	index: number
	id: string
	user_id: string
	name: string
	username: Promise<string | null>
	url: string
	prices: Price[]
	active: boolean
}

export type Interval = Database["stripe"]["Enums"]["cycle"]
