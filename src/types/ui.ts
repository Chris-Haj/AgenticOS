export type ViewName = 'dashboard' | 'agents' | 'memory' | 'settings'

export type ModalType = 'spawn' | 'confirm_stop' | null

export interface NavItem {
  id: ViewName
  label: string
  path: string
}
