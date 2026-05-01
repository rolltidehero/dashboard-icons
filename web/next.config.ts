import type { NextConfig } from "next";
import { withPostHogConfig } from "@posthog/nextjs-config";

const securityHeaders = [
	{ key: "X-Content-Type-Options", value: "nosniff" },
	{ key: "X-Frame-Options", value: "DENY" },
	{ key: "X-XSS-Protection", value: "1; mode=block" },
	{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
	{ key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
	cacheComponents: false,
	images: {
		unoptimized: true,
		remotePatterns: [
			{
				protocol: "https",
				hostname: "cdn.jsdelivr.net",
				port: "",
				pathname: "/gh/selfhst/icons/**",
				search: "",
			},
		],
	},
	output: "standalone",
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: securityHeaders,
			},
			{
				source: "/:path*.png",
				headers: [
					{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
				],
			},
			{
				source: "/:path*.svg",
				headers: [
					{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
				],
			},
			{
				source: "/:path*.webp",
				headers: [
					{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
				],
			},
		];
	},
};

export default nextConfig;

// export default withPostHogConfig(nextConfig, {
//   personalApiKey: process.env.POSTHOG_API_KEY!, // Personal API Key
//   envId: process.env.POSTHOG_ENV_ID!, // Environment ID
//   host: process.env.NEXT_PUBLIC_POSTHOG_HOST, // (optional), defaults to https://us.posthog.com
//   sourcemaps: { // (optional)
//       enabled: true, // (optional) Enable sourcemaps generation and upload, default to true on production builds
//       project: "dashboardicons", // (optional) Project name, defaults to repository name
//       deleteAfterUpload: true, // (optional) Delete sourcemaps after upload, defaults to true
//   },
// });
