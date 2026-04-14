import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import Button from '../components/shared/Button'
import Input from '../components/shared/Input'
import toast from 'react-hot-toast'
import { KeyRound, CheckCircle, Trash2 } from 'lucide-react'

interface UserSettings {
  anthropic_api_key_set: boolean
  anthropic_api_key_preview: string | null
  email: string
  full_name: string | null
}

export default function SettingsPage() {
  const qc = useQueryClient()
  const [apiKey, setApiKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)

  const { data: settings, isLoading } = useQuery({
    queryKey: ['user-settings'],
    queryFn: () => api.get<UserSettings>('/settings').then((r) => r.data),
  })

  async function saveKey(e: React.FormEvent) {
    e.preventDefault()
    if (!apiKey.startsWith('sk-ant-')) {
      toast.error('Key must start with sk-ant-')
      return
    }
    setSaving(true)
    try {
      await api.put('/settings/api-key', { anthropic_api_key: apiKey })
      toast.success('API key saved!')
      setApiKey('')
      qc.invalidateQueries({ queryKey: ['user-settings'] })
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save key')
    } finally {
      setSaving(false)
    }
  }

  async function removeKey() {
    if (!confirm('Remove your API key? Agents will stop working until you add a new one.')) return
    setRemoving(true)
    try {
      await api.delete('/settings/api-key')
      toast.success('API key removed')
      qc.invalidateQueries({ queryKey: ['user-settings'] })
    } catch {
      toast.error('Failed to remove key')
    } finally {
      setRemoving(false)
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
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* API Key section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound size={18} className="text-brand-500" />
          <h2 className="font-semibold text-gray-900">Anthropic API Key</h2>
        </div>

        <p className="text-sm text-gray-500">
          Your key is encrypted and stored securely. It's used to power your AI agents.
          Get yours at{' '}
          <a
            href="https://console.anthropic.com"
            target="_blank"
            rel="noreferrer"
            className="text-brand-600 hover:underline"
          >
            console.anthropic.com
          </a>
        </p>

        {/* Current key status */}
        {settings?.anthropic_api_key_set ? (
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-600" />
              <span className="text-sm font-medium text-green-800">API key is set</span>
              <span className="text-sm text-green-600 font-mono">
                {settings.anthropic_api_key_preview}
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-400 hover:text-red-600"
              loading={removing}
              onClick={removeKey}
            >
              <Trash2 size={13} /> Remove
            </Button>
          </div>
        ) : (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            No API key set — agents won't be able to run until you add one.
          </div>
        )}

        {/* Add / replace key form */}
        <form onSubmit={saveKey} className="space-y-3">
          <Input
            label={settings?.anthropic_api_key_set ? 'Replace with a new key' : 'Enter your API key'}
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-api03-..."
            hint="Your key is encrypted before being stored"
          />
          <Button type="submit" loading={saving} disabled={!apiKey}>
            Save Key
          </Button>
        </form>
      </div>

      {/* Account info */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-3">
        <h2 className="font-semibold text-gray-900">Account</h2>
        <div className="text-sm text-gray-600 space-y-1">
          <p><span className="text-gray-400">Email:</span> {settings?.email}</p>
          {settings?.full_name && (
            <p><span className="text-gray-400">Name:</span> {settings.full_name}</p>
          )}
        </div>
      </div>
    </div>
  )
}
