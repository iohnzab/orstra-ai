import { useStore } from '../../store/useStore'
import { clearAuth } from '../../lib/auth'
import { useNavigate } from 'react-router-dom'
import { LogOut, User } from 'lucide-react'

export default function TopBar() {
  const user = useStore((s) => s.user)
  const setUser = useStore((s) => s.setUser)
  const navigate = useNavigate()

  function handleLogout() {
    clearAuth()
    setUser(null)
    navigate('/login')
  }

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User size={15} />
          <span>{user?.email || 'User'}</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </header>
  )
}
