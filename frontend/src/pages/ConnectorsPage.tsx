import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { connectorsApi } from '../lib/api'
import type { Connector } from '../lib/types'
import Button from '../components/shared/Button'
import Input from '../components/shared/Input'
import Modal from '../components/shared/Modal'
import Badge from '../components/shared/Badge'
import { Trash2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const SERVICES = [
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Send and receive emails',
    fields: [
      { name: 'smtp_user', label: 'Gmail Address', type: 'email', required: true },
      { name: 'smtp_password', label: 'App Password', type: 'password', required: true, hint: 'Generate in Google Account → Security → App Passwords' },
    ],
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Access products and orders',
    fields: [
      { name: 'shop_url', label: 'Store URL', type: 'text', required: true, placeholder: 'mystore.myshopify.com' },
      { name: 'admin_api_key', label: 'Admin API Key', type: 'password', required: true },
    ],
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Post messages to channels',
    fields: [
      { name: 'bot_token', label: 'Bot Token', type: 'password', required: true, placeholder: 'xoxb-...' },
      { name: 'default_channel', label: 'Default Channel', type: 'text', required: false, placeholder: '#general' },
    ],
  },
  {
    id: 'supabase',
    name: 'Supabase',
    description: 'Query your Supabase database',
    fields: [
      { name: 'project_url', label: 'Project URL', type: 'text', required: true, placeholder: 'https://xxx.supabase.co' },
      { name: 'api_key', label: 'Service Role Key', type: 'password', required: true },
    ],
  },
]

interface ConnectModalProps {
  service: (typeof SERVICES)[0]
  onClose: () => void
  onSaved: () => void
}

function ConnectModal({ service, onClose, onSaved }: ConnectModalProps) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await connectorsApi.create({
        service: service.id,
        display_name: `${service.name} (${values[service.fields[0]?.name] || 'default'})`,
        credentials: values,
      })
      toast.success(`${service.name} connected`)
      onSaved()
      onClose()
    } catch {
      toast.error('Failed to save connector')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {service.fields.map((field) => (
        <Input
          key={field.name}
          label={field.label}
          type={field.type as any}
          required={field.required}
          placeholder={(field as any).placeholder}
          hint={(field as any).hint}
          value={values[field.name] || ''}
          onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
        />
      ))}
      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={saving}>Save Connection</Button>
      </div>
    </form>
  )
}

export default function ConnectorsPage() {
  const qc = useQueryClient()
  const { data: connectors } = useQuery({ queryKey: ['connectors'], queryFn: connectorsApi.list })
  const [modalService, setModalService] = useState<(typeof SERVICES)[0] | null>(null)
  const [verifying, setVerifying] = useState<string | null>(null)

  function getConnector(serviceId: string): Connector | undefined {
    return connectors?.find((c) => c.service === serviceId)
  }

  async function verify(connector: Connector) {
    setVerifying(connector.id)
    try {
      const res = await connectorsApi.verify(connector.id)
      if (res.verified) toast.success('Connection verified!')
      else toast.error(`Verification failed: ${res.error || 'Check credentials'}`)
    } catch {
      toast.error('Verification failed')
    } finally {
      setVerifying(null)
    }
  }

  async function remove(connector: Connector) {
    if (!confirm(`Disconnect ${connector.service}?`)) return
    try {
      await connectorsApi.delete(connector.id)
      toast.success('Connector removed')
      qc.invalidateQueries({ queryKey: ['connectors'] })
    } catch {
      toast.error('Failed to remove')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Connectors</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SERVICES.map((service) => {
          const connector = getConnector(service.id)
          const isConnected = !!connector

          return (
            <div key={service.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{service.name}</h3>
                  <p className="text-sm text-gray-500">{service.description}</p>
                </div>
                {isConnected ? (
                  <Badge variant="green">Connected</Badge>
                ) : (
                  <Badge variant="gray">Not Connected</Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isConnected ? (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={verifying === connector.id}
                      onClick={() => verify(connector)}
                    >
                      <RefreshCw size={12} /> Verify
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setModalService(service)}
                    >
                      Update
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-600 ml-auto"
                      onClick={() => remove(connector)}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </>
                ) : (
                  <Button size="sm" onClick={() => setModalService(service)}>
                    Connect
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <Modal
        open={!!modalService}
        onClose={() => setModalService(null)}
        title={`Connect ${modalService?.name}`}
        size="sm"
      >
        {modalService && (
          <ConnectModal
            service={modalService}
            onClose={() => setModalService(null)}
            onSaved={() => qc.invalidateQueries({ queryKey: ['connectors'] })}
          />
        )}
      </Modal>
    </div>
  )
}
