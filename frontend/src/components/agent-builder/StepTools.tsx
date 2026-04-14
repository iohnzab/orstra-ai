import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toolsApi, connectorsApi } from '../../lib/api'
import Toggle from '../shared/Toggle'
import Button from '../shared/Button'
import { FileText, Globe, ShoppingBag, Package, Mail, MessageSquare, Users, Code, ExternalLink } from 'lucide-react'

const ICON_MAP: Record<string, React.ReactNode> = {
  FileText: <FileText size={16} />,
  Globe: <Globe size={16} />,
  ShoppingBag: <ShoppingBag size={16} />,
  Package: <Package size={16} />,
  Mail: <Mail size={16} />,
  MessageSquare: <MessageSquare size={16} />,
  Users: <Users size={16} />,
  Code: <Code size={16} />,
}

interface Props {
  data: { tools_enabled: string[] }
  onChange: (data: Partial<Props['data']>) => void
}

export default function StepTools({ data, onChange }: Props) {
  const navigate = useNavigate()
  const { data: tools } = useQuery({ queryKey: ['tools'], queryFn: toolsApi.list })
  const { data: connectors } = useQuery({ queryKey: ['connectors'], queryFn: connectorsApi.list })

  const connectedServices = new Set(connectors?.map((c) => c.service) || [])

  function toggle(name: string) {
    const enabled = data.tools_enabled.includes(name)
    onChange({
      tools_enabled: enabled
        ? data.tools_enabled.filter((t) => t !== name)
        : [...data.tools_enabled, name],
    })
  }

  const categories = [...new Set(tools?.map((t) => t.category) || [])]

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Enable Tools</h2>
        <p className="text-sm text-gray-500">Choose what capabilities this agent has.</p>
      </div>

      {categories.map((cat) => (
        <div key={cat}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{cat}</p>
          <div className="space-y-2">
            {tools?.filter((t) => t.category === cat).map((tool) => {
              const needsConnector = tool.requires_connector
              const isConnected = !needsConnector || connectedServices.has(needsConnector)
              const isEnabled = data.tools_enabled.includes(tool.name)

              return (
                <div key={tool.name} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 shrink-0">
                    {ICON_MAP[tool.icon] || <Code size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{tool.name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</p>
                    <p className="text-xs text-gray-500 truncate">{tool.description}</p>
                  </div>
                  {needsConnector && !isConnected ? (
                    <Button size="sm" variant="secondary" onClick={() => navigate('/connectors')}>
                      <ExternalLink size={12} /> Connect
                    </Button>
                  ) : (
                    <Toggle checked={isEnabled} onChange={() => toggle(tool.name)} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
