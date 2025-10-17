import { create } from 'zustand'

export type UserRole = 'admin' | 'employee'

interface User {
  id: string
  name: string
  email: string
  role: UserRole
  orgId: string
  avatar?: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (identifier: string, role: UserRole, nameOverride?: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (identifier: string, role: UserRole, nameOverride?: string) => {
    set({
      user: {
        id: '1',
        name: nameOverride || (role === 'admin' ? 'Admin User' : 'John Doe'),
        email: identifier,
        role,
        orgId: 'org-1',
        avatar: undefined,
      },
      isAuthenticated: true,
    })
  },
  logout: () => {
    set({ user: null, isAuthenticated: false })
  },
}))
