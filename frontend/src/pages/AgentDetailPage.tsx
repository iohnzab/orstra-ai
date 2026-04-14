import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { agentsApi, runsApi, documentsApi } from '../lib/api'
import AgentStatusBadge from '../components/dashboard/AgentStatusBadge'
import RunLogList from '../components/dashboard/RunLogList'
import Button from '../components/shared/Button'
import Modal from '../components/shared/Modal'
import EmptyState from '../components/shared/EmptyState'
import { Pencil, FileText, Upload, Trash2, History, RotateCcw, Copy, Check, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { useDropzone } from 'react-dropzone'

// ─── Test Panel ───────────────────────────────────────────────────────────────
function TestPanel({ agentId, onClose }: { agentId: string; onClose: () => void }) {
  const [input, setInput] = useState('{"from":"customer@example.com","subject":"Where is my order?","body":"Hi, I placed order #1234 three days ago and it still hasn\'t shipped. Can you help?"}')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<any>(null)

  async function run() {
    setRunning(true)
    setResult(null)
    try {
      const parsed = JSON.parse(input)
      const res = await agentsApi.test(agentId, parsed)
      setResult(res)
    } catch (e: any) {
      if (e.message?.includes('JSON')) {
        toast.error('Invalid JSON input')
      } else {
        toast.error('Test run failed')
      }
    } finally {
      setRunning(false)
    }
  }

  const confidence = result?.confidence
  const confColor = !confidence ? '' : confidence >= 0.8 ? 'text-green-600' : confidence >= 0.6 ? 'text-yellow-600' : 'text-red-600'

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Sample Input (JSON)</label>
        <textarea
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
          rows={5}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </div>
      <Button onClick={run} loading={running} className="w-full justify-center">
        {running ? 'Running test...' : 'Run Test'}
      </Button>

      {result && (
        <div className="space-y-3">
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
            This is a test run — no real emails, messages, or CRM updates were sent.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Intent</p>
              <p className="text-sm font-medium">{result.intent || '—'}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Confidence</p>
              <p className={clsx('text-sm font-semibold', confColor)}>
                {confidence ? `${Math.round(confidence * 100)}%` : '—'}
              </p>
            </div>
          </div>

          {result.tools_called?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Tools Called</p>
              <div className="space-y-1">
                {result.tools_called.map((t: any, i: number) => (
                  <div key={i} className="p-2 bg-white border border-gray-200 rounded-lg text-xs">
                    <span className="font-medium text-brand-600">{t.tool}</span>
                    <span className="text-gray-400 ml-2">({t.duration_ms}ms)</span>
                    <p className="text-gray-500 mt-0.5 truncate">{t.output?.slice(0, 120)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.output?.content && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Draft Output</p>
              <div className="p-3 bg-white border border-gray-200 rounded-lg text-sm whitespace-pre-wrap">
                {result.output.content}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Status: <strong>{result.status}</strong></span>
            <span>Est. cost: <strong>${result.cost_usd?.toFixed(4)}</strong></span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Documents Tab ────────────────────────────────────────────────────────────
function DocumentsTab({ agentId }: { agentId: string }) {
  const qc = useQueryClient()
  const { data: docs, isLoading } = useQuery({
    queryKey: ['documents', agentId],
    queryFn: () => documentsApi.list(agentId),
  })

  const [uploading, setUploading] = useState(false)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    multiple: false,
    onDrop: async ([file]) => {
      if (!file) return
      setUploading(true)
      try {
        await documentsApi.upload(agentId, file)
        toast.success(`${file.name} uploaded`)
        qc.invalidateQueries({ queryKey: ['documents', agentId] })
      } catch {
        toast.error('Upload failed')
      } finally {
        setUploading(false)
      }
    },
  })

  async function deleteDoc(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return
    try {
      await documentsApi.delete(id)
      toast.success('Document deleted')
      qc.invalidateQueries({ queryKey: ['documents', agentId] })
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={clsx(
          'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
          isDragActive ? 'border-brand-500 bg-brand-50' : 'border-gray-300 hover:border-gray-400'
        )}
      >
        <input {...getInputProps()} />
        <Upload size={24} className="mx-auto text-gray-400 mb-2" />
        <p className="text-sm font-medium text-gray-700">
          {uploading ? 'Uploading...' : isDragActive ? 'Drop file here' : 'Drop a file or click to upload'}
        </p>
        <p className="text-xs text-gray-400 mt-1">PDF, TXT, DOCX supported</p>
      </div>

      {isLoading ? (
        <div className="text-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-500 mx-auto" /></div>
      ) : !docs?.length ? (
        <EmptyState icon={FileText} title="No documents" description="Upload documents for the agent to search." />
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl">
              <FileText size={16} className="text-gray-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{doc.filename}</p>
                <p className="text-xs text-gray-400">{doc.chunk_count} chunks · {new Date(doc.created_at).toLocaleDateString()}</p>
              </div>
              <button onClick={() => deleteDoc(doc.id, doc.filename)} className="text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Webhook Tab ─────────────────────────────────────────────────────────────
function WebhookTab({ agentId, agentStatus }: { agentId: string; agentStatus: string }) {
  const [copied, setCopied] = useState(false)
  const API_URL = import.meta.env.VITE_API_URL || 'https://orstra-ai.onrender.com'
  const webhookUrl = `${API_URL}/webhooks/agent/${agentId}`

  function copy() {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const examplePayload = JSON.stringify({
    from: "customer@example.com",
    subject: "I need help",
    body: "Hi, I have a question about my order."
  }, null, 2)

  return (
    <div className="space-y-6">
      {agentStatus !== 'active' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-sm text-yellow-800 font-medium">Agent must be deployed (active) to receive webhook calls.</p>
          <p className="text-xs text-yellow-700 mt-1">Go to Edit → Deploy Agent to activate it.</p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-brand-500" />
          <h3 className="font-semibold text-gray-900">Your Webhook URL</h3>
        </div>
        <p className="text-sm text-gray-500">Send a POST request to this URL from Zapier, Make, Gmail, or any external tool to trigger this agent.</p>
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <code className="flex-1 text-xs text-gray-800 break-all">{webhookUrl}</code>
          <button onClick={copy} className="shrink-0 text-gray-400 hover:text-brand-500 transition-colors">
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          </button>
        </div>
        <p className="text-xs text-gray-400">Method: <strong>POST</strong> · Content-Type: <strong>application/json</strong></p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <h3 className="font-semibold text-gray-900">Example Payload</h3>
        <p className="text-sm text-gray-500">Send any JSON data — the agent will read it as the trigger input.</p>
        <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-800 overflow-auto">{examplePayload}</pre>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <p className="text-sm font-semibold text-blue-900 mb-1">💡 Use Email trigger instead for Gmail</p>
        <p className="text-sm text-blue-800">
          Go to <strong>Edit Agent → Step 2 → Email trigger</strong> and Orstra will automatically watch your inbox
          every 2 minutes — no external tools needed. The webhook URL above is for custom integrations.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <h3 className="font-semibold text-gray-900">Test with cURL</h3>
        <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-800 overflow-auto whitespace-pre-wrap">{`curl -X POST ${webhookUrl} \\
  -H "Content-Type: application/json" \\
  -d '{"from":"test@example.com","subject":"Test","body":"Hello"}'`}</pre>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [activeTab, setActiveTab] = useState<'activity' | 'documents' | 'webhook'>('activity')
  const [testOpen, setTestOpen] = useState(false)
  const [versionsOpen, setVersionsOpen] = useState(false)

  const { data: agent, isLoading: agentLoading } = useQuery({
    queryKey: ['agent', id],
    queryFn: () => agentsApi.get(id!),
  })

  const { data: runs, isLoading: runsLoading } = useQuery({
    queryKey: ['runs', id],
    queryFn: () => runsApi.listForAgent(id!),
    enabled: activeTab === 'activity',
    refetchInterval: 15_000,
  })

  const { data: versions } = useQuery({
    queryKey: ['versions', id],
    queryFn: () => agentsApi.versions(id!),
    enabled: versionsOpen,
  })

  async function restoreVersion(version: number) {
    try {
      await agentsApi.restoreVersion(id!, version)
      toast.success(`Restored to version ${version}`)
      qc.invalidateQueries({ queryKey: ['agent', id] })
      setVersionsOpen(false)
    } catch {
      toast.error('Failed to restore version')
    }
  }

  if (agentLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" /></div>
  }
  if (!agent) return <p className="text-center text-gray-500 mt-16">Agent not found</p>

  const TABS = ['activity', 'documents', 'webhook'] as const

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{agent.name}</h1>
            <AgentStatusBadge status={agent.status} />
            <span className="text-xs text-gray-400">v{agent.version}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{agent.description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" variant="secondary" onClick={() => setVersionsOpen(true)}>
            <History size={14} /> History
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setTestOpen(true)}>
            Test Run
          </Button>
          <Button size="sm" onClick={() => navigate(`/agents/${id}/edit`)}>
            <Pencil size={14} /> Edit
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              'px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px',
              activeTab === tab ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'activity' && (
        <div>
          {runsLoading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-500" /></div>
          ) : (
            <RunLogList runs={runs || []} />
          )}
        </div>
      )}

      {activeTab === 'documents' && <DocumentsTab agentId={id!} />}
      {activeTab === 'webhook' && <WebhookTab agentId={id!} agentStatus={agent.status} />}

      {/* Test run modal */}
      <Modal open={testOpen} onClose={() => setTestOpen(false)} title="Test Agent" size="lg">
        <TestPanel agentId={id!} onClose={() => setTestOpen(false)} />
      </Modal>

      {/* Version history modal */}
      <Modal open={versionsOpen} onClose={() => setVersionsOpen(false)} title="Version History" size="md">
        <div className="space-y-2">
          {!versions?.length ? (
            <p className="text-sm text-gray-500 text-center py-8">No saved versions yet</p>
          ) : (
            versions.map((v) => (
              <div key={v.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Version {v.version}</p>
                  <p className="text-xs text-gray-400">{new Date(v.created_at).toLocaleString()}</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => restoreVersion(v.version)}>
                  <RotateCcw size={12} /> Restore
                </Button>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  )
}
