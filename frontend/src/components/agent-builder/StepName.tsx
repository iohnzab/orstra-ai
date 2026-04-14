import Input from '../shared/Input'

interface Props {
  data: { name: string; description: string; industry: string; system_prompt: string; ai_model: string }
  onChange: (data: Partial<Props['data']>) => void
}

const INDUSTRIES = ['ecommerce', 'saas', 'marketing', 'hr', 'other']

const AI_MODELS = [
  { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku — Fast & affordable (Recommended)' },
  { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet — Smarter & more capable' },
  { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus — Most powerful' },
  { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku — Fastest & cheapest' },
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
            <option key={ind} value={ind} className="capitalize">{ind.charAt(0).toUpperCase() + ind.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">AI Model</label>
        <select
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          value={data.ai_model}
          onChange={(e) => onChange({ ai_model: e.target.value })}
        >
          <option value="">Use default model</option>
          {AI_MODELS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <p className="text-xs text-gray-400 mt-1">Choose the Claude model this agent will use. Haiku is faster and cheaper; Sonnet/Opus are smarter.</p>
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
