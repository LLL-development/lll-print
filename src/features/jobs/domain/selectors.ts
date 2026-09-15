import type { DeliveryStatus, JobStatus, JobView, Stage } from './types'

export function getActiveJobs(jobs: JobView[]): JobView[] {
  return jobs.filter((j) => j.status === 'pending' || j.status === 'in_production' || j.status === 'ready_for_delivery')
}

export function getReadyJobs(jobs: JobView[]): JobView[] {
  return jobs.filter((j) => j.status === 'ready_for_delivery')
}

export function getDeliveredJobs(jobs: JobView[]): JobView[] {
  return jobs.filter((j) => j.status === 'delivered')
}

export function getCancelledJobs(jobs: JobView[]): JobView[] {
  return jobs.filter((j) => j.status === 'cancelled')
}

export function countJobsByStage(jobs: JobView[]): Record<Stage, number> {
  const counts: Record<Stage, number> = {
    preparation: 0,
    production: 0,
    quality_check: 0,
    packing: 0,
  }

  for (const j of jobs) {
    if (j.status === 'in_production' || j.status === 'pending') {
      if (counts[j.stage] !== undefined) {
        counts[j.stage]++
      }
    }
  }

  return counts
}

export function filterJobs(
  jobs: JobView[],
  query: string,
  statusFilter: 'All' | JobStatus = 'All',
  stageFilter: 'All' | Stage = 'All',
): JobView[] {
  const q = query.trim().toLowerCase()

  return jobs.filter((job) => {
    if (statusFilter !== 'All' && job.status !== statusFilter) {
      return false
    }
    if (stageFilter !== 'All' && job.stage !== stageFilter) {
      return false
    }
    if (!q) {
      return true
    }

    const matchesId = job.id.toLowerCase().includes(q)
    const matchesNumber = job.number.toLowerCase().includes(q)
    const matchesCustomer = job.customer?.displayName.toLowerCase().includes(q) ?? false
    const matchesLines = job.lines.some((l) => l.description.toLowerCase().includes(q))

    return matchesId || matchesNumber || matchesCustomer || matchesLines
  })
}

export function formatJobStatusLabel(status: JobStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending'
    case 'in_production':
      return 'In Production'
    case 'ready_for_delivery':
      return 'Ready for Delivery'
    case 'delivered':
      return 'Delivered'
    case 'cancelled':
      return 'Cancelled'
    default:
      return status
  }
}

export function formatStageLabel(stage: Stage): string {
  switch (stage) {
    case 'preparation':
      return 'Preparation'
    case 'production':
      return 'Production'
    case 'quality_check':
      return 'Quality Check'
    case 'packing':
      return 'Packing'
    default:
      return stage
  }
}

export function formatDeliveryLabel(status: DeliveryStatus): string {
  switch (status) {
    case 'not_ready':
      return 'Not Ready'
    case 'ready':
      return 'Ready'
    case 'delivered':
      return 'Delivered'
    case 'not_applicable':
      return 'Not applicable'
    default:
      return status
  }
}
