import type { MetadataRoute } from "next"
import { BASE_URL, WEB_URL } from "@/constants"
import { getAllIcons } from "@/lib/api"
import { resolveExternalIconUrl } from "@/lib/external-icon-urls"
import { getExternalIcons } from "@/lib/external-icons"

export const dynamic = "force-static"

// Helper function to format dates as YYYY-MM-DD
const formatDate = (date: Date): string => {
	// Format to YYYY-MM-DD
	return date.toISOString().split("T")[0]
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const [iconsData, externalIcons] = await Promise.all([getAllIcons(), getExternalIcons()])
	return [
		{
			url: WEB_URL,
			lastModified: formatDate(new Date()),
			changeFrequency: "yearly",
			priority: 1,
		},
		{
			url: `${WEB_URL}/icons`,
			lastModified: formatDate(new Date()),
			changeFrequency: "daily",
			priority: 1,
			images: [`${WEB_URL}/icons/icon.png`],
		},
		...Object.keys(iconsData).map((iconName) => ({
			url: `${WEB_URL}/icons/${iconName}`,
			lastModified: formatDate(new Date(iconsData[iconName].update.timestamp)),
			changeFrequency: "yearly" as const,
			priority: 0.8,
			images: [
				`${BASE_URL}/png/${iconName}.png`,
				// SVG is conditional if it exists
				iconsData[iconName].base === "svg" ? `${BASE_URL}/svg/${iconName}.svg` : null,
				`${BASE_URL}/webp/${iconName}.webp`,
			].filter(Boolean) as string[],
		})),
		...externalIcons.map((icon) => ({
			url: `${WEB_URL}/icons/external/${icon.slug}`,
			lastModified: formatDate(new Date(icon.external.updated_at_source || icon.external.updated || icon.external.created || Date.now())),
			changeFrequency: "yearly" as const,
			priority: 0.6,
			images: icon.external.formats.map((format) => resolveExternalIconUrl(icon.external, format)),
		})),
	]
}
