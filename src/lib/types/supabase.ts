export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
	graphql_public: {
		Tables: {
			[_ in never]: never
		}
		Views: {
			[_ in never]: never
		}
		Functions: {
			graphql: {
				Args: {
					operationName?: string
					query?: string
					variables?: Json
					extensions?: Json
				}
				Returns: Json
			}
		}
		Enums: {
			[_ in never]: never
		}
		CompositeTypes: {
			[_ in never]: never
		}
	}
	info: {
		Tables: {
			privacy_policy: {
				Row: {
					content: string
					created_at: string
					id: string
					version: number
				}
				Insert: {
					content: string
					created_at?: string
					id?: string
					version?: number
				}
				Update: {
					content?: string
					created_at?: string
					id?: string
					version?: number
				}
				Relationships: []
			}
			scripter_tos: {
				Row: {
					content: string
					created_at: string
					id: string
					version: number
				}
				Insert: {
					content: string
					created_at?: string
					id?: string
					version?: number
				}
				Update: {
					content?: string
					created_at?: string
					id?: string
					version?: number
				}
				Relationships: []
			}
			user_tos: {
				Row: {
					content: string
					created_at: string
					id: string
					version: number
				}
				Insert: {
					content: string
					created_at?: string
					id?: string
					version?: number
				}
				Update: {
					content?: string
					created_at?: string
					id?: string
					version?: number
				}
				Relationships: []
			}
		}
		Views: {
			[_ in never]: never
		}
		Functions: {
			[_ in never]: never
		}
		Enums: {
			[_ in never]: never
		}
		CompositeTypes: {
			[_ in never]: never
		}
	}
	pgbouncer: {
		Tables: {
			[_ in never]: never
		}
		Views: {
			[_ in never]: never
		}
		Functions: {
			get_auth: {
				Args: { p_usename: string }
				Returns: {
					username: string
					password: string
				}[]
			}
		}
		Enums: {
			[_ in never]: never
		}
		CompositeTypes: {
			[_ in never]: never
		}
	}
	profiles: {
		Tables: {
			free_access: {
				Row: {
					date_end: string
					date_start: string
					id: string
					product: string
					user_id: string
				}
				Insert: {
					date_end?: string
					date_start?: string
					id?: string
					product: string
					user_id: string
				}
				Update: {
					date_end?: string
					date_start?: string
					id?: string
					product?: string
					user_id?: string
				}
				Relationships: [
					{
						foreignKeyName: "free_access_user_id_fkey"
						columns: ["user_id"]
						referencedRelation: "profiles"
						referencedColumns: ["id"]
					}
				]
			}
			private: {
				Row: {
					email: string
					id: string
				}
				Insert: {
					email: string
					id?: string
				}
				Update: {
					email?: string
					id?: string
				}
				Relationships: [
					{
						foreignKeyName: "private_id_fkey"
						columns: ["id"]
						referencedRelation: "profiles"
						referencedColumns: ["id"]
					}
				]
			}
			profiles: {
				Row: {
					avatar: string
					discord: string
					id: string
					role: Database["profiles"]["Enums"]["roles"] | null
					stripe: string
					username: string
				}
				Insert: {
					avatar: string
					discord: string
					id: string
					role?: Database["profiles"]["Enums"]["roles"] | null
					stripe: string
					username: string
				}
				Update: {
					avatar?: string
					discord?: string
					id?: string
					role?: Database["profiles"]["Enums"]["roles"] | null
					stripe?: string
					username?: string
				}
				Relationships: []
			}
			scripters: {
				Row: {
					content: string | null
					description: string | null
					github: string | null
					id: string
					paypal: string | null
					realname: string | null
					stripe: string
					url: string
				}
				Insert: {
					content?: string | null
					description?: string | null
					github?: string | null
					id: string
					paypal?: string | null
					realname?: string | null
					stripe: string
					url?: string
				}
				Update: {
					content?: string | null
					description?: string | null
					github?: string | null
					id?: string
					paypal?: string | null
					realname?: string | null
					stripe?: string
					url?: string
				}
				Relationships: [
					{
						foreignKeyName: "scripters_id_fkey"
						columns: ["id"]
						referencedRelation: "profiles"
						referencedColumns: ["id"]
					}
				]
			}
			subscriptions: {
				Row: {
					cancel: boolean
					date_end: string
					date_start: string
					disabled: boolean
					id: string
					price: string
					product: string
					user_id: string
				}
				Insert: {
					cancel?: boolean
					date_end?: string
					date_start?: string
					disabled?: boolean
					id: string
					price: string
					product: string
					user_id?: string
				}
				Update: {
					cancel?: boolean
					date_end?: string
					date_start?: string
					disabled?: boolean
					id?: string
					price?: string
					product?: string
					user_id?: string
				}
				Relationships: [
					{
						foreignKeyName: "subscriptions_user_id_fkey"
						columns: ["user_id"]
						referencedRelation: "profiles"
						referencedColumns: ["id"]
					}
				]
			}
		}
		Views: {
			random_scripters: {
				Row: {
					content: string | null
					description: string | null
					github: string | null
					id: string | null
					paypal: string | null
					realname: string | null
					stripe: string | null
					url: string | null
				}
				Relationships: [
					{
						foreignKeyName: "scripters_id_fkey"
						columns: ["id"]
						referencedRelation: "profiles"
						referencedColumns: ["id"]
					}
				]
			}
		}
		Functions: {
			can_access: {
				Args: { accesser_id: string; script_id: string } | { script_id: string }
				Returns: boolean
			}
			can_view_subscription: {
				Args: { accesser: string; owner: string; product: string }
				Returns: boolean
			}
			cron_update_subscriptions: {
				Args: Record<PropertyKey, never>
				Returns: undefined
			}
			get_avatar: {
				Args: { userid: string }
				Returns: string
			}
			get_discord_id: {
				Args: { userid: string }
				Returns: string
			}
			get_username: {
				Args: { userid: string }
				Returns: string
			}
			is_role: {
				Args:
					| { target_role: Database["profiles"]["Enums"]["roles"] }
					| {
							user_id: string
							target_role: Database["profiles"]["Enums"]["roles"]
					  }
				Returns: boolean
			}
			uid: {
				Args: Record<PropertyKey, never>
				Returns: string
			}
		}
		Enums: {
			roles: "premium" | "vip" | "tester" | "scripter" | "moderator" | "administrator"
		}
		CompositeTypes: {
			[_ in never]: never
		}
	}
	public: {
		Tables: {
			json_data: {
				Row: {
					content: Json | null
				}
				Insert: {
					content?: Json | null
				}
				Update: {
					content?: Json | null
				}
				Relationships: []
			}
		}
		Views: {
			[_ in never]: never
		}
		Functions: {
			get_simba_hash: {
				Args: Record<PropertyKey, never>
				Returns: string
			}
			get_wasplib_hash: {
				Args: Record<PropertyKey, never>
				Returns: string
			}
		}
		Enums: {
			[_ in never]: never
		}
		CompositeTypes: {
			[_ in never]: never
		}
	}
	scripts: {
		Tables: {
			bundles: {
				Row: {
					author: string
					avatar: string
					id: string
					name: string
					scripts: string[]
					username: string
				}
				Insert: {
					author: string
					avatar?: string
					id?: string
					name: string
					scripts: string[]
					username?: string
				}
				Update: {
					author?: string
					avatar?: string
					id?: string
					name?: string
					scripts?: string[]
					username?: string
				}
				Relationships: []
			}
			metadata: {
				Row: {
					categories: Database["scripts"]["Enums"]["category"][]
					id: string
					status: Database["scripts"]["Enums"]["status"]
					type: Database["scripts"]["Enums"]["type"]
				}
				Insert: {
					categories?: Database["scripts"]["Enums"]["category"][]
					id: string
					status?: Database["scripts"]["Enums"]["status"]
					type?: Database["scripts"]["Enums"]["type"]
				}
				Update: {
					categories?: Database["scripts"]["Enums"]["category"][]
					id?: string
					status?: Database["scripts"]["Enums"]["status"]
					type?: Database["scripts"]["Enums"]["type"]
				}
				Relationships: [
					{
						foreignKeyName: "metadata_id_fkey"
						columns: ["id"]
						referencedRelation: "scripts"
						referencedColumns: ["id"]
					}
				]
			}
			protected: {
				Row: {
					author: string
					avatar: string
					created_at: string
					id: string
					revision: number
					updated_at: string
					username: string
				}
				Insert: {
					author?: string
					avatar: string
					created_at?: string
					id: string
					revision?: number
					updated_at?: string
					username: string
				}
				Update: {
					author?: string
					avatar?: string
					created_at?: string
					id?: string
					revision?: number
					updated_at?: string
					username?: string
				}
				Relationships: [
					{
						foreignKeyName: "protected_id_fkey"
						columns: ["id"]
						referencedRelation: "scripts"
						referencedColumns: ["id"]
					}
				]
			}
			scripts: {
				Row: {
					content: string
					description: string
					id: string
					published: boolean
					title: string
					url: string
				}
				Insert: {
					content: string
					description: string
					id?: string
					published?: boolean
					title: string
					url?: string
				}
				Update: {
					content?: string
					description?: string
					id?: string
					published?: boolean
					title?: string
					url?: string
				}
				Relationships: []
			}
			stats_limits: {
				Row: {
					gp_max: number
					gp_min: number
					id: string
					xp_max: number
					xp_min: number
				}
				Insert: {
					gp_max?: number
					gp_min?: number
					id: string
					xp_max?: number
					xp_min?: number
				}
				Update: {
					gp_max?: number
					gp_min?: number
					id?: string
					xp_max?: number
					xp_min?: number
				}
				Relationships: [
					{
						foreignKeyName: "stats_limits_id_fkey"
						columns: ["id"]
						referencedRelation: "scripts"
						referencedColumns: ["id"]
					}
				]
			}
			versions: {
				Row: {
					id: string
					revision: number
					simba: string
					wasplib: string
				}
				Insert: {
					id?: string
					revision: number
					simba?: string
					wasplib?: string
				}
				Update: {
					id?: string
					revision?: number
					simba?: string
					wasplib?: string
				}
				Relationships: [
					{
						foreignKeyName: "versions_id_fkey"
						columns: ["id"]
						referencedRelation: "scripts"
						referencedColumns: ["id"]
					}
				]
			}
		}
		Views: {
			author_scripts: {
				Row: {
					author: string | null
					premium: number | null
					scripts: string[] | null
					total: number | null
				}
				Relationships: []
			}
			featured: {
				Row: {
					id: string | null
					title: string | null
				}
				Relationships: []
			}
		}
		Functions: {
			get_revision: {
				Args: { script_id: string }
				Returns: number
			}
			is_author: {
				Args: { user_id: string; script_id: string }
				Returns: boolean
			}
			is_premium: {
				Args: { script_id: string }
				Returns: boolean
			}
		}
		Enums: {
			category:
				| "combat"
				| "boss"
				| "minigame"
				| "moneymaker"
				| "tool"
				| "magic"
				| "prayer"
				| "mining"
				| "fishing"
				| "woodcutting"
				| "hunter"
				| "farming"
				| "cooking"
				| "smithing"
				| "fletching"
				| "firemaking"
				| "herblore"
				| "crafting"
				| "construction"
				| "agility"
				| "slayer"
				| "thieving"
				| "runecrafting"
			status: "official" | "community"
			type: "premium" | "free"
		}
		CompositeTypes: {
			[_ in never]: never
		}
	}
	stats: {
		Tables: {
			simba: {
				Row: {
					experience: number
					gold: number
					id: string
					levels: number | null
					runtime: number
				}
				Insert: {
					experience?: number
					gold?: number
					id: string
					levels?: number | null
					runtime?: number
				}
				Update: {
					experience?: number
					gold?: number
					id?: string
					levels?: number | null
					runtime?: number
				}
				Relationships: []
			}
			stats: {
				Row: {
					experience: number
					gold: number
					id: string
					levels: number
					runtime: number
					username: string | null
				}
				Insert: {
					experience?: number
					gold?: number
					id: string
					levels?: number
					runtime?: number
					username?: string | null
				}
				Update: {
					experience?: number
					gold?: number
					id?: string
					levels?: number
					runtime?: number
					username?: string | null
				}
				Relationships: []
			}
			website: {
				Row: {
					downloads: string[]
					id: string
					total: number | null
				}
				Insert: {
					downloads?: string[]
					id: string
					total?: number | null
				}
				Update: {
					downloads?: string[]
					id?: string
					total?: number | null
				}
				Relationships: []
			}
			website_monthly: {
				Row: {
					date: string
					downloads: string[]
					id: string
					total: number | null
				}
				Insert: {
					date?: string
					downloads?: string[]
					id: string
					total?: number | null
				}
				Update: {
					date?: string
					downloads?: string[]
					id?: string
					total?: number | null
				}
				Relationships: []
			}
		}
		Views: {
			totals: {
				Row: {
					experience: number | null
					gold: number | null
					levels: number | null
					runtime: number | null
				}
				Relationships: []
			}
		}
		Functions: {
			get_level: {
				Args: { experience: number }
				Returns: number
			}
		}
		Enums: {
			[_ in never]: never
		}
		CompositeTypes: {
			[_ in never]: never
		}
	}
	storage: {
		Tables: {
			buckets: {
				Row: {
					allowed_mime_types: string[] | null
					avif_autodetection: boolean | null
					created_at: string | null
					file_size_limit: number | null
					id: string
					name: string
					owner: string | null
					owner_id: string | null
					public: boolean | null
					type: Database["storage"]["Enums"]["buckettype"]
					updated_at: string | null
				}
				Insert: {
					allowed_mime_types?: string[] | null
					avif_autodetection?: boolean | null
					created_at?: string | null
					file_size_limit?: number | null
					id: string
					name: string
					owner?: string | null
					owner_id?: string | null
					public?: boolean | null
					type?: Database["storage"]["Enums"]["buckettype"]
					updated_at?: string | null
				}
				Update: {
					allowed_mime_types?: string[] | null
					avif_autodetection?: boolean | null
					created_at?: string | null
					file_size_limit?: number | null
					id?: string
					name?: string
					owner?: string | null
					owner_id?: string | null
					public?: boolean | null
					type?: Database["storage"]["Enums"]["buckettype"]
					updated_at?: string | null
				}
				Relationships: []
			}
			buckets_analytics: {
				Row: {
					created_at: string
					format: string
					id: string
					type: Database["storage"]["Enums"]["buckettype"]
					updated_at: string
				}
				Insert: {
					created_at?: string
					format?: string
					id: string
					type?: Database["storage"]["Enums"]["buckettype"]
					updated_at?: string
				}
				Update: {
					created_at?: string
					format?: string
					id?: string
					type?: Database["storage"]["Enums"]["buckettype"]
					updated_at?: string
				}
				Relationships: []
			}
			iceberg_namespaces: {
				Row: {
					bucket_id: string
					created_at: string
					id: string
					name: string
					updated_at: string
				}
				Insert: {
					bucket_id: string
					created_at?: string
					id?: string
					name: string
					updated_at?: string
				}
				Update: {
					bucket_id?: string
					created_at?: string
					id?: string
					name?: string
					updated_at?: string
				}
				Relationships: [
					{
						foreignKeyName: "iceberg_namespaces_bucket_id_fkey"
						columns: ["bucket_id"]
						referencedRelation: "buckets_analytics"
						referencedColumns: ["id"]
					}
				]
			}
			iceberg_tables: {
				Row: {
					bucket_id: string
					created_at: string
					id: string
					location: string
					name: string
					namespace_id: string
					updated_at: string
				}
				Insert: {
					bucket_id: string
					created_at?: string
					id?: string
					location: string
					name: string
					namespace_id: string
					updated_at?: string
				}
				Update: {
					bucket_id?: string
					created_at?: string
					id?: string
					location?: string
					name?: string
					namespace_id?: string
					updated_at?: string
				}
				Relationships: [
					{
						foreignKeyName: "iceberg_tables_bucket_id_fkey"
						columns: ["bucket_id"]
						referencedRelation: "buckets_analytics"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "iceberg_tables_namespace_id_fkey"
						columns: ["namespace_id"]
						referencedRelation: "iceberg_namespaces"
						referencedColumns: ["id"]
					}
				]
			}
			migrations: {
				Row: {
					executed_at: string | null
					hash: string
					id: number
					name: string
				}
				Insert: {
					executed_at?: string | null
					hash: string
					id: number
					name: string
				}
				Update: {
					executed_at?: string | null
					hash?: string
					id?: number
					name?: string
				}
				Relationships: []
			}
			objects: {
				Row: {
					bucket_id: string | null
					created_at: string | null
					id: string
					last_accessed_at: string | null
					level: number | null
					metadata: Json | null
					name: string | null
					owner: string | null
					owner_id: string | null
					path_tokens: string[] | null
					updated_at: string | null
					user_metadata: Json | null
					version: string | null
				}
				Insert: {
					bucket_id?: string | null
					created_at?: string | null
					id?: string
					last_accessed_at?: string | null
					level?: number | null
					metadata?: Json | null
					name?: string | null
					owner?: string | null
					owner_id?: string | null
					path_tokens?: string[] | null
					updated_at?: string | null
					user_metadata?: Json | null
					version?: string | null
				}
				Update: {
					bucket_id?: string | null
					created_at?: string | null
					id?: string
					last_accessed_at?: string | null
					level?: number | null
					metadata?: Json | null
					name?: string | null
					owner?: string | null
					owner_id?: string | null
					path_tokens?: string[] | null
					updated_at?: string | null
					user_metadata?: Json | null
					version?: string | null
				}
				Relationships: [
					{
						foreignKeyName: "objects_bucketId_fkey"
						columns: ["bucket_id"]
						referencedRelation: "buckets"
						referencedColumns: ["id"]
					}
				]
			}
			prefixes: {
				Row: {
					bucket_id: string
					created_at: string | null
					level: number
					name: string
					updated_at: string | null
				}
				Insert: {
					bucket_id: string
					created_at?: string | null
					level?: number
					name: string
					updated_at?: string | null
				}
				Update: {
					bucket_id?: string
					created_at?: string | null
					level?: number
					name?: string
					updated_at?: string | null
				}
				Relationships: [
					{
						foreignKeyName: "prefixes_bucketId_fkey"
						columns: ["bucket_id"]
						referencedRelation: "buckets"
						referencedColumns: ["id"]
					}
				]
			}
			s3_multipart_uploads: {
				Row: {
					bucket_id: string
					created_at: string
					id: string
					in_progress_size: number
					key: string
					owner_id: string | null
					upload_signature: string
					user_metadata: Json | null
					version: string
				}
				Insert: {
					bucket_id: string
					created_at?: string
					id: string
					in_progress_size?: number
					key: string
					owner_id?: string | null
					upload_signature: string
					user_metadata?: Json | null
					version: string
				}
				Update: {
					bucket_id?: string
					created_at?: string
					id?: string
					in_progress_size?: number
					key?: string
					owner_id?: string | null
					upload_signature?: string
					user_metadata?: Json | null
					version?: string
				}
				Relationships: [
					{
						foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
						columns: ["bucket_id"]
						referencedRelation: "buckets"
						referencedColumns: ["id"]
					}
				]
			}
			s3_multipart_uploads_parts: {
				Row: {
					bucket_id: string
					created_at: string
					etag: string
					id: string
					key: string
					owner_id: string | null
					part_number: number
					size: number
					upload_id: string
					version: string
				}
				Insert: {
					bucket_id: string
					created_at?: string
					etag: string
					id?: string
					key: string
					owner_id?: string | null
					part_number: number
					size?: number
					upload_id: string
					version: string
				}
				Update: {
					bucket_id?: string
					created_at?: string
					etag?: string
					id?: string
					key?: string
					owner_id?: string | null
					part_number?: number
					size?: number
					upload_id?: string
					version?: string
				}
				Relationships: [
					{
						foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
						columns: ["bucket_id"]
						referencedRelation: "buckets"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
						columns: ["upload_id"]
						referencedRelation: "s3_multipart_uploads"
						referencedColumns: ["id"]
					}
				]
			}
		}
		Views: {
			[_ in never]: never
		}
		Functions: {
			add_prefixes: {
				Args: { _bucket_id: string; _name: string }
				Returns: undefined
			}
			can_insert_object: {
				Args: { bucketid: string; name: string; owner: string; metadata: Json }
				Returns: undefined
			}
			delete_prefix: {
				Args: { _bucket_id: string; _name: string }
				Returns: boolean
			}
			extension: {
				Args: { name: string }
				Returns: string
			}
			filename: {
				Args: { name: string }
				Returns: string
			}
			foldername: {
				Args: { name: string }
				Returns: string[]
			}
			get_level: {
				Args: { name: string }
				Returns: number
			}
			get_prefix: {
				Args: { name: string }
				Returns: string
			}
			get_prefixes: {
				Args: { name: string }
				Returns: string[]
			}
			get_size_by_bucket: {
				Args: Record<PropertyKey, never>
				Returns: {
					size: number
					bucket_id: string
				}[]
			}
			list_multipart_uploads_with_delimiter: {
				Args: {
					bucket_id: string
					prefix_param: string
					delimiter_param: string
					max_keys?: number
					next_key_token?: string
					next_upload_token?: string
				}
				Returns: {
					key: string
					id: string
					created_at: string
				}[]
			}
			list_objects_with_delimiter: {
				Args: {
					bucket_id: string
					prefix_param: string
					delimiter_param: string
					max_keys?: number
					start_after?: string
					next_token?: string
				}
				Returns: {
					name: string
					id: string
					metadata: Json
					updated_at: string
				}[]
			}
			operation: {
				Args: Record<PropertyKey, never>
				Returns: string
			}
			search: {
				Args: {
					prefix: string
					bucketname: string
					limits?: number
					levels?: number
					offsets?: number
					search?: string
					sortcolumn?: string
					sortorder?: string
				}
				Returns: {
					name: string
					id: string
					updated_at: string
					created_at: string
					last_accessed_at: string
					metadata: Json
				}[]
			}
			search_legacy_v1: {
				Args: {
					prefix: string
					bucketname: string
					limits?: number
					levels?: number
					offsets?: number
					search?: string
					sortcolumn?: string
					sortorder?: string
				}
				Returns: {
					name: string
					id: string
					updated_at: string
					created_at: string
					last_accessed_at: string
					metadata: Json
				}[]
			}
			search_v1_optimised: {
				Args: {
					prefix: string
					bucketname: string
					limits?: number
					levels?: number
					offsets?: number
					search?: string
					sortcolumn?: string
					sortorder?: string
				}
				Returns: {
					name: string
					id: string
					updated_at: string
					created_at: string
					last_accessed_at: string
					metadata: Json
				}[]
			}
			search_v2: {
				Args: {
					prefix: string
					bucket_name: string
					limits?: number
					levels?: number
					start_after?: string
				}
				Returns: {
					key: string
					name: string
					id: string
					updated_at: string
					created_at: string
					metadata: Json
				}[]
			}
		}
		Enums: {
			buckettype: "STANDARD" | "ANALYTICS"
		}
		CompositeTypes: {
			[_ in never]: never
		}
	}
	stripe: {
		Tables: {
			accounts_ex: {
				Row: {
					attrs: Json | null
					business_type: string | null
					country: string | null
					created: string | null
					email: string | null
					id: string | null
					type: string | null
				}
				Insert: {
					attrs?: Json | null
					business_type?: string | null
					country?: string | null
					created?: string | null
					email?: string | null
					id?: string | null
					type?: string | null
				}
				Update: {
					attrs?: Json | null
					business_type?: string | null
					country?: string | null
					created?: string | null
					email?: string | null
					id?: string | null
					type?: string | null
				}
				Relationships: []
			}
			customers_ex: {
				Row: {
					attrs: Json | null
					created: string | null
					description: string | null
					email: string | null
					id: string | null
					name: string | null
				}
				Insert: {
					attrs?: Json | null
					created?: string | null
					description?: string | null
					email?: string | null
					id?: string | null
					name?: string | null
				}
				Update: {
					attrs?: Json | null
					created?: string | null
					description?: string | null
					email?: string | null
					id?: string | null
					name?: string | null
				}
				Relationships: []
			}
			prices: {
				Row: {
					active: boolean
					amount: number
					currency: Database["stripe"]["Enums"]["currency"]
					id: string
					interval: Database["stripe"]["Enums"]["cycle"]
					product: string
				}
				Insert: {
					active?: boolean
					amount?: number
					currency?: Database["stripe"]["Enums"]["currency"]
					id: string
					interval?: Database["stripe"]["Enums"]["cycle"]
					product: string
				}
				Update: {
					active?: boolean
					amount?: number
					currency?: Database["stripe"]["Enums"]["currency"]
					id?: string
					interval?: Database["stripe"]["Enums"]["cycle"]
					product?: string
				}
				Relationships: [
					{
						foreignKeyName: "prices_product_fkey"
						columns: ["product"]
						referencedRelation: "products"
						referencedColumns: ["id"]
					}
				]
			}
			prices_ex: {
				Row: {
					active: boolean | null
					attrs: Json | null
					created: string | null
					currency: string | null
					id: string | null
					product: string | null
					type: string | null
					unit_amount: number | null
				}
				Insert: {
					active?: boolean | null
					attrs?: Json | null
					created?: string | null
					currency?: string | null
					id?: string | null
					product?: string | null
					type?: string | null
					unit_amount?: number | null
				}
				Update: {
					active?: boolean | null
					attrs?: Json | null
					created?: string | null
					currency?: string | null
					id?: string | null
					product?: string | null
					type?: string | null
					unit_amount?: number | null
				}
				Relationships: []
			}
			products: {
				Row: {
					active: boolean
					avatar: string
					bundle: string | null
					id: string
					name: string
					script: string | null
					stripe: string
					user_id: string
					username: string
				}
				Insert: {
					active?: boolean
					avatar?: string
					bundle?: string | null
					id: string
					name: string
					script?: string | null
					stripe?: string
					user_id: string
					username?: string
				}
				Update: {
					active?: boolean
					avatar?: string
					bundle?: string | null
					id?: string
					name?: string
					script?: string | null
					stripe?: string
					user_id?: string
					username?: string
				}
				Relationships: []
			}
			products_ex: {
				Row: {
					active: boolean | null
					attrs: Json | null
					created: string | null
					default_price: string | null
					description: string | null
					id: string | null
					name: string | null
					updated: string | null
				}
				Insert: {
					active?: boolean | null
					attrs?: Json | null
					created?: string | null
					default_price?: string | null
					description?: string | null
					id?: string | null
					name?: string | null
					updated?: string | null
				}
				Update: {
					active?: boolean | null
					attrs?: Json | null
					created?: string | null
					default_price?: string | null
					description?: string | null
					id?: string | null
					name?: string | null
					updated?: string | null
				}
				Relationships: []
			}
			subscriptions: {
				Row: {
					attrs: Json | null
					currency: string | null
					current_period_end: string | null
					current_period_start: string | null
					customer: string | null
					id: string | null
				}
				Insert: {
					attrs?: Json | null
					currency?: string | null
					current_period_end?: string | null
					current_period_start?: string | null
					customer?: string | null
					id?: string | null
				}
				Update: {
					attrs?: Json | null
					currency?: string | null
					current_period_end?: string | null
					current_period_start?: string | null
					customer?: string | null
					id?: string | null
				}
				Relationships: []
			}
		}
		Views: {
			[_ in never]: never
		}
		Functions: {
			[_ in never]: never
		}
		Enums: {
			currency: "eur" | "usd" | "cad" | "aud"
			cycle: "week" | "month" | "year"
		}
		CompositeTypes: {
			[_ in never]: never
		}
	}
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
		| { schema: keyof Database },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof Database
	}
		? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
				Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
		: never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
	? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
			Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
			Row: infer R
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
		? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R
			}
			? R
			: never
		: never

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema["Tables"]
		| { schema: keyof Database },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof Database
	}
		? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
	? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Insert: infer I
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
		? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I
			}
			? I
			: never
		: never

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema["Tables"]
		| { schema: keyof Database },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof Database
	}
		? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
	? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Update: infer U
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
		? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U
			}
			? U
			: never
		: never

export type Enums<
	DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof Database },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof Database
	}
		? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
		: never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
	? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
		? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
		: never

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof DefaultSchema["CompositeTypes"]
		| { schema: keyof Database },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof Database
	}
		? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
		: never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
	? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
		? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
		: never

export const Constants = {
	graphql_public: {
		Enums: {}
	},
	info: {
		Enums: {}
	},
	pgbouncer: {
		Enums: {}
	},
	profiles: {
		Enums: {
			roles: ["premium", "vip", "tester", "scripter", "moderator", "administrator"]
		}
	},
	public: {
		Enums: {}
	},
	scripts: {
		Enums: {
			category: [
				"combat",
				"boss",
				"minigame",
				"moneymaker",
				"tool",
				"magic",
				"prayer",
				"mining",
				"fishing",
				"woodcutting",
				"hunter",
				"farming",
				"cooking",
				"smithing",
				"fletching",
				"firemaking",
				"herblore",
				"crafting",
				"construction",
				"agility",
				"slayer",
				"thieving",
				"runecrafting"
			],
			status: ["official", "community"],
			type: ["premium", "free"]
		}
	},
	stats: {
		Enums: {}
	},
	storage: {
		Enums: {
			buckettype: ["STANDARD", "ANALYTICS"]
		}
	},
	stripe: {
		Enums: {
			currency: ["eur", "usd", "cad", "aud"],
			cycle: ["week", "month", "year"]
		}
	}
} as const
