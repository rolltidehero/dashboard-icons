import { ImageResponse } from "next/og"
import { BASE_URL } from "@/constants"
import { getAllIcons } from "@/lib/api"

export const contentType = "image/png"
export const size = { width: 1200, height: 630 }

export async function GET(_req: Request, { params }: { params: Promise<{ icon: string }> }) {
	const { icon } = await params
	const iconsData = await getAllIcons()
	const iconMeta = iconsData[icon]

	const formattedName = icon
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ")

	const iconUrl = `${BASE_URL}/png/${icon}.png`
	const categories = (iconMeta?.categories as string[] | undefined) || []

	return new ImageResponse(
		<div
			style={{
				height: "100%",
				width: "100%",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				background: "linear-gradient(135deg, #18181b 0%, #27272a 50%, #18181b 100%)",
				fontFamily: "system-ui, sans-serif",
				padding: "60px",
			}}
		>
			<div style={{ display: "flex", alignItems: "center", gap: "48px" }}>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						width: "280px",
						height: "280px",
						borderRadius: "24px",
						background: "rgba(255, 255, 255, 0.06)",
						border: "1px solid rgba(255, 255, 255, 0.1)",
						padding: "40px",
					}}
				>
					{/* biome-ignore lint/performance/noImgElement: ImageResponse from next/og uses Satori which requires native HTML img elements */}
					<img src={iconUrl} width="200" height="200" alt={`${formattedName} icon`} style={{ objectFit: "contain" }} />
				</div>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: "12px",
						maxWidth: "640px",
					}}
				>
					<h1
						style={{
							fontSize: "56px",
							fontWeight: "700",
							color: "#fafafa",
							lineHeight: "1.1",
							margin: "0",
						}}
					>
						{formattedName}
					</h1>
					<p style={{ fontSize: "24px", color: "#a1a1aa", margin: "0" }}>Free {formattedName} icon &amp; logo for dashboards</p>
					{categories.length > 0 && (
						<div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
							{categories.slice(0, 4).map((cat) => (
								<span
									key={cat}
									style={{
										fontSize: "16px",
										color: "#d4d4d8",
										background: "rgba(161, 161, 170, 0.15)",
										padding: "4px 12px",
										borderRadius: "999px",
									}}
								>
									{cat}
								</span>
							))}
						</div>
					)}
				</div>
			</div>
			<div
				style={{
					position: "absolute",
					bottom: "32px",
					right: "60px",
					display: "flex",
					alignItems: "center",
					gap: "8px",
				}}
			>
				<span style={{ fontSize: "18px", fontWeight: "600", color: "#71717a" }}>Dashboard Icons</span>
			</div>
		</div>,
		{
			...size,
			headers: {
				"Cache-Control": "public, max-age=31536000, immutable",
				"CDN-Cache-Control": "public, max-age=31536000, immutable",
			},
		},
	)
}
