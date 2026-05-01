import type { NextConfig } from "next";
import { withPostHogConfig } from "@posthog/nextjs-config";

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
	outputFileTracingExcludes: {
		"*": [
			"./scripts/**",
			"./docs/**",
			"./e2e/**",
			"./playwright.config.ts",
			"./.cursor/**",
			"./node_modules/@biomejs/**",
			"./node_modules/@playwright/**",
			"./node_modules/playwright/**",
			"./node_modules/playwright-core/**",
			"./node_modules/typescript/**",
			"./node_modules/@swc/helpers/**",
		],
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
