import { create } from 'zustand'
import type { User } from '../lib/types'

interface AppState {
  user: User | null
  setUser: (user: User | null) => void

  // Agent builder wizard
  wizardStep: number
  setWizardStep: (step: number) => void

  // Modals
  isConnectorModalOpen: boolean
  setConnectorModalOpen: (open: boolean) => void
  connectorModalService: string | null
  setConnectorModalService: (service: string | null) => void

  // Test run panel
  isTestPanelOpen: boolean
  setTestPanelOpen: (open: boolean) => void
}

export const useStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),

  wizardStep: 1,
  setWizardStep: (step) => set({ wizardStep: step }),

  isConnectorModalOpen: false,
  setConnectorModalOpen: (open) => set({ isConnectorModalOpen: open }),
  connectorModalService: null,
  setConnectorModalService: (service) => set({ connectorModalService: service }),

  isTestPanelOpen: false,
  setTestPanelOpen: (open) => set({ isTestPanelOpen: open }),
}))
