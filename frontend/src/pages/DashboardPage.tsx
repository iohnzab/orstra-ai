import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { dashboardApi, agentsApi } from '../lib/api'
import StatCard from '../components/dashboard/StatCard'
import AgentStatusBadge from '../components/dashboard/AgentStatusBadge'
import Badge from '../components/shared/Badge'
import Button from '../components/shared/Button'
import { Bot, Activity, DollarSign, TrendingUp, PauseCircle, PlayCircle, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'

function confidenceVariant(c?: number): 'green' | 'yellow' | 'red' | 'gray' {
  if (!c) return 'gray'
  if (c >= 0.8) return 'green'
  if (c >= 0.6) return 'yellow'
  return 'red'
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.stats,
    refetchInterval: 30_000,
  })

  const { data: agents } = useQuery({
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
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
    } catch {
      toast.error('Failed to update agent')
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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Button onClick={() => navigate('/agents/new')}>
          <Plus size={16} /> New Agent
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Agents" value={stats?.total_agents ?? 0} icon={Bot} color="blue" />
        <StatCard label="Runs Today" value={stats?.runs_today ?? 0} icon={Activity} color="purple" />
        <StatCard
          label="Success Rate"
          value={`${stats?.success_rate ?? 0}%`}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          label="Cost This Month"
          value={`$${stats?.total_cost_this_month?.toFixed(2) ?? '0.00'}`}
          icon={DollarSign}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="overflow-x-auto">
            {!stats?.recent_runs?.length ? (
              <p className="text-sm text-gray-500 text-center py-12">No runs yet</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Agent</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Confidence</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Cost</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_runs.map((run) => (
                    <tr
                      key={run.id}
                      className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/agents/${run.agent_id}`)}
                    >
                      <td className="px-5 py-3 font-medium text-gray-900 truncate max-w-[160px]">
                        {run.agent_name || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <AgentStatusBadge status={run.status} />
                      </td>
                      <td className="px-4 py-3">
                        {run.confidence ? (
                          <Badge variant={confidenceVariant(run.confidence)}>
                            {Math.round(run.confidence * 100)}%
                          </Badge>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500">${run.cost_usd?.toFixed(4)}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(run.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Active Agents sidebar */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Agents</h2>
          </div>
          <div className="p-4 space-y-3">
            {!agents?.length ? (
              <p className="text-sm text-gray-500 text-center py-8">No agents yet</p>
            ) : (
              agents.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200">
                  <div className="min-w-0 flex-1" onClick={() => navigate(`/agents/${agent.id}`)} role="button">
                    <p className="text-sm font-medium text-gray-900 truncate">{agent.name}</p>
                    <AgentStatusBadge status={agent.status} />
                  </div>
                  <button
                    onClick={() => toggleAgent(agent.id, agent.status)}
                    className="ml-2 text-gray-400 hover:text-gray-700 transition-colors"
                    title={agent.status === 'active' ? 'Pause' : 'Activate'}
                  >
                    {agent.status === 'active' ? <PauseCircle size={18} /> : <PlayCircle size={18} />}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
