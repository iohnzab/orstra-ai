import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { TaskRun } from '../../lib/types'
import Badge from '../shared/Badge'
import clsx from 'clsx'

function statusVariant(s: string): 'green' | 'red' | 'yellow' | 'blue' | 'gray' {
  if (s === 'completed') return 'green'
  if (s === 'failed') return 'red'
  if (s === 'escalated') return 'yellow'
  if (s === 'running') return 'blue'
  return 'gray'
}

function confidenceColor(c?: number) {
  if (!c) return 'text-gray-400'
  if (c >= 0.8) return 'text-green-600'
  if (c >= 0.6) return 'text-yellow-600'
  return 'text-red-600'
}

export default function RunLog({ run }: { run: TaskRun }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <Badge variant={statusVariant(run.status)}>{run.status}</Badge>
        <span className="flex-1 text-sm text-gray-700 truncate">{run.intent || 'No intent classified'}</span>
        {run.confidence && (
          <span className={clsx('text-xs font-medium', confidenceColor(run.confidence))}>
            {Math.round(run.confidence * 100)}%
          </span>
        )}
        <span className="text-xs text-gray-400">${run.cost_usd?.toFixed(4)}</span>
        <span className="text-xs text-gray-400 ml-2">
          {new Date(run.created_at).toLocaleString()}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-3">
          {run.trigger_data && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Trigger Input</p>
              <pre className="text-xs bg-white border border-gray-200 rounded p-2 overflow-auto max-h-32">
                {JSON.stringify(run.trigger_data, null, 2)}
              </pre>
            </div>
          )}
          {run.tools_called?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tools Called</p>
              <div className="space-y-2">
                {run.tools_called.map((t, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded p-2">
                    <p className="text-xs font-medium text-brand-600 mb-1">{t.tool} ({t.duration_ms}ms)</p>
                    <p className="text-xs text-gray-500">→ {String(t.output).slice(0, 200)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {run.output?.content != null && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Output</p>
              <p className="text-xs bg-white border border-gray-200 rounded p-2">{String(run.output.content)}</p>
            </div>
          )}
          {run.escalation_reason && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
              <p className="text-xs text-yellow-800"><strong>Escalated:</strong> {run.escalation_reason}</p>
            </div>
          )}
          {run.error && (
            <div className="bg-red-50 border border-red-200 rounded p-2">
              <p className="text-xs text-red-800"><strong>Error:</strong> {run.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
