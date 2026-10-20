import { formatJobStatusLabel } from '../../features/jobs/domain/selectors'
import type { JobStatus } from '../../features/jobs/domain/types'

export default function Status({ value }: { value: JobStatus | string }) {
  const normalizedClass = value.toLowerCase().replace(/[\s_]+/g, '-')
  let label = value

  if (['pending', 'in_production', 'ready_for_delivery', 'delivered', 'cancelled'].includes(value)) {
    label = formatJobStatusLabel(value as JobStatus)
  }

  return <span className={`status status-${normalizedClass}`}>{label}</span>
}
