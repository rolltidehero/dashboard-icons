"use client"

import { useQueryClient } from "@tanstack/react-query"
import {
	AlertCircle,
	CheckCircle2,
	Clock,
	Github,
	ImageIcon,
	MessageSquare,
	RefreshCw,
	Rocket,
	XCircle,
} from "lucide-react"
import * as React from "react"
import { LoginModalContent } from "@/components/login-modal"
import { SubmissionsDataTable } from "@/components/submissions-data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useIsMobile } from "@/hooks/use-mobile"
import {
	useApproveSubmission,
	useAuth,
	useBulkApproveSubmissions,
	useBulkTriggerWorkflow,
	useRejectSubmission,
	useSubmissions,
	useTriggerWorkflow,
} from "@/hooks/use-submissions"
import type { Submission } from "@/lib/pb"

function StatCard({ label, value, icon: Icon, variant }: {
	label: string
	value: number
	icon: React.ElementType
	variant: "warning" | "success" | "destructive" | "info"
}) {
	const variantClasses = {
		warning: "text-yellow-600 dark:text-yellow-400",
		success: "text-green-600 dark:text-green-400",
		destructive: "text-red-600 dark:text-red-400",
		info: "text-blue-600 dark:text-blue-400",
	}

	return (
		<div className="flex items-center gap-3 min-w-0">
			<div className={`shrink-0 ${variantClasses[variant]}`}>
				<Icon className="h-4 w-4" />
			</div>
			<div className="min-w-0">
				<p className="text-2xl font-semibold tabular-nums leading-none">{value}</p>
				<p className="text-xs text-muted-foreground mt-0.5">{label}</p>
			</div>
		</div>
	)
}

function UserSubmissionCard({ submission, onExpand }: { submission: Submission; onExpand: (s: Submission) => void }) {
	const hasAdminComment = submission.admin_comment?.trim()

	return (
		<button
			type="button"
			onClick={() => onExpand(submission)}
			className="w-full text-left p-4 rounded-lg border bg-background hover:bg-muted/50 transition-colors"
		>
			<div className="flex items-start gap-3">
				<div className="w-10 h-10 rounded border flex items-center justify-center bg-muted/30 shrink-0 p-1.5">
					{submission.assets.length > 0 ? (
						<img
							src={`${process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090"}/api/files/submissions/${submission.id}/${submission.assets[0]}?thumb=100x100`}
							alt={submission.name}
							className="w-full h-full object-contain"
						/>
					) : (
						<ImageIcon className="w-5 h-5 text-muted-foreground" />
					)}
				</div>
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2">
						<span className="font-medium capitalize truncate">{submission.name}</span>
						<SubmissionStatusBadge status={submission.status} />
					</div>
					{hasAdminComment && (
						<div className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground bg-muted/50 rounded px-2.5 py-1.5">
							<MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0" />
							<span className="line-clamp-2">{submission.admin_comment}</span>
						</div>
					)}
					{!hasAdminComment && (
						<p className="text-xs text-muted-foreground mt-1">
							Submitted {new Date(submission.created).toLocaleDateString()}
						</p>
					)}
				</div>
			</div>
		</button>
	)
}

function SubmissionStatusBadge({ status }: { status: Submission["status"] }) {
	const config = {
		pending: { label: "Pending", className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20" },
		approved: { label: "Approved", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
		rejected: { label: "Rejected", className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" },
		added_to_collection: { label: "Live", className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" },
	}
	const { label, className } = config[status]
	return <Badge variant="outline" className={`text-xs ${className}`}>{label}</Badge>
}

export default function DashboardPage() {
	const isMobile = useIsMobile()
	const queryClient = useQueryClient()

	const { data: auth, isLoading: authLoading } = useAuth()
	const { data: submissions = [], isLoading: submissionsLoading, error: submissionsError, refetch } = useSubmissions()

	const approveMutation = useApproveSubmission()
	const rejectMutation = useRejectSubmission()
	const workflowMutation = useTriggerWorkflow()
	const bulkWorkflowMutation = useBulkTriggerWorkflow()
	const bulkApproveMutation = useBulkApproveSubmissions()

	const [workflowUrl, setWorkflowUrl] = React.useState<string | undefined>()
	const [approveDialogOpen, setApproveDialogOpen] = React.useState(false)
	const [approvingSubmissionId, setApprovingSubmissionId] = React.useState<string | null>(null)
	const [approveAdminComment, setApproveAdminComment] = React.useState("")
	const [bulkApproveDialogOpen, setBulkApproveDialogOpen] = React.useState(false)
	const [bulkApprovingIds, setBulkApprovingIds] = React.useState<string[]>([])
	const [bulkApproveAdminComment, setBulkApproveAdminComment] = React.useState("")
	const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false)
	const [rejectingSubmissionId, setRejectingSubmissionId] = React.useState<string | null>(null)
	const [adminComment, setAdminComment] = React.useState("")
	const [activeTab, setActiveTab] = React.useState("review")

	const isLoading = authLoading || submissionsLoading
	const isAuthenticated = auth?.isAuthenticated ?? false
	const isAdmin = auth?.isAdmin ?? false
	const currentUserId = auth?.userId ?? ""

	const stats = React.useMemo(() => {
		const pending = submissions.filter((s) => s.status === "pending").length
		const approved = submissions.filter((s) => s.status === "approved").length
		const rejected = submissions.filter((s) => s.status === "rejected").length
		const added = submissions.filter((s) => s.status === "added_to_collection").length
		return { pending, approved, rejected, added, total: submissions.length }
	}, [submissions])

	const filteredSubmissions = React.useMemo(() => {
		if (!isAdmin) return submissions
		switch (activeTab) {
			case "review":
				return submissions.filter((s) => s.status === "pending")
			case "deploy":
				return submissions.filter((s) => s.status === "approved")
			case "all":
				return submissions
			default:
				return submissions
		}
	}, [submissions, activeTab, isAdmin])

	const userSubmissions = React.useMemo(() => {
		if (isAdmin) return []
		return submissions.filter((s) => s.created_by === currentUserId)
	}, [submissions, isAdmin, currentUserId])

	const handleApprove = (submissionId: string) => {
		setApprovingSubmissionId(submissionId)
		setApproveAdminComment("")
		setApproveDialogOpen(true)
	}

	const handleReject = (submissionId: string) => {
		setRejectingSubmissionId(submissionId)
		setAdminComment("")
		setRejectDialogOpen(true)
	}

	const handleTriggerWorkflow = (submissionId: string) => {
		workflowMutation.mutate(
			{ submissionId },
			{ onSuccess: (data) => setWorkflowUrl(data.workflowUrl) },
		)
	}

	const handleBulkTriggerWorkflow = (submissionIds: string[]) => {
		bulkWorkflowMutation.mutate(
			{ submissionIds },
			{ onSuccess: (data) => setWorkflowUrl(data.workflowUrl) },
		)
	}

	const handleRejectSubmit = () => {
		if (rejectingSubmissionId) {
			rejectMutation.mutate(
				{ submissionId: rejectingSubmissionId, adminComment: adminComment.trim() || undefined },
				{
					onSuccess: () => {
						setRejectDialogOpen(false)
						setRejectingSubmissionId(null)
						setAdminComment("")
					},
				},
			)
		}
	}

	const handleApproveSubmit = () => {
		if (approvingSubmissionId) {
			approveMutation.mutate(
				{ submissionId: approvingSubmissionId, adminComment: approveAdminComment.trim() || undefined },
				{
					onSuccess: () => {
						setApproveDialogOpen(false)
						setApprovingSubmissionId(null)
						setApproveAdminComment("")
					},
				},
			)
		}
	}

	const handleBulkApprove = (submissionIds: string[]) => {
		setBulkApprovingIds(submissionIds)
		setBulkApproveAdminComment("")
		setBulkApproveDialogOpen(true)
	}

	const handleBulkApproveSubmit = () => {
		if (bulkApprovingIds.length > 0) {
			bulkApproveMutation.mutate(
				{ submissionIds: bulkApprovingIds, adminComment: bulkApproveAdminComment.trim() || undefined },
				{
					onSuccess: () => {
						setBulkApproveDialogOpen(false)
						setBulkApprovingIds([])
						setBulkApproveAdminComment("")
					},
				},
			)
		}
	}

	// Not authenticated
	if (!authLoading && !isAuthenticated) {
		return (
			<div className="container mx-auto pt-6 sm:pt-12 pb-14 px-4 sm:px-6 lg:px-8 flex justify-center">
				<Card className="bg-background/50 border shadow-lg w-full max-w-md">
					<CardContent className="pt-6 sm:pt-8 pb-6 px-4 sm:px-6">
						<LoginModalContent
							autoFocus={false}
							onSuccess={() => {
								queryClient.invalidateQueries({ queryKey: ["auth"] })
								queryClient.invalidateQueries({ queryKey: ["submissions"] })
							}}
						/>
					</CardContent>
				</Card>
			</div>
		)
	}

	if (isLoading) {
		return (
			<div className="container mx-auto pt-6 sm:pt-12 pb-14 px-4 sm:px-6 lg:px-8">
				<div className="space-y-6">
					<div className="space-y-2">
						<Skeleton className="h-8 w-48 sm:w-64" />
						<Skeleton className="h-4 w-full max-w-96" />
					</div>
					<div className="flex gap-6">
						<Skeleton className="h-12 w-24" />
						<Skeleton className="h-12 w-24" />
						<Skeleton className="h-12 w-24" />
					</div>
					<Skeleton className="h-10 w-full" />
					<div className="space-y-2">
						<Skeleton className="h-16 w-full" />
						<Skeleton className="h-16 w-full" />
						<Skeleton className="h-16 w-full" />
					</div>
				</div>
			</div>
		)
	}

	if (submissionsError) {
		return (
			<div className="container mx-auto pt-6 sm:pt-12 pb-14 px-4 sm:px-6 lg:px-8">
				<div className="space-y-6">
					<div>
						<h1 className="text-xl sm:text-2xl font-semibold">Dashboard</h1>
						<p className="text-sm text-muted-foreground mt-1">
							{isAdmin ? "Review and manage icon submissions." : "Track your icon submissions."}
						</p>
					</div>
					<div className="flex items-center gap-3 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
						<AlertCircle className="h-5 w-5 text-destructive shrink-0" />
						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium">Failed to load submissions</p>
							<p className="text-xs text-muted-foreground mt-0.5">Something went wrong. Try refreshing.</p>
						</div>
						<Button variant="outline" size="sm" onClick={() => refetch()}>
							<RefreshCw className="h-3.5 w-3.5 mr-1.5" />
							Retry
						</Button>
					</div>
				</div>
			</div>
		)
	}

	// Admin view
	if (isAdmin) {
		return (
			<>
				<div className="container mx-auto pt-6 sm:pt-10 pb-14 px-4 sm:px-6 lg:px-8">
					<div className="space-y-6">
						{/* Header */}
						<div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
							<div>
								<h1 className="text-xl sm:text-2xl font-semibold">Submissions</h1>
								<p className="text-sm text-muted-foreground mt-1">
									Review, approve, and deploy community icon submissions.
								</p>
							</div>
							<Button variant="outline" size="sm" className="w-fit shrink-0" onClick={() => refetch()}>
								<RefreshCw className="h-3.5 w-3.5 mr-1.5" />
								Refresh
							</Button>
						</div>

						{/* Stats row */}
						{stats.total > 0 && (
							<div className="flex flex-wrap gap-6 sm:gap-8">
								<StatCard label="Pending review" value={stats.pending} icon={Clock} variant="warning" />
								<StatCard label="Ready for CI" value={stats.approved} icon={CheckCircle2} variant="info" />
								<StatCard label="Live" value={stats.added} icon={Rocket} variant="success" />
								<StatCard label="Rejected" value={stats.rejected} icon={XCircle} variant="destructive" />
							</div>
						)}

						{/* Tabs */}
						<Tabs value={activeTab} onValueChange={setActiveTab}>
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
								<TabsList>
									<TabsTrigger value="review" className="gap-1.5">
										<Clock className="h-3.5 w-3.5" />
										Needs Review
										{stats.pending > 0 && (
											<Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs tabular-nums">
												{stats.pending}
											</Badge>
										)}
									</TabsTrigger>
									<TabsTrigger value="deploy" className="gap-1.5">
										<Github className="h-3.5 w-3.5" />
										Ready for CI
										{stats.approved > 0 && (
											<Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs tabular-nums">
												{stats.approved}
											</Badge>
										)}
									</TabsTrigger>
									<TabsTrigger value="all" className="gap-1.5">
										All
										<Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs tabular-nums">
											{stats.total}
										</Badge>
									</TabsTrigger>
								</TabsList>
							</div>

							<TabsContent value="review">
								{stats.pending === 0 ? (
									<EmptyTab
										icon={CheckCircle2}
										title="All caught up"
										description="No submissions waiting for review."
									/>
								) : (
									<SubmissionsDataTable
										data={filteredSubmissions}
										isAdmin={isAdmin}
										currentUserId={currentUserId}
										onApprove={handleApprove}
										onReject={handleReject}
										onTriggerWorkflow={handleTriggerWorkflow}
										onBulkTriggerWorkflow={handleBulkTriggerWorkflow}
										onBulkApprove={handleBulkApprove}
										isApproving={approveMutation.isPending}
										isRejecting={rejectMutation.isPending}
										isTriggeringWorkflow={workflowMutation.isPending}
										isBulkTriggeringWorkflow={bulkWorkflowMutation.isPending}
										isBulkApproving={bulkApproveMutation.isPending}
										workflowUrl={workflowUrl}
										hideStatusHints
									/>
								)}
							</TabsContent>

							<TabsContent value="deploy">
								{stats.approved === 0 ? (
									<EmptyTab
										icon={Rocket}
										title="Nothing to deploy"
										description="Approve pending submissions to queue them for CI."
									/>
								) : (
									<SubmissionsDataTable
										data={filteredSubmissions}
										isAdmin={isAdmin}
										currentUserId={currentUserId}
										onApprove={handleApprove}
										onReject={handleReject}
										onTriggerWorkflow={handleTriggerWorkflow}
										onBulkTriggerWorkflow={handleBulkTriggerWorkflow}
										onBulkApprove={handleBulkApprove}
										isApproving={approveMutation.isPending}
										isRejecting={rejectMutation.isPending}
										isTriggeringWorkflow={workflowMutation.isPending}
										isBulkTriggeringWorkflow={bulkWorkflowMutation.isPending}
										isBulkApproving={bulkApproveMutation.isPending}
										workflowUrl={workflowUrl}
										hideStatusHints
									/>
								)}
							</TabsContent>

							<TabsContent value="all">
								{stats.total === 0 ? (
									<EmptyTab
										icon={ImageIcon}
										title="No submissions yet"
										description="Submissions will appear here once community members contribute icons."
									/>
								) : (
									<SubmissionsDataTable
										data={filteredSubmissions}
										isAdmin={isAdmin}
										currentUserId={currentUserId}
										onApprove={handleApprove}
										onReject={handleReject}
										onTriggerWorkflow={handleTriggerWorkflow}
										onBulkTriggerWorkflow={handleBulkTriggerWorkflow}
										onBulkApprove={handleBulkApprove}
										isApproving={approveMutation.isPending}
										isRejecting={rejectMutation.isPending}
										isTriggeringWorkflow={workflowMutation.isPending}
										isBulkTriggeringWorkflow={bulkWorkflowMutation.isPending}
										isBulkApproving={bulkApproveMutation.isPending}
										workflowUrl={workflowUrl}
									/>
								)}
							</TabsContent>
						</Tabs>
					</div>
				</div>

				<ApproveDialog
					isMobile={isMobile}
					open={approveDialogOpen}
					onClose={() => { setApproveDialogOpen(false); setApprovingSubmissionId(null); setApproveAdminComment("") }}
					comment={approveAdminComment}
					onCommentChange={setApproveAdminComment}
					onSubmit={handleApproveSubmit}
					isPending={approveMutation.isPending}
				/>
				<RejectDialog
					isMobile={isMobile}
					open={rejectDialogOpen}
					onClose={() => { setRejectDialogOpen(false); setRejectingSubmissionId(null); setAdminComment("") }}
					comment={adminComment}
					onCommentChange={setAdminComment}
					onSubmit={handleRejectSubmit}
					isPending={rejectMutation.isPending}
				/>
				<BulkApproveDialog
					isMobile={isMobile}
					open={bulkApproveDialogOpen}
					onClose={() => { setBulkApproveDialogOpen(false); setBulkApprovingIds([]); setBulkApproveAdminComment("") }}
					count={bulkApprovingIds.length}
					comment={bulkApproveAdminComment}
					onCommentChange={setBulkApproveAdminComment}
					onSubmit={handleBulkApproveSubmit}
					isPending={bulkApproveMutation.isPending}
				/>
			</>
		)
	}

	// User view
	return (
		<>
			<div className="container mx-auto pt-6 sm:pt-10 pb-14 px-4 sm:px-6 lg:px-8">
				<div className="space-y-6">
					{/* Header */}
					<div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
						<div>
							<h1 className="text-xl sm:text-2xl font-semibold">My Submissions</h1>
							<p className="text-sm text-muted-foreground mt-1">
								Track the status of your icon submissions and view admin feedback.
							</p>
						</div>
						<Button variant="outline" size="sm" className="w-fit shrink-0" onClick={() => refetch()}>
							<RefreshCw className="h-3.5 w-3.5 mr-1.5" />
							Refresh
						</Button>
					</div>

					{/* User's own submissions - card view for better readability */}
					{userSubmissions.length > 0 ? (
						<div className="space-y-2">
							{userSubmissions.map((submission) => (
								<UserSubmissionCard
									key={submission.id}
									submission={submission}
									onExpand={() => {}}
								/>
							))}
						</div>
					) : null}

					{/* Full submissions table (shows all community submissions for visibility) */}
					<div className="space-y-3">
						{userSubmissions.length > 0 && (
							<h2 className="text-base font-medium text-muted-foreground">All Community Submissions</h2>
						)}
						{submissions.length === 0 ? (
							<EmptyTab
								icon={ImageIcon}
								title="No submissions yet"
								description="Submit your first icon to see it here."
							/>
						) : (
							<SubmissionsDataTable
								data={submissions}
								isAdmin={isAdmin}
								currentUserId={currentUserId}
								onApprove={handleApprove}
								onReject={handleReject}
								onTriggerWorkflow={handleTriggerWorkflow}
								onBulkTriggerWorkflow={handleBulkTriggerWorkflow}
								onBulkApprove={handleBulkApprove}
								isApproving={approveMutation.isPending}
								isRejecting={rejectMutation.isPending}
								isTriggeringWorkflow={workflowMutation.isPending}
								isBulkTriggeringWorkflow={bulkWorkflowMutation.isPending}
								isBulkApproving={bulkApproveMutation.isPending}
								workflowUrl={workflowUrl}
							/>
						)}
					</div>
				</div>
			</div>

			<ApproveDialog
				isMobile={isMobile}
				open={approveDialogOpen}
				onClose={() => { setApproveDialogOpen(false); setApprovingSubmissionId(null); setApproveAdminComment("") }}
				comment={approveAdminComment}
				onCommentChange={setApproveAdminComment}
				onSubmit={handleApproveSubmit}
				isPending={approveMutation.isPending}
			/>
			<RejectDialog
				isMobile={isMobile}
				open={rejectDialogOpen}
				onClose={() => { setRejectDialogOpen(false); setRejectingSubmissionId(null); setAdminComment("") }}
				comment={adminComment}
				onCommentChange={setAdminComment}
				onSubmit={handleRejectSubmit}
				isPending={rejectMutation.isPending}
			/>
			<BulkApproveDialog
				isMobile={isMobile}
				open={bulkApproveDialogOpen}
				onClose={() => { setBulkApproveDialogOpen(false); setBulkApprovingIds([]); setBulkApproveAdminComment("") }}
				count={bulkApprovingIds.length}
				comment={bulkApproveAdminComment}
				onCommentChange={setBulkApproveAdminComment}
				onSubmit={handleBulkApproveSubmit}
				isPending={bulkApproveMutation.isPending}
			/>
		</>
	)
}

// Extracted dialog components to reduce duplication

function EmptyTab({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
	return (
		<div className="py-16 flex flex-col items-center gap-2">
			<Icon className="h-10 w-10 text-muted-foreground/20" />
			<p className="text-sm font-medium text-muted-foreground">{title}</p>
			<p className="text-xs text-muted-foreground/70">{description}</p>
		</div>
	)
}

function ApproveDialog({ isMobile, open, onClose, comment, onCommentChange, onSubmit, isPending }: {
	isMobile: boolean
	open: boolean
	onClose: () => void
	comment: string
	onCommentChange: (v: string) => void
	onSubmit: () => void
	isPending: boolean
}) {
	if (isMobile) {
		return (
			<Drawer open={open} onOpenChange={(o) => !o && onClose()}>
				<DrawerContent>
					<DrawerHeader className="text-left">
						<DrawerTitle>Approve Submission</DrawerTitle>
						<DrawerDescription>Add an optional note for the submitter.</DrawerDescription>
					</DrawerHeader>
					<div className="px-4 pb-2 space-y-2">
						<Label htmlFor="approve-comment">Comment</Label>
						<Textarea id="approve-comment" placeholder="Optional note..." value={comment} onChange={(e) => onCommentChange(e.target.value)} rows={3} />
					</div>
					<DrawerFooter>
						<Button onClick={onSubmit} disabled={isPending}>{isPending ? "Approving..." : "Approve"}</Button>
						<DrawerClose asChild><Button variant="outline" disabled={isPending}>Cancel</Button></DrawerClose>
					</DrawerFooter>
				</DrawerContent>
			</Drawer>
		)
	}

	return (
		<Dialog open={open} onOpenChange={(o) => !o && onClose()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Approve Submission</DialogTitle>
					<DialogDescription>Add an optional note for the submitter.</DialogDescription>
				</DialogHeader>
				<div className="space-y-2 py-4">
					<Label htmlFor="approve-comment">Comment</Label>
					<Textarea id="approve-comment" placeholder="Optional note..." value={comment} onChange={(e) => onCommentChange(e.target.value)} rows={3} />
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
					<Button onClick={onSubmit} disabled={isPending}>{isPending ? "Approving..." : "Approve"}</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

function RejectDialog({ isMobile, open, onClose, comment, onCommentChange, onSubmit, isPending }: {
	isMobile: boolean
	open: boolean
	onClose: () => void
	comment: string
	onCommentChange: (v: string) => void
	onSubmit: () => void
	isPending: boolean
}) {
	if (isMobile) {
		return (
			<Drawer open={open} onOpenChange={(o) => !o && onClose()}>
				<DrawerContent>
					<DrawerHeader className="text-left">
						<DrawerTitle>Reject Submission</DrawerTitle>
						<DrawerDescription>Provide a reason. This will be visible to the submitter.</DrawerDescription>
					</DrawerHeader>
					<div className="px-4 pb-2 space-y-2">
						<Label htmlFor="reject-comment">Reason</Label>
						<Textarea id="reject-comment" placeholder="Why is this being rejected?" value={comment} onChange={(e) => onCommentChange(e.target.value)} rows={3} />
					</div>
					<DrawerFooter>
						<Button variant="destructive" onClick={onSubmit} disabled={isPending}>{isPending ? "Rejecting..." : "Reject"}</Button>
						<DrawerClose asChild><Button variant="outline" disabled={isPending}>Cancel</Button></DrawerClose>
					</DrawerFooter>
				</DrawerContent>
			</Drawer>
		)
	}

	return (
		<Dialog open={open} onOpenChange={(o) => !o && onClose()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Reject Submission</DialogTitle>
					<DialogDescription>Provide a reason. This will be visible to the submitter.</DialogDescription>
				</DialogHeader>
				<div className="space-y-2 py-4">
					<Label htmlFor="reject-comment">Reason</Label>
					<Textarea id="reject-comment" placeholder="Why is this being rejected?" value={comment} onChange={(e) => onCommentChange(e.target.value)} rows={3} />
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
					<Button variant="destructive" onClick={onSubmit} disabled={isPending}>{isPending ? "Rejecting..." : "Reject"}</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

function BulkApproveDialog({ isMobile, open, onClose, count, comment, onCommentChange, onSubmit, isPending }: {
	isMobile: boolean
	open: boolean
	onClose: () => void
	count: number
	comment: string
	onCommentChange: (v: string) => void
	onSubmit: () => void
	isPending: boolean
}) {
	const label = `Approve ${count} Submission${count > 1 ? "s" : ""}`

	if (isMobile) {
		return (
			<Drawer open={open} onOpenChange={(o) => !o && onClose()}>
				<DrawerContent>
					<DrawerHeader className="text-left">
						<DrawerTitle>{label}</DrawerTitle>
						<DrawerDescription>Add an optional note for the submitters.</DrawerDescription>
					</DrawerHeader>
					<div className="px-4 pb-2 space-y-2">
						<Label htmlFor="bulk-approve-comment">Comment</Label>
						<Textarea id="bulk-approve-comment" placeholder="Optional note..." value={comment} onChange={(e) => onCommentChange(e.target.value)} rows={3} />
					</div>
					<DrawerFooter>
						<Button onClick={onSubmit} disabled={isPending}>{isPending ? "Approving..." : label}</Button>
						<DrawerClose asChild><Button variant="outline" disabled={isPending}>Cancel</Button></DrawerClose>
					</DrawerFooter>
				</DrawerContent>
			</Drawer>
		)
	}

	return (
		<Dialog open={open} onOpenChange={(o) => !o && onClose()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{label}</DialogTitle>
					<DialogDescription>Add an optional note for the submitters.</DialogDescription>
				</DialogHeader>
				<div className="space-y-2 py-4">
					<Label htmlFor="bulk-approve-comment">Comment</Label>
					<Textarea id="bulk-approve-comment" placeholder="Optional note..." value={comment} onChange={(e) => onCommentChange(e.target.value)} rows={3} />
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
					<Button onClick={onSubmit} disabled={isPending}>{isPending ? "Approving..." : label}</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
