import { unstable_cache } from "next/cache"
import PocketBase from "pocketbase"
import { cache } from "react"
import type { ExternalIcon, ExternalIconRecord, IconRecord, NativeIconRecord } from "@/types/icons"
import { getIconsArray } from "./api"

const EXTERNAL_REVALIDATE_SECONDS = 21600

type ListExternalIconsOptions = {
	q?: string
	category?: string
	page?: number
	perPage?: number
}

function getPocketBaseUrl() {
	return process.env.PB_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090"
}

function createServerPB(pbUrl = getPocketBaseUrl()) {
	return new PocketBase(pbUrl)
}

function toExternalIconRecord(icon: ExternalIcon): ExternalIconRecord {
	const timestamp = icon.updated_at_source || icon.updated || icon.created || new Date(0).toISOString()
	const colors =
		icon.variants?.light || icon.variants?.dark
			? {
					light: icon.variants?.light ? `${icon.slug}-light` : undefined,
					dark: icon.variants?.dark ? `${icon.slug}-dark` : undefined,
				}
			: undefined

	return {
		source: "selfhst",
		slug: icon.slug,
		name: icon.name,
		external: icon,
		data: {
			base: icon.formats.includes("svg") ? "svg" : icon.formats.includes("png") ? "png" : "webp",
			aliases: icon.aliases || [],
			categories: icon.categories || [],
			update: {
				timestamp,
				author: {
					id: "selfhst",
					name: "selfh.st/icons",
					login: "selfhst",
				},
			},
			colors,
		},
	}
}

async function fetchExternalIcons(pbUrl: string): Promise<ExternalIconRecord[]> {
	const pb = createServerPB(pbUrl)
	const records = await pb.collection("external_icons").getFullList<ExternalIcon>({
		filter: pb.filter("source = {:source}", { source: "selfhst" }),
		sort: "name",
		requestKey: null,
	})

	return records.map(toExternalIconRecord)
}

const fetchExternalIconsCached = cache(fetchExternalIcons)

export async function getExternalIcons(): Promise<ExternalIconRecord[]> {
	const pbUrl = getPocketBaseUrl()
	try {
		return await fetchExternalIconsCached(pbUrl)
	} catch (error) {
		console.error("Error fetching external icons:", error)
		return []
	}
}

export async function getExternalIconBySlug(slug: string): Promise<ExternalIconRecord | null> {
	const pbUrl = getPocketBaseUrl()
	try {
		return await unstable_cache(
			async () => {
				const pb = createServerPB(pbUrl)
				const record = await pb
					.collection("external_icons")
					.getFirstListItem<ExternalIcon>(pb.filter("source = {:source} && slug = {:slug}", { source: "selfhst", slug }), {
						requestKey: null,
					})
				return toExternalIconRecord(record)
			},
			[`external-icon-selfhst-${slug}-v2`, pbUrl],
			{
				revalidate: EXTERNAL_REVALIDATE_SECONDS,
				tags: ["external-icons", "selfhst-icons", `external-icon-${slug}`],
			},
		)()
	} catch (error) {
		console.error(`Error fetching external icon ${slug}:`, error)
		return null
	}
}

export const getExternalIcon = getExternalIconBySlug

export async function listExternalIcons({ q = "", category, page = 1, perPage = 60 }: ListExternalIconsOptions = {}) {
	const icons = await getExternalIcons()
	const query = q.trim().toLowerCase()
	const normalizedCategory = category?.trim().toLowerCase()

	const filtered = icons.filter((icon) => {
		const matchesQuery =
			!query ||
			icon.external.name.toLowerCase().includes(query) ||
			icon.slug.toLowerCase().includes(query) ||
			icon.data.aliases.some((alias) => alias.toLowerCase().includes(query)) ||
			icon.data.categories.some((cat) => cat.toLowerCase().includes(query))
		const matchesCategory = !normalizedCategory || icon.data.categories.some((cat) => cat.toLowerCase() === normalizedCategory)
		return matchesQuery && matchesCategory
	})

	const start = Math.max(page - 1, 0) * perPage
	return {
		items: filtered.slice(start, start + perPage),
		page,
		perPage,
		totalItems: filtered.length,
		totalPages: Math.max(Math.ceil(filtered.length / perPage), 1),
	}
}

export async function searchAllSources(q = ""): Promise<IconRecord[]> {
	const [nativeIcons, externalIcons] = await Promise.all([getIconsArray(), getExternalIcons()])
	const merged = new Map<string, IconRecord>()

	for (const icon of nativeIcons) {
		const nativeIcon: NativeIconRecord = {
			...icon,
			source: "native",
			slug: icon.slug || icon.name,
		}
		merged.set(nativeIcon.name.toLowerCase(), nativeIcon)
	}

	for (const icon of externalIcons) {
		const key = icon.external.name.toLowerCase()
		if (!merged.has(key)) {
			merged.set(key, icon)
		}
	}

	const query = q.trim().toLowerCase()
	if (!query) return Array.from(merged.values())

	return Array.from(merged.values()).filter(
		(icon) =>
			icon.name.toLowerCase().includes(query) ||
			icon.slug.toLowerCase().includes(query) ||
			icon.data.aliases.some((alias) => alias.toLowerCase().includes(query)) ||
			icon.data.categories.some((category) => category.toLowerCase().includes(query)),
	)
}
