import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../lib/api'
import { saveAuth } from '../lib/auth'
import { useStore } from '../store/useStore'
import Button from '../components/shared/Button'
import Input from '../components/shared/Input'
import toast from 'react-hot-toast'
import { Zap } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const setUser = useStore((s) => s.setUser)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res =
        mode === 'login'
          ? await authApi.login(email, password)
          : await authApi.signup(email, password, name)
      saveAuth(res)
      setUser({ id: res.user_id, email: res.email })
      navigate('/')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Orstra AI</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-6">
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <Input
                label="Full name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
              />
            )}
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <Button type="submit" loading={loading} className="w-full justify-center">
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              className="text-brand-600 hover:underline font-medium"
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>

          {mode === 'login' && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500 text-center">
              Demo: <strong>demo@orstra.ai</strong> / <strong>demo123</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
