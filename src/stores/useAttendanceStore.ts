import { create } from 'zustand'

interface AttendanceEvent {
  id: string
  type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end'
  timestamp: Date
  location?: { lat: number; lng: number }
}

interface AttendanceState {
  currentSession: AttendanceEvent | null
  isOnBreak: boolean
  clockIn: (location?: { lat: number; lng: number }) => void
  clockOut: () => void
  startBreak: () => void
  endBreak: () => void
}

export const useAttendanceStore = create<AttendanceState>((set) => ({
  currentSession: null,
  isOnBreak: false,
  clockIn: (location) => {
    set({
      currentSession: {
        id: crypto.randomUUID(),
        type: 'clock_in',
        timestamp: new Date(),
        location,
      },
      isOnBreak: false,
    })
  },
  clockOut: () => {
    set({ currentSession: null, isOnBreak: false })
  },
  startBreak: () => {
    set({ isOnBreak: true })
  },
  endBreak: () => {
    set({ isOnBreak: false })
  },
}))
