import type { Agent } from '../../lib/types'
import Badge from '../shared/Badge'

interface Props {
  data: Partial<Agent>
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-4 py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 w-36 shrink-0">{label}</span>
      <span className="text-sm text-gray-900">{value || <span className="text-gray-400">Not set</span>}</span>
    </div>
  )
}

export default function StepReview({ data }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Review & Deploy</h2>
        <p className="text-sm text-gray-500">Check your configuration before deploying.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Identity</p>
        <Row label="Name" value={data.name} />
        <Row label="Description" value={data.description} />
        <Row label="Industry" value={data.industry} />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Trigger</p>
        <Row label="Type" value={data.trigger_type} />
        <Row
          label="Config"
          value={
            <pre className="text-xs bg-gray-50 rounded p-2 overflow-auto">
              {JSON.stringify(data.trigger_config, null, 2)}
            </pre>
          }
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Tools</p>
        <div className="flex flex-wrap gap-2 py-2">
          {data.tools_enabled?.length
            ? data.tools_enabled.map((t) => <Badge key={t} variant="blue">{t}</Badge>)
            : <span className="text-sm text-gray-400">No tools enabled</span>}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Guardrails ({data.guardrails?.length || 0})
        </p>
        {data.guardrails?.length ? (
          <div className="space-y-1">
            {data.guardrails.map((r) => (
              <p key={r.id} className="text-sm text-gray-700">
                • <span className="font-medium">{r.type}</span>:{' '}
                {r.type === 'keyword_escalate' && `Escalate on: ${r.keywords?.join(', ')}`}
                {r.type === 'confidence_threshold' && `Min confidence: ${Math.round((r.threshold || 0) * 100)}%`}
                {r.type === 'cost_limit' && `Max cost: $${r.max_usd}`}
                {r.type === 'custom_instruction' && r.instruction}
              </p>
            ))}
          </div>
        ) : (
          <span className="text-sm text-gray-400">No rules configured</span>
        )}
      </div>
    </div>
  )
}
