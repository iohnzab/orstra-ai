import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { agentsApi } from '../lib/api'
import AgentStatusBadge from '../components/dashboard/AgentStatusBadge'
import Button from '../components/shared/Button'
import EmptyState from '../components/shared/EmptyState'
import { Bot, Plus, Pencil, PauseCircle, PlayCircle, BarChart2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AgentsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: agents, isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: agentsApi.list,
  })

  async function toggleAgent(id: string, status: string) {
    try {
      if (status === 'active') {
        await agentsApi.pause(id)
        toast.success('Agent paused')
      } else {
        await agentsApi.deploy(id)
        toast.success('Agent activated')
      }
      qc.invalidateQueries({ queryKey: ['agents'] })
    } catch {
      toast.error('Failed to update agent')
    }
  }

  async function deleteAgent(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    try {
      await agentsApi.delete(id)
      toast.success('Agent deleted')
      qc.invalidateQueries({ queryKey: ['agents'] })
    } catch {
      toast.error('Failed to delete agent')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
        <Button onClick={() => navigate('/agents/new')}>
          <Plus size={16} /> New Agent
        </Button>
      </div>

      {!agents?.length ? (
        <EmptyState
          icon={Bot}
          title="No agents yet"
          description="Create your first AI agent to start automating workflows."
          action={
            <Button onClick={() => navigate('/agents/new')}>
              <Plus size={16} /> Create Agent
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <div key={agent.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{agent.name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{agent.description}</p>
                </div>
                <AgentStatusBadge status={agent.status} />
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="capitalize">{agent.trigger_type || 'No trigger'}</span>
                <span>·</span>
                <span>{agent.tools_enabled?.length || 0} tools</span>
                <span>·</span>
                <span>v{agent.version}</span>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                <Button size="sm" variant="ghost" onClick={() => navigate(`/agents/${agent.id}`)}>
                  <BarChart2 size={13} /> Logs
                </Button>
                <Button size="sm" variant="ghost" onClick={() => navigate(`/agents/${agent.id}/edit`)}>
                  <Pencil size={13} /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleAgent(agent.id, agent.status)}
                >
                  {agent.status === 'active' ? <PauseCircle size={13} /> : <PlayCircle size={13} />}
                  {agent.status === 'active' ? 'Pause' : 'Activate'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-auto text-red-400 hover:text-red-600"
                  onClick={() => deleteAgent(agent.id, agent.name)}
                >
                  <Trash2 size={13} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
