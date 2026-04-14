import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useStore } from './store/useStore'
import { getStoredUser, isAuthenticated } from './lib/auth'
import Layout from './components/layout/Layout'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AgentsPage from './pages/AgentsPage'
import AgentBuilderPage from './pages/AgentBuilderPage'
import AgentDetailPage from './pages/AgentDetailPage'
import ConnectorsPage from './pages/ConnectorsPage'
import SettingsPage from './pages/SettingsPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const setUser = useStore((s) => s.setUser)

  useEffect(() => {
    const user = getStoredUser()
    if (user) setUser(user)
  }, [setUser])

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={isAuthenticated() ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes — all wrapped in RequireAuth + Layout */}
        <Route element={<RequireAuth><Layout /></RequireAuth>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/agents/new" element={<AgentBuilderPage />} />
          <Route path="/agents/:id/edit" element={<AgentBuilderPage />} />
          <Route path="/agents/:id" element={<AgentDetailPage />} />
          <Route path="/connectors" element={<ConnectorsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
