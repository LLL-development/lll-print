import { useNavigate } from 'react-router-dom'
import Heading from '../components/ui/Heading'
import { useSyntheticStore } from '../context/useSyntheticStore'
import JobBoard from '../features/jobs/components/JobBoard'
import { getActiveJobs, getDeliveredJobs, getReadyJobs } from '../features/jobs/domain/selectors'

export default function JobsView() {
  const navigate = useNavigate()
  const { state, openModal } = useSyntheticStore()
  const { jobs } = state

  const activeJobs = getActiveJobs(jobs)
  const readyJobs = getReadyJobs(jobs)
  const deliveredJobs = getDeliveredJobs(jobs)

  return (
    <div className="jobs-view">
      <Heading
        eyebrow="Production Floor"
        title="Print jobs"
        text="Plan, track, and complete every customer order."
      />

      <div className="jobs-summary-strip">
        <div className="jobs-summary-pill">
          <span className="summary-pill-label">Total Floor Queue:</span>
          <b>{jobs.length} jobs</b>
        </div>
        <div className="jobs-summary-pill">
          <span className="summary-pill-label">Active on Floor:</span>
          <b>{activeJobs.length} active</b>
        </div>
        <div className="jobs-summary-pill">
          <span className="summary-pill-label">Packing Complete:</span>
          <b>{readyJobs.length} ready</b>
        </div>
        <div className="jobs-summary-pill">
          <span className="summary-pill-label">Delivered:</span>
          <b>{deliveredJobs.length} completed</b>
        </div>
      </div>

      <section className="panel jobs-board-panel">
        <JobBoard
          jobs={jobs}
          onSelectJob={(job) => openModal('jobDetail', job)}
          onNavigateToQuotations={() => navigate('/quotations')}
        />
      </section>
    </div>
  )
}
