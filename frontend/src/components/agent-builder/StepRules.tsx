import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { GuardrailRule } from '../../lib/types'
import Button from '../shared/Button'
import Input from '../shared/Input'

interface Props {
  data: { guardrails: GuardrailRule[] }
  onChange: (data: Partial<Props['data']>) => void
}

type RuleType = 'keyword_escalate' | 'confidence_threshold' | 'cost_limit' | 'custom_instruction'

const RULE_TYPES: { type: RuleType; label: string; description: string }[] = [
  { type: 'keyword_escalate', label: 'Keyword Escalation', description: 'Escalate if certain keywords appear' },
  { type: 'confidence_threshold', label: 'Confidence Threshold', description: 'Escalate if AI confidence is too low' },
  { type: 'cost_limit', label: 'Cost Limit Per Run', description: 'Stop if cost exceeds a dollar limit' },
  { type: 'custom_instruction', label: 'Custom Instruction', description: 'Add a plain-English rule for the AI' },
]

function newRule(type: RuleType): GuardrailRule {
  const id = `rule_${Date.now()}`
  if (type === 'keyword_escalate') return { id, type, keywords: [], action: 'escalate' }
  if (type === 'confidence_threshold') return { id, type, threshold: 0.8, action: 'human_review' }
  if (type === 'cost_limit') return { id, type, max_usd: 0.1, action: 'stop_and_alert' }
  return { id, type, instruction: '' }
}

export default function StepRules({ data, onChange }: Props) {
  const [showPicker, setShowPicker] = useState(false)

  function addRule(type: RuleType) {
    onChange({ guardrails: [...data.guardrails, newRule(type)] })
    setShowPicker(false)
  }

  function removeRule(id: string) {
    onChange({ guardrails: data.guardrails.filter((r) => r.id !== id) })
  }

  function updateRule(id: string, patch: Partial<GuardrailRule>) {
    onChange({ guardrails: data.guardrails.map((r) => (r.id === id ? { ...r, ...patch } : r)) })
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Guardrail Rules</h2>
        <p className="text-sm text-gray-500">Set rules that control when the agent escalates or stops.</p>
      </div>

      <div className="space-y-3">
        {data.guardrails.map((rule) => (
          <div key={rule.id} className="p-4 bg-white border border-gray-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {RULE_TYPES.find((r) => r.type === rule.type)?.label}
              </span>
              <button onClick={() => removeRule(rule.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>

            {rule.type === 'keyword_escalate' && (
              <Input
                label="Keywords (comma-separated)"
                value={rule.keywords?.join(', ') || ''}
                onChange={(e) => updateRule(rule.id, { keywords: e.target.value.split(',').map((k) => k.trim()).filter(Boolean) })}
                placeholder="refund, cancel, legal, lawsuit"
              />
            )}

            {rule.type === 'confidence_threshold' && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Minimum Confidence: {Math.round((rule.threshold || 0.8) * 100)}%
                </label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={Math.round((rule.threshold || 0.8) * 100)}
                  onChange={(e) => updateRule(rule.id, { threshold: parseInt(e.target.value) / 100 })}
                  className="w-full accent-brand-500"
                />
              </div>
            )}

            {rule.type === 'cost_limit' && (
              <Input
                label="Maximum Cost Per Run (USD)"
                type="number"
                step="0.01"
                min="0.01"
                value={rule.max_usd || 0.1}
                onChange={(e) => updateRule(rule.id, { max_usd: parseFloat(e.target.value) })}
                placeholder="0.10"
              />
            )}

            {rule.type === 'custom_instruction' && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Instruction</label>
                <textarea
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  rows={2}
                  value={rule.instruction || ''}
                  onChange={(e) => updateRule(rule.id, { instruction: e.target.value })}
                  placeholder="Always reply in the same language the customer used"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {showPicker ? (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          {RULE_TYPES.map(({ type, label, description }) => (
            <button
              key={type}
              type="button"
              onClick={() => addRule(type)}
              className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 text-left border-b border-gray-100 last:border-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-500">{description}</p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <Button variant="secondary" onClick={() => setShowPicker(true)}>
          <Plus size={14} /> Add Rule
        </Button>
      )}
    </div>
  )
}
