import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { agentsApi } from '../lib/api'
import type { Agent } from '../lib/types'
import Button from '../components/shared/Button'
import StepName from '../components/agent-builder/StepName'
import StepTrigger from '../components/agent-builder/StepTrigger'
import StepTools from '../components/agent-builder/StepTools'
import StepRules from '../components/agent-builder/StepRules'
import StepReview from '../components/agent-builder/StepReview'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const STEPS = ['Identity', 'Trigger', 'Tools', 'Rules', 'Review']

const INITIAL: Partial<Agent> = {
  name: '',
  description: '',
  industry: '',
  system_prompt: '',
  ai_model: '',
  trigger_type: '',
  trigger_config: {},
  tools_enabled: [],
  guardrails: [],
}

export default function AgentBuilderPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const isEdit = !!id

  const [step, setStep] = useState(1)
  const [data, setData] = useState<Partial<Agent>>(INITIAL)
  const [saving, setSaving] = useState(false)
  const [initialized, setInitialized] = useState(false)

  const { data: existing } = useQuery({
    queryKey: ['agent', id],
    queryFn: () => agentsApi.get(id!),
    enabled: isEdit,
    staleTime: Infinity, // don't refetch while editing — it would reset form changes
  })

  useEffect(() => {
    if (existing && !initialized) {
      setData(existing)
      setInitialized(true)
    }
  }, [existing, initialized])

  function patch(partial: Partial<Agent>) {
    setData((prev) => ({ ...prev, ...partial }))
  }

  async function save(deploy = false) {
    if (!data.name?.trim()) {
      toast.error('Agent name is required')
      setStep(1)
      return
    }
    setSaving(true)
    try {
      let agent: Agent
      if (isEdit) {
        agent = await agentsApi.update(id!, data)
      } else {
        agent = await agentsApi.create(data)
      }
      if (deploy) {
        await agentsApi.deploy(agent.id)
        toast.success('Agent deployed!')
      } else {
        toast.success(isEdit ? 'Agent saved' : 'Agent created as draft')
      }
      qc.invalidateQueries({ queryKey: ['agents'] })
      navigate(`/agents/${agent.id}`)
    } catch {
      toast.error('Failed to save agent')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Agent' : 'Create Agent'}</h1>
        <p className="text-sm text-gray-500 mt-1">Step {step} of {STEPS.length}</p>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => {
          const n = i + 1
          const active = n === step
          const done = n < step
          return (
            <button
              key={label}
              onClick={() => setStep(n)}
              className={clsx(
                'flex-1 text-xs py-2 rounded-lg font-medium transition-colors',
                active ? 'bg-brand-500 text-white' : done ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-400'
              )}
            >
              {n}. {label}
            </button>
          )
        })}
      </div>

      {/* Step content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        {step === 1 && (
          <StepName
            data={{ name: data.name || '', description: data.description || '', industry: data.industry || '', system_prompt: data.system_prompt || '', ai_model: data.ai_model || '' }}
            onChange={patch}
          />
        )}
        {step === 2 && (
          <StepTrigger
            data={{ trigger_type: data.trigger_type || '', trigger_config: (data.trigger_config as Record<string, string>) || {} }}
            onChange={patch}
          />
        )}
        {step === 3 && (
          <StepTools
            data={{ tools_enabled: data.tools_enabled || [] }}
            onChange={patch}
          />
        )}
        {step === 4 && (
          <StepRules
            data={{ guardrails: data.guardrails || [] }}
            onChange={patch}
          />
        )}
        {step === 5 && <StepReview data={data} />}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          onClick={() => (step > 1 ? setStep(step - 1) : navigate('/agents'))}
        >
          {step === 1 ? 'Cancel' : '← Back'}
        </Button>

        <div className="flex gap-2">
          {step < 5 ? (
            <Button onClick={() => setStep(step + 1)}>Next →</Button>
          ) : (
            <>
              <Button variant="secondary" loading={saving} onClick={() => save(false)}>
                Save as Draft
              </Button>
              <Button loading={saving} onClick={() => save(true)}>
                Deploy Agent
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
