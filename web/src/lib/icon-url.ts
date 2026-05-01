import { BASE_URL, type ExternalSourceId } from "@/constants"
import { getExternalIconPreviewUrl } from "@/lib/external-icon-urls"
import type { IconWithName } from "@/types/icons"

export function getIconImageUrl(icon: IconWithName): string {
	const { name, data: iconData, source, external } = icon

	if (source && source !== "native" && external) {
		return getExternalIconPreviewUrl(external)
	}

	if (typeof iconData.base === "string" && iconData.base.startsWith("http")) {
		return iconData.base
	}

	return `${BASE_URL}/${iconData.base}/${name}.${iconData.base}`
}
