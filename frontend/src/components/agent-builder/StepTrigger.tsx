import Input from '../shared/Input'
import clsx from 'clsx'
import { Mail, Clock, Webhook } from 'lucide-react'

interface Props {
  data: { trigger_type: string; trigger_config: Record<string, string> }
  onChange: (data: Partial<Props['data']>) => void
}

const TRIGGERS = [
  { type: 'email', icon: Mail, label: 'New Email', description: 'Orstra watches your Gmail inbox and fires this agent when a new email arrives — no Zapier needed' },
  { type: 'schedule', icon: Clock, label: 'Schedule', description: 'Runs automatically on a timer (every hour, daily, weekly, etc.)' },
  { type: 'webhook', icon: Webhook, label: 'Webhook', description: 'Any external tool can POST to a URL to trigger this agent' },
]

const CRON_PRESETS = [
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Every day at 9am', value: '0 9 * * *' },
  { label: 'Every Monday at 9am', value: '0 9 * * 1' },
  { label: 'Every weekday at 8am', value: '0 8 * * 1-5' },
]

export default function StepTrigger({ data, onChange }: Props) {
  const setConfig = (key: string, value: string) =>
    onChange({ trigger_config: { ...data.trigger_config, [key]: value } })

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Choose a Trigger</h2>
        <p className="text-sm text-gray-500">What starts this agent running?</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {TRIGGERS.map(({ type, icon: Icon, label, description }) => (
          <button
            key={type}
            type="button"
            onClick={() => onChange({ trigger_type: type })}
            className={clsx(
              'flex items-center gap-4 p-4 border-2 rounded-xl text-left transition-colors',
              data.trigger_type === type
                ? 'border-brand-500 bg-brand-50'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center',
              data.trigger_type === type ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-500'
            )}>
              <Icon size={18} />
            </div>
            <div>
              <p className="font-medium text-gray-900">{label}</p>
              <p className="text-sm text-gray-500">{description}</p>
            </div>
          </button>
        ))}
      </div>

      {data.trigger_type === 'email' && (
        <div className="space-y-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-start gap-2 mb-1">
            <span className="text-blue-600 text-lg">⚡</span>
            <p className="text-sm text-blue-800 font-medium">
              Orstra will check your Gmail inbox every 2 minutes and automatically run this agent on new emails.
              Make sure your Gmail is connected in <strong>Connectors</strong>.
            </p>
          </div>
          <Input
            label="Gmail inbox to watch"
            type="email"
            value={data.trigger_config.inbox || ''}
            onChange={(e) => setConfig('inbox', e.target.value)}
            placeholder="support@yourcompany.com"
            hint="Must match the Gmail account connected in Connectors"
          />
          <Input
            label="Filter by subject keywords (optional)"
            value={data.trigger_config.subject_keywords || ''}
            onChange={(e) => setConfig('subject_keywords', e.target.value)}
            placeholder="e.g. order, refund, help"
            hint="Comma-separated. Leave blank to trigger on ALL incoming emails."
          />
        </div>
      )}

      {data.trigger_type === 'schedule' && (
        <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Schedule Preset</label>
            <div className="grid grid-cols-2 gap-2">
              {CRON_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setConfig('cron', preset.value)}
                  className={clsx(
                    'px-3 py-2 text-xs rounded-lg border transition-colors',
                    data.trigger_config.cron === preset.value
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          <Input
            label="Custom Cron Expression"
            value={data.trigger_config.cron || ''}
            onChange={(e) => setConfig('cron', e.target.value)}
            placeholder="0 9 * * 1"
            hint="Standard cron format: minute hour day month weekday"
          />
        </div>
      )}

      {data.trigger_type === 'webhook' && (
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-2">Your Webhook URL</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-600">
              https://your-api.orstra.ai/webhooks/agent/{'{agent-id}'}
            </code>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Send a POST request to this URL with your payload as JSON to trigger the agent.
          </p>
        </div>
      )}
    </div>
  )
}
