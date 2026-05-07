import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
	return (
		<div className="isolate overflow-hidden p-2 mx-auto max-w-7xl">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div className="space-y-2">
					<Skeleton className="h-9 w-48" />
					<Skeleton className="h-5 w-72" />
				</div>
			</div>
			<div className="mt-6 grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
				{Array.from({ length: 16 }).map((_, i) => (
					<Skeleton key={i} className="aspect-square w-full rounded-lg" />
				))}
			</div>
		</div>
	)
}
