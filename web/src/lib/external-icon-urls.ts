import type { ExternalIcon } from "@/types/icons"

const SELFHST_CDN_BASE = "https://cdn.jsdelivr.net/gh/selfhst/icons"

export function resolveExternalIconUrl(icon: Pick<ExternalIcon, "slug" | "url_templates">, key: string): string {
	const template = icon.url_templates?.[key]
	if (template) return template.replace("{slug}", icon.slug)

	const [format, variant] = key.split("_")
	const suffix = variant ? `-${variant}` : ""
	return `${SELFHST_CDN_BASE}/${format}/${icon.slug}${suffix}.${format}`
}

export function getExternalIconPreviewUrl(icon: ExternalIcon): string {
	const format = icon.formats.includes("svg") ? "svg" : icon.formats.includes("png") ? "png" : icon.formats[0] || "svg"
	return resolveExternalIconUrl(icon, format)
}
