import Input from '../shared/Input'

interface Props {
  data: { name: string; description: string; industry: string; system_prompt: string; ai_model: string }
  onChange: (data: Partial<Props['data']>) => void
}

const INDUSTRIES = ['ecommerce', 'saas', 'marketing', 'hr', 'other']

const MODEL_SUGGESTIONS = [
  { value: 'claude-3-7-sonnet-20250219', label: 'claude-3-7-sonnet-20250219 — Latest Sonnet (Recommended)' },
  { value: 'claude-3-5-haiku-20241022', label: 'claude-3-5-haiku-20241022 — Fast & cheap' },
  { value: 'claude-3-opus-20240229', label: 'claude-3-opus-20240229 — Most powerful (older)' },
]

export default function StepName({ data, onChange }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Agent Identity</h2>
        <p className="text-sm text-gray-500">Give your agent a name and describe what it should do.</p>
      </div>

      <Input
        label="Agent Name"
        required
        value={data.name}
        onChange={(e) => onChange({ name: e.target.value })}
        placeholder="e.g. Support Reply Agent"
      />

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          What does this agent do? <span className="text-red-500">*</span>
        </label>
        <textarea
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          rows={3}
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="e.g. Reads incoming support emails and replies using our FAQ knowledge base"
          required
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Industry</label>
        <select
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          value={data.industry}
          onChange={(e) => onChange({ industry: e.target.value })}
        >
          <option value="">Select industry</option>
          {INDUSTRIES.map((ind) => (
            <option key={ind} value={ind}>{ind.charAt(0).toUpperCase() + ind.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">AI Model</label>
        <input
          list="model-suggestions"
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          value={data.ai_model}
          onChange={(e) => onChange({ ai_model: e.target.value })}
          placeholder="e.g. claude-3-7-sonnet-20250219"
        />
        <datalist id="model-suggestions">
          {MODEL_SUGGESTIONS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </datalist>
        <p className="text-xs text-gray-400 mt-1">
          Type any model name from{' '}
          <a
            href="https://docs.anthropic.com/en/docs/about-claude/models"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-500 underline"
          >
            Anthropic's model list
          </a>
          , or pick a suggestion. Leave blank to use the platform default.
        </p>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Personality & Instructions</label>
        <textarea
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          rows={3}
          value={data.system_prompt}
          onChange={(e) => onChange({ system_prompt: e.target.value })}
          placeholder="e.g. Always reply in a friendly tone. Never mention competitors. Sign off with 'The Support Team'."
        />
      </div>
    </div>
  )
}
