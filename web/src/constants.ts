export const BASE_URL = "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons"
export const REPO_PATH = "https://github.com/homarr-labs/dashboard-icons"
export const METADATA_URL = "https://raw.githubusercontent.com/homarr-labs/dashboard-icons/refs/heads/main/metadata.json"
export const WEB_URL = "https://dashboardicons.com"
export const REPO_NAME = "homarr-labs/dashboard-icons"

export const getDescription = (totalIcons: number) =>
	`A collection of ${totalIcons} curated icons for services, applications and tools, designed specifically for dashboards and app directories.`

export const websiteTitle = "Free Dashboard Icons - Download High-Quality UI & App Icons"

export type ExternalSourceId = "selfhst"

export interface ExternalSourceConfig {
	id: ExternalSourceId
	label: string
	cdnBase: string
	website: string
	authorName: string
	authorLogin: string
	authorUrl: string
	license: string
	pbFilter: string
}

export const EXTERNAL_SOURCES: Record<ExternalSourceId, ExternalSourceConfig> = {
	selfhst: {
		id: "selfhst",
		label: "selfh.st",
		cdnBase: "https://cdn.jsdelivr.net/gh/selfhst/icons",
		website: "https://selfh.st/icons/",
		authorName: "selfh.st/icons",
		authorLogin: "selfhst",
		authorUrl: "https://selfh.st/icons/",
		license: "CC BY 4.0",
		pbFilter: "selfhst",
	},
}

export const EXTERNAL_SOURCE_IDS = Object.keys(EXTERNAL_SOURCES) as ExternalSourceId[]

export function getExternalSource(id: ExternalSourceId): ExternalSourceConfig {
	return EXTERNAL_SOURCES[id]
}
