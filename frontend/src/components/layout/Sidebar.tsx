import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Bot, Plug, Settings, Zap } from 'lucide-react'
import clsx from 'clsx'

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/agents', icon: Bot, label: 'Agents' },
  { to: '/connectors', icon: Plug, label: 'Connectors' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  return (
    <aside className="w-56 bg-gray-900 flex flex-col min-h-screen">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-800">
        <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center">
          <Zap size={16} className="text-white" />
        </div>
        <span className="text-white font-semibold text-lg tracking-tight">Orstra AI</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-800">
        <div className="flex items-center gap-2 px-3 py-2 text-gray-500 text-xs">
          <span>v0.1.0</span>
        </div>
      </div>
    </aside>
  )
}
