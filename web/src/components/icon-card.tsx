"use client"

import Image from "next/image"
import Link from "next/link"
import { useTheme } from "next-themes"
import { MagicCard } from "@/components/magicui/magic-card"
import { Badge } from "@/components/ui/badge"
import { BASE_URL, EXTERNAL_SOURCES, type ExternalSourceId } from "@/constants"
import { getExternalIconThemedPreviewUrl } from "@/lib/external-icon-urls"
import { formatIconName } from "@/lib/utils"
import type { IconWithName } from "@/types/icons"

function useThemedImageUrl(icon: IconWithName): string {
	const { resolvedTheme } = useTheme()
	const theme = resolvedTheme === "dark" ? "dark" : "light"
	const { name, data: iconData } = icon
	const externalIcon = icon.source && icon.source !== "native" ? icon.external : undefined
	const isCommunityIcon = typeof iconData.base === "string" && iconData.base.startsWith("http")

	if (externalIcon) {
		return getExternalIconThemedPreviewUrl(externalIcon, theme)
	}

	if (isCommunityIcon) {
		return iconData.base as string
	}

	const themeVariant = theme === "dark" ? iconData.colors?.dark : iconData.colors?.light
	if (themeVariant) {
		return `${BASE_URL}/${iconData.base}/${themeVariant}.${iconData.base}`
	}

	return `${BASE_URL}/${iconData.base}/${name}.${iconData.base}`
}

export function IconCard({ icon, matchedAlias }: { icon: IconWithName; matchedAlias?: string }) {
	const { name, data: iconData } = icon
	const formatedIconName = formatIconName(name)

	const externalIcon = icon.source && icon.source !== "native" ? icon.external : undefined
	const sourceConfig = externalIcon ? EXTERNAL_SOURCES[icon.source as ExternalSourceId] : undefined
	const imageUrl = useThemedImageUrl(icon)

	const linkHref = externalIcon
		? `/icons/external/${icon.slug || externalIcon.slug}`
		: isCommunityIcon
			? `/community/${name}`
			: `/icons/${name}`
	return (
		<MagicCard className="rounded-md shadow-md">
			{externalIcon && sourceConfig && (
				<div className="absolute top-0 right-0 z-10">
					<Image src={sourceConfig.icon} alt="" width={24} height={24} className="shrink-0" unoptimized />
				</div>
			)}
			<Link prefetch={false} href={linkHref} className="group flex flex-col items-center p-3 sm:p-4 cursor-pointer">
				<div className="relative h-16 w-16 mb-2 rounded-lg ring-1 ring-white/5 dark:ring-white/10 bg-primary/15 dark:bg-secondary/10">
					<Image
						src={imageUrl}
						alt={`${name} icon`}
						fill
						sizes="32px 32px"
						className="object-contain p-2 group-hover:scale-110 transition-transform duration-300"
					/>
				</div>
				<span className="text-xs sm:text-sm text-center truncate w-full capitalize group- dark:group-hover:text-primary transition-colors duration-200 font-medium">
					{formatedIconName}
				</span>
				{matchedAlias && <span className="mt-1 max-w-full truncate text-[10px] text-muted-foreground">Alias: {matchedAlias}</span>}
			</Link>
		</MagicCard>
	)
}

export function IconPreviewCard({ preview, label, name }: { preview: string; label: string; name: string }) {
	return (
		<MagicCard className="rounded-md shadow-md">
			<div className="flex flex-col items-center p-3 sm:p-4">
				<div className="relative h-16 w-16 mb-2 rounded-lg ring-1 ring-white/5 dark:ring-white/10 bg-primary/15 dark:bg-secondary/10 overflow-hidden">
					<Image src={preview} alt={`${name} - ${label}`} fill unoptimized className="object-contain p-2" />
				</div>
				<span className="text-xs sm:text-sm text-center truncate w-full capitalize font-medium">{name || "icon-name"}</span>
				<span className="text-[10px] text-muted-foreground">{label}</span>
			</div>
		</MagicCard>
	)
}
