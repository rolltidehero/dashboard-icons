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
const LOCAL_MANIFEST = "data/sources/lobehub/icons.json"

const CDN = {
	svg: "https://cdn.jsdelivr.net/npm/@lobehub/icons-static-svg@latest",
	png: "https://cdn.jsdelivr.net/npm/@lobehub/icons-static-png@latest",
	webp: "https://cdn.jsdelivr.net/npm/@lobehub/icons-static-webp@latest",
} as const

const PREFIXES = {
	svg: "packages/static-svg/icons/",
	pngLight: "packages/static-png/light/",
	pngDark: "packages/static-png/dark/",
	webpLight: "packages/static-webp/light/",
	webpDark: "packages/static-webp/dark/",
	srcMd: "src/",
} as const

const SYNONYMS: Record<string, string[]> = {
	openai: ["gpt", "chatgpt", "dall-e", "gpt-4", "gpt-4o", "gpt-5"],
	anthropic: ["claude"],
	google: ["gemini", "bard"],
	meta: ["llama"],
	"deepseek": ["deepseek-coder", "deepseek-v2", "deepseek-v3"],
	mistral: ["mixtral"],
	stability: ["stable-diffusion", "sdxl"],
	midjourney: ["mj"],
	huggingface: ["hf", "hugging-face"],
	perplexity: ["pplx"],
	cohere: ["command-r"],
}

function slugToName(slug: string): string {
	return slug
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ")
}

function getBaseSlug(slug: string): string {
	return slug.replace(/-(color|text|avatar|combine)$/, "")
}

function extractSlugsFromPrefix(tree: GitHubTreeEntry[], prefix: string, ext: string): Set<string> {
	const slugs = new Set<string>()
	for (const entry of tree) {
		if (entry.type === "blob" && entry.path.startsWith(prefix) && entry.path.endsWith(ext)) {
			slugs.add(path.basename(entry.path, ext))
		}
	}
	return slugs
}

type AssetIndex = {
	svgSlugs: Set<string>
	pngLightSlugs: Set<string>
	pngDarkSlugs: Set<string>
	webpLightSlugs: Set<string>
	webpDarkSlugs: Set<string>
}

function indexTree(tree: GitHubTreeEntry[]): AssetIndex {
	return {
		svgSlugs: extractSlugsFromPrefix(tree, PREFIXES.svg, ".svg"),
		pngLightSlugs: extractSlugsFromPrefix(tree, PREFIXES.pngLight, ".png"),
		pngDarkSlugs: extractSlugsFromPrefix(tree, PREFIXES.pngDark, ".png"),
		webpLightSlugs: extractSlugsFromPrefix(tree, PREFIXES.webpLight, ".webp"),
		webpDarkSlugs: extractSlugsFromPrefix(tree, PREFIXES.webpDark, ".webp"),
	}
}

type BrandMeta = { group: string; title: string }

function parseFrontmatter(content: string): Record<string, string> {
	const match = content.match(/^---\n([\s\S]*?)\n---/)
	if (!match) return {}
	const pairs: Record<string, string> = {}
	for (const line of match[1].split("\n")) {
		const idx = line.indexOf(":")
		if (idx > 0) {
			pairs[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
		}
	}
	return pairs
}

async function fetchBrandMetadata(tree: GitHubTreeEntry[], headers: Record<string, string>): Promise<Map<string, BrandMeta>> {
	const mdPaths = tree
		.filter((e) => e.type === "blob" && e.path.startsWith(PREFIXES.srcMd) && e.path.endsWith("/index.md"))
		.map((e) => e.path)

	const meta = new Map<string, BrandMeta>()
	const batchSize = 20
	for (let i = 0; i < mdPaths.length; i += batchSize) {
		const batch = mdPaths.slice(i, i + batchSize)
		const results = await Promise.all(
			batch.map(async (p) => {
				const url = `https://raw.githubusercontent.com/lobehub/lobe-icons/master/${p}`
				try {
					const res = await fetch(url, { headers: { Accept: "text/plain" } })
					if (!res.ok) return null
					const text = await res.text()
					const fm = parseFrontmatter(text)
					const folder = p.split("/")[1]
					if (folder && fm.group) {
						return { folder, group: fm.group, title: fm.title || folder }
					}
				} catch { /* skip */ }
				return null
			}),
		)
		for (const r of results) {
			if (r) meta.set(r.folder.toLowerCase(), r)
		}
	}

	return meta
}

function buildSlugToBrand(svgSlugs: Set<string>, brandMeta: Map<string, BrandMeta>): Map<string, BrandMeta> {
	const result = new Map<string, BrandMeta>()
	const brandKeys = Array.from(brandMeta.keys())

	for (const slug of svgSlugs) {
		const base = getBaseSlug(slug)
		const match = brandKeys.find((k) => k === base || k === slug)
		if (match) {
			result.set(slug, brandMeta.get(match)!)
		}
	}
	return result
}

function buildUrlTemplates(slug: string, index: AssetIndex) {
	const templates: Record<string, string> = {
		svg: `${CDN.svg}/icons/{slug}.svg`,
	}

	const hasPngLight = index.pngLightSlugs.has(slug)
	const hasPngDark = index.pngDarkSlugs.has(slug)
	if (hasPngLight) {
		templates.png = `${CDN.png}/light/{slug}.png`
		templates.png_light = `${CDN.png}/light/{slug}.png`
	}
	if (hasPngDark) {
		templates.png_dark = `${CDN.png}/dark/{slug}.png`
		if (!hasPngLight) templates.png = `${CDN.png}/dark/{slug}.png`
	}

	const hasWebpLight = index.webpLightSlugs.has(slug)
	const hasWebpDark = index.webpDarkSlugs.has(slug)
	if (hasWebpLight) {
		templates.webp = `${CDN.webp}/light/{slug}.webp`
		templates.webp_light = `${CDN.webp}/light/{slug}.webp`
	}
	if (hasWebpDark) {
		templates.webp_dark = `${CDN.webp}/dark/{slug}.webp`
		if (!hasWebpLight) templates.webp = `${CDN.webp}/dark/{slug}.webp`
	}

	return templates
}

function getFormats(slug: string, index: AssetIndex): string[] {
	const formats = ["svg"]
	if (index.pngLightSlugs.has(slug) || index.pngDarkSlugs.has(slug)) formats.push("png")
	if (index.webpLightSlugs.has(slug) || index.webpDarkSlugs.has(slug)) formats.push("webp")
	return formats
}

function getVariants(slug: string, index: AssetIndex) {
	return {
		light: index.pngLightSlugs.has(slug) || index.webpLightSlugs.has(slug),
		dark: index.pngDarkSlugs.has(slug) || index.webpDarkSlugs.has(slug),
	}
}

type BrandGroup = {
	primary: string
	aliases: string[]
}

function groupSlugs(svgSlugs: Set<string>): BrandGroup[] {
	const groups = new Map<string, string[]>()
	for (const slug of svgSlugs) {
		const base = getBaseSlug(slug)
		if (!groups.has(base)) groups.set(base, [])
		groups.get(base)!.push(slug)
	}

	const result: BrandGroup[] = []
	for (const [base, members] of groups) {
		const colorSlug = members.find((m) => m.endsWith("-color"))
		const primary = colorSlug ?? members.find((m) => m === base) ?? members[0]
		const aliases = members.filter((m) => m !== primary)
		const synonyms = SYNONYMS[base] ?? []
		result.push({ primary, aliases: [...aliases, ...synonyms] })
	}
	return result
}

function toRecord(
	group: BrandGroup,
	index: AssetIndex,
	slugBrandMap: Map<string, BrandMeta>,
) {
	const { primary: slug, aliases } = group
	const brand = slugBrandMap.get(slug)
	const categories = ["ai"]
	if (brand?.group) categories.push(brand.group.toLowerCase())

	const name = brand?.title ?? slugToName(getBaseSlug(slug))

	return {
		source: SOURCE,
		slug,
		name,
		aliases,
		categories,
		formats: getFormats(slug, index),
		variants: getVariants(slug, index),
		url_templates: buildUrlTemplates(slug, index),
		license: LICENSE,
		attribution: ATTRIBUTION,
		source_url: SOURCE_URL,
		updated_at_source: null,
	}
}

async function fetchTree(): Promise<GitHubTreeResponse> {
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
	return data
}

function readLocalTree(): GitHubTreeEntry[] | null {
	const filePath = path.join(process.cwd(), LOCAL_MANIFEST)
	if (!fs.existsSync(filePath)) return null

	const raw = fs.readFileSync(filePath, "utf8")
	const data = JSON.parse(raw)

	if (Array.isArray(data) && data.length > 0 && typeof data[0] === "object" && "name" in data[0]) {
		return null
	}

	if (typeof data === "object" && !Array.isArray(data) && "tree" in data) {
		return (data as GitHubTreeResponse).tree
	}

	return null
}

function parseArgs() {
	const args = process.argv.slice(2)
	const flags = {
		purge: false,
		dryRun: false,
	}
	for (const arg of args) {
		if (arg === "--purge") flags.purge = true
		if (arg === "--dry-run") flags.dryRun = true
	}
	return flags
}

async function main() {
	const flags = parseArgs()

	const adminEmail = process.env.PB_ADMIN
	const adminPassword = process.env.PB_ADMIN_PASS
	if (!adminEmail || !adminPassword) {
		throw new Error("PB_ADMIN and PB_ADMIN_PASS are required")
	}

	const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || process.env.PB_URL || "http://127.0.0.1:8090"
	const pb = new PocketBase(pbUrl)
	await pb.collection("_superusers").authWithPassword(adminEmail, adminPassword)

	if (flags.purge) {
		const all = await pb.collection("external_icons").getFullList({
			filter: pb.filter("source = {:source}", { source: SOURCE }),
			fields: "id,slug",
			requestKey: null,
		})
		console.log(`Purging all ${all.length} lobehub records...`)
		if (!flags.dryRun) {
			for (const r of all) {
				await pb.collection("external_icons").delete(r.id)
			}
		}
		console.log(flags.dryRun ? "(dry run, nothing deleted)" : `Deleted ${all.length} records`)
		return
	}

	let tree = readLocalTree()
	if (!tree) {
		console.log("No local manifest found, fetching from GitHub API...")
		const treeResponse = await fetchTree()
		tree = treeResponse.tree
	}

	const index = indexTree(tree)
	console.log(`Found: ${index.svgSlugs.size} SVGs, ${index.pngLightSlugs.size} PNG light, ${index.pngDarkSlugs.size} PNG dark, ${index.webpLightSlugs.size} WebP light, ${index.webpDarkSlugs.size} WebP dark`)

	const headers: Record<string, string> = {}
	if (process.env.GH_TOKEN || process.env.GITHUB_TOKEN) {
		headers.Authorization = `Bearer ${process.env.GH_TOKEN || process.env.GITHUB_TOKEN}`
	}

	console.log("Fetching brand metadata from src/*/index.md...")
	const brandMeta = await fetchBrandMetadata(tree, headers)
	console.log(`Parsed metadata for ${brandMeta.size} brands`)

	const slugBrandMap = buildSlugToBrand(index.svgSlugs, brandMeta)
	const groups = groupSlugs(index.svgSlugs)
	console.log(`Grouped into ${groups.length} brands (from ${index.svgSlugs.size} slugs)`)

	const existingRecords = await pb.collection("external_icons").getFullList({
		filter: pb.filter("source = {:source}", { source: SOURCE }),
		fields: "id,slug",
		requestKey: null,
	})
	const existingBySlug = new Map(existingRecords.map((r) => [r.slug as string, r.id as string]))

	let created = 0
	let updated = 0
	let deleted = 0
	const importedSlugs = new Set<string>()

	for (const group of groups) {
		const record = toRecord(group, index, slugBrandMap)
		importedSlugs.add(group.primary)
		const existingId = existingBySlug.get(group.primary)

		if (flags.dryRun) {
			console.log(`[dry-run] ${existingId ? "update" : "create"}: ${group.primary} (aliases: ${group.aliases.join(", ") || "none"})`)
			existingId ? updated++ : created++
			continue
		}

		if (existingId) {
			await pb.collection("external_icons").update(existingId, record)
			updated++
		} else {
			await pb.collection("external_icons").create(record)
			created++
		}
	}

	for (const [slug, id] of existingBySlug) {
		if (!importedSlugs.has(slug)) {
			if (!flags.dryRun) await pb.collection("external_icons").delete(id)
			deleted++
		}
	}

	console.log(`LobeHub import complete: ${created} created, ${updated} updated, ${deleted} removed (non-primary variants)${flags.dryRun ? " (dry run)" : ""}`)
}

main().catch((error) => {
	console.error(error)
	process.exit(1)
})
