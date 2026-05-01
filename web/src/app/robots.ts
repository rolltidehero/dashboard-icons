import type { MetadataRoute } from "next"
import { WEB_URL } from "@/constants"

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [
			{
				userAgent: "*",
				allow: "/",
				disallow: ["/dashboard/", "/api/"],
			},
		],
		sitemap: `${WEB_URL}/sitemap.xml`,
		host: WEB_URL,
	}
}
