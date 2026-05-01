export type IconAuthor = {
	id: number | string
	github_id?: string
	name?: string
	login?: string
}

export type IconUpdate = {
	timestamp: string
	author: IconAuthor
}

export type IconColors = {
	dark?: string
	light?: string
}

export type IconWordmarkColors = {
	dark?: string
	light?: string
}

export type Icon = {
	base: string | "svg" | "png" | "webp"
	aliases: string[]
	categories: string[]
	update: IconUpdate
	colors?: IconColors
	wordmark?: IconWordmarkColors
}

export type IconFile = {
	[key: string]: Icon
}

export type IconWithName = {
	name: string
	data: Icon
	source?: "native" | "selfhst"
	slug?: string
	external?: ExternalIcon
}

export type IconSearchProps = {
	icons: IconRecord[]
	initialQuery?: string
}

export type ExternalIconUrlTemplates = {
	svg?: string
	svg_light?: string
	svg_dark?: string
	png?: string
	webp?: string
	avif?: string
	ico?: string
	[key: string]: string | undefined
}

export type ExternalIcon = {
	id: string
	source: "selfhst"
	slug: string
	name: string
	aliases: string[]
	categories: string[]
	formats: string[]
	variants: {
		light?: boolean
		dark?: boolean
	}
	url_templates: ExternalIconUrlTemplates
	license: string
	attribution: string
	source_url: string
	updated_at_source?: string
	created?: string
	updated?: string
}

export type NativeIconRecord = IconWithName & {
	source: "native"
	slug: string
}

export type ExternalIconRecord = IconWithName & {
	source: "selfhst"
	slug: string
	external: ExternalIcon
}

export type IconRecord = NativeIconRecord | ExternalIconRecord

export type AuthorData = {
	id: number | string
	name?: string
	login: string
	avatar_url: string
	html_url: string
}
