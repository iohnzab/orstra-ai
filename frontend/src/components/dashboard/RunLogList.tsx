import type { TaskRun } from '../../lib/types'
import RunLog from './RunLog'
import EmptyState from '../shared/EmptyState'
import { Activity } from 'lucide-react'

export default function RunLogList({ runs }: { runs: TaskRun[] }) {
  if (!runs.length) {
    return <EmptyState icon={Activity} title="No runs yet" description="Runs will appear here once your agent processes something." />
  }
  return (
    <div className="space-y-2">
      {runs.map((run) => (
        <RunLog key={run.id} run={run} />
      ))}
    </div>
  )
}
