import fs from "node:fs"
import path from "node:path"
import PocketBase from "pocketbase"

type GitHubTreeEntry = {
	path: string
	mode: string
	type: string
	sha: string
	size?: number
	url: string
}

type GitHubTreeResponse = {
	sha: string
	url: string
	tree: GitHubTreeEntry[]
	truncated: boolean
}

type GitHubContentsEntry = {
	name: string
	path: string
	sha: string
	size: number
	type: string
}

const SOURCE = "lobehub"
const ATTRIBUTION = "Icons by LobeHub (MIT)"
const LICENSE = "MIT"
const SOURCE_URL = "https://lobehub.com/icons"
const CDN_BASE = "https://cdn.jsdelivr.net/npm/@lobehub/icons-static-svg@latest"
const ICONS_PREFIX = "packages/static-svg/icons/"
const LOCAL_MANIFEST = "data/sources/lobehub/icons.json"

function slugToName(slug: string): string {
	return slug
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ")
}

function getBaseSlug(slug: string): string {
	return slug.replace(/-(color|text|avatar|combine)$/, "")
}

function buildUrlTemplates(slug: string) {
	return {
		svg: `${CDN_BASE}/icons/{slug}.svg`.replace("{slug}", slug),
	}
}

function extractSlugsFromTree(tree: GitHubTreeEntry[]): string[] {
	return tree
		.filter((entry) => entry.type === "blob" && entry.path.startsWith(ICONS_PREFIX) && entry.path.endsWith(".svg"))
		.map((entry) => path.basename(entry.path, ".svg"))
}

function extractSlugsFromContents(entries: GitHubContentsEntry[]): string[] {
	return entries.filter((entry) => entry.type === "file" && entry.name.endsWith(".svg")).map((entry) => path.basename(entry.name, ".svg"))
}

async function fetchSlugsFromGitHub(): Promise<string[]> {
	const treeUrl = "https://api.github.com/repos/lobehub/lobe-icons/git/trees/master?recursive=1"
	const headers: Record<string, string> = {
		Accept: "application/vnd.github.v3+json",
	}
	if (process.env.GH_TOKEN || process.env.GITHUB_TOKEN) {
		headers.Authorization = `Bearer ${process.env.GH_TOKEN || process.env.GITHUB_TOKEN}`
	}

	const res = await fetch(treeUrl, { headers })
	if (!res.ok) {
		throw new Error(`GitHub API returned ${res.status}: ${await res.text()}`)
	}

	const data = (await res.json()) as GitHubTreeResponse
	if (data.truncated) {
		console.warn("Warning: GitHub tree response was truncated, some icons may be missing")
	}

	return extractSlugsFromTree(data.tree)
}

function readLocalManifest(): string[] | null {
	const filePath = path.join(process.cwd(), LOCAL_MANIFEST)
	if (!fs.existsSync(filePath)) return null

	const raw = fs.readFileSync(filePath, "utf8")
	const data = JSON.parse(raw)

	if (Array.isArray(data) && data.length > 0 && typeof data[0] === "object" && "name" in data[0]) {
		return extractSlugsFromContents(data as GitHubContentsEntry[])
	}

	if (Array.isArray(data) && data.length > 0 && typeof data[0] === "object" && "tree" in data[0]) {
		return extractSlugsFromTree((data as GitHubTreeResponse[])[0].tree)
	}

	if (typeof data === "object" && "tree" in data) {
		return extractSlugsFromTree((data as GitHubTreeResponse).tree)
	}

	return null
}

function buildAliasMap(slugs: string[]): Map<string, string[]> {
	const groups = new Map<string, string[]>()
	for (const slug of slugs) {
		const base = getBaseSlug(slug)
		if (!groups.has(base)) groups.set(base, [])
		groups.get(base)!.push(slug)
	}

	const aliases = new Map<string, string[]>()
	for (const [_base, members] of groups) {
		for (const slug of members) {
			aliases.set(
				slug,
				members.filter((m) => m !== slug),
			)
		}
	}
	return aliases
}

function toRecord(slug: string, aliases: string[]) {
	return {
		source: SOURCE,
		slug,
		name: slugToName(slug),
		aliases,
		categories: ["ai"],
		formats: ["svg"],
		variants: { light: false, dark: false },
		url_templates: buildUrlTemplates(slug),
		license: LICENSE,
		attribution: ATTRIBUTION,
		source_url: SOURCE_URL,
		updated_at_source: null,
	}
}

async function main() {
	const adminEmail = process.env.PB_ADMIN
	const adminPassword = process.env.PB_ADMIN_PASS
	if (!adminEmail || !adminPassword) {
		throw new Error("PB_ADMIN and PB_ADMIN_PASS are required")
	}

	const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || process.env.PB_URL || "http://127.0.0.1:8090"
	const pb = new PocketBase(pbUrl)
	await pb.collection("_superusers").authWithPassword(adminEmail, adminPassword)

	let slugs = readLocalManifest()
	if (!slugs) {
		console.log("No local manifest found, fetching from GitHub API...")
		slugs = await fetchSlugsFromGitHub()
	}

	console.log(`Found ${slugs.length} LobeHub icons`)

	const aliasMap = buildAliasMap(slugs)

	const existingRecords = await pb.collection("external_icons").getFullList({
		filter: pb.filter("source = {:source}", { source: SOURCE }),
		fields: "id,slug",
		requestKey: null,
	})
	const existingBySlug = new Map(existingRecords.map((r) => [r.slug as string, r.id as string]))

	let created = 0
	let updated = 0

	for (const slug of slugs) {
		const record = toRecord(slug, aliasMap.get(slug) ?? [])
		const existingId = existingBySlug.get(slug)

		if (existingId) {
			await pb.collection("external_icons").update(existingId, record)
			updated++
		} else {
			await pb.collection("external_icons").create(record)
			created++
		}
	}

	console.log(`LobeHub import complete: ${created} created, ${updated} updated`)
}

main().catch((error) => {
	console.error(error)
	process.exit(1)
})
