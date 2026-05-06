import { pb } from "@/lib/pb"

interface SubmissionPayload {
	name: string
	assets: File[]
	created_by: string
	status: "pending"
	description?: string
	extras: Record<string, any>
}

function sanitizeFilterValue(value: string): string {
	return value.replace(/'/g, "\\'")
}

export async function submitOrReplaceRejected(data: SubmissionPayload) {
	const safeName = sanitizeFilterValue(data.name)
	const existing = await pb
		.collection("community_gallery")
		.getFirstListItem(`name = '${safeName}' && status = 'rejected'`, { requestKey: null })
		.catch(() => null)

	if (existing) {
		return pb.collection("submissions").update(existing.id, data, { requestKey: null })
	}

	return pb.collection("submissions").create(data)
}
