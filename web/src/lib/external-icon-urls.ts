import { EXTERNAL_SOURCES } from "@/constants"
import type { ExternalIcon } from "@/types/icons"

export function resolveExternalIconUrl(icon: Pick<ExternalIcon, "source" | "slug" | "url_templates">, key: string): string {
	const template = icon.url_templates?.[key]
	if (template) return template.replace("{slug}", icon.slug)

	const sourceConfig = EXTERNAL_SOURCES[icon.source]
	const cdnBase = sourceConfig?.cdnBase ?? ""

	const [format, variant] = key.split("_")
	const suffix = variant ? `-${variant}` : ""
	return `${cdnBase}/${format}/${icon.slug}${suffix}.${format}`
}

export function getExternalIconPreviewUrl(icon: ExternalIcon): string {
	const format = icon.formats.includes("svg") ? "svg" : icon.formats.includes("png") ? "png" : icon.formats[0] || "svg"
	return resolveExternalIconUrl(icon, format)
}
