import { PostHog } from "posthog-node"
import type { LoggerProvider } from "@opentelemetry/sdk-logs"

let posthogClient: PostHog | null = null
export let loggerProvider: LoggerProvider | null = null

function getPostHogClient(): PostHog | null {
	const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
	if (!key || process.env.NEXT_PUBLIC_DISABLE_POSTHOG === "true") return null
	if (!posthogClient) {
		posthogClient = new PostHog(key, {
			host: "https://eu.i.posthog.com",
			flushAt: 1,
			flushInterval: 0,
		})
	}
	return posthogClient
}

export async function register() {
	if (
		process.env.NEXT_RUNTIME === "nodejs" &&
		process.env.NEXT_PUBLIC_POSTHOG_KEY &&
		process.env.NEXT_PUBLIC_DISABLE_POSTHOG !== "true"
	) {
		const { BatchLogRecordProcessor: Processor, LoggerProvider: Provider } = await import(
			"@opentelemetry/sdk-logs"
		)
		const { OTLPLogExporter } = await import("@opentelemetry/exporter-logs-otlp-http")
		const { logs } = await import("@opentelemetry/api-logs")
		const { resourceFromAttributes } = await import("@opentelemetry/resources")

		loggerProvider = new Provider({
			resource: resourceFromAttributes({ "service.name": "dashboard-icons-web" }),
			processors: [
				new Processor(
					new OTLPLogExporter({
						url: "https://eu.i.posthog.com/i/v1/logs",
						headers: {
							Authorization: `Bearer ${process.env.NEXT_PUBLIC_POSTHOG_KEY}`,
							"Content-Type": "application/json",
						},
					}),
				),
			],
		})

		logs.setGlobalLoggerProvider(loggerProvider)
	}
}

export async function onRequestError(
	error: Error & { digest?: string },
	request: { path: string; method: string; headers: Record<string, string> },
	context: { routerKind: string; routePath: string; routeType: string; renderSource: string },
) {
	if (error.message?.includes("NoFallbackError")) return

	const posthog = getPostHogClient()
	if (!posthog) return

	posthog.capture({
		distinctId: "server",
		event: "$exception",
		properties: {
			$exception_message: error.message,
			$exception_type: error.name,
			$exception_stack_trace_raw: error.stack,
			path: request.path,
			method: request.method,
			routerKind: context.routerKind,
			routePath: context.routePath,
			routeType: context.routeType,
			renderSource: context.renderSource,
			digest: error.digest,
		},
	})
	posthog.flush().catch(() => {})
}
