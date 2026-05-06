import { create } from 'zustand'
import type { ModalType } from '@/types/ui'

interface UiStore {
  openModal: ModalType
  sidebarOpen: boolean
  confirmStopAgentId: string | null

  openSpawnModal: () => void
  openConfirmStop: (agentId: string) => void
  closeModal: () => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useUiStore = create<UiStore>((set) => ({
  openModal: null,
  sidebarOpen: true,
  confirmStopAgentId: null,

  openSpawnModal: () => set({ openModal: 'spawn' }),
  openConfirmStop: (agentId) => set({ openModal: 'confirm_stop', confirmStopAgentId: agentId }),
  closeModal: () => set({ openModal: null, confirmStopAgentId: null }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
