import { create } from 'zustand'

interface AttendanceEvent {
  id: string
  type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end'
  timestamp: Date
  location?: { lat: number; lng: number }
}

interface BreakPeriod {
  startTime: Date
  endTime?: Date
}

interface AttendanceState {
  currentSession: AttendanceEvent | null
  isOnBreak: boolean
  breakPeriods: BreakPeriod[]
  currentBreakStart: Date | null
  clockIn: (location?: { lat: number; lng: number }) => void
  clockOut: () => void
  startBreak: () => void
  endBreak: () => void
  getTotalBreakTime: () => number
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  currentSession: null,
  isOnBreak: false,
  breakPeriods: [],
  currentBreakStart: null,
  clockIn: (location) => {
    set({
      currentSession: {
        id: crypto.randomUUID(),
        type: 'clock_in',
        timestamp: new Date(),
        location,
      },
      isOnBreak: false,
      breakPeriods: [],
      currentBreakStart: null,
    })
  },
  clockOut: () => {
    set({ currentSession: null, isOnBreak: false, breakPeriods: [], currentBreakStart: null })
  },
  startBreak: () => {
    set({ isOnBreak: true, currentBreakStart: new Date() })
  },
  endBreak: () => {
    const state = get()
    if (state.currentBreakStart) {
      set({
        isOnBreak: false,
        breakPeriods: [
          ...state.breakPeriods,
          { startTime: state.currentBreakStart, endTime: new Date() }
        ],
        currentBreakStart: null,
      })
    }
  },
  getTotalBreakTime: () => {
    const state = get()
    let total = 0
    
    // Add completed break periods
    state.breakPeriods.forEach(period => {
      if (period.endTime) {
        total += period.endTime.getTime() - period.startTime.getTime()
      }
    })
    
    // Add current ongoing break if any
    if (state.currentBreakStart) {
      total += Date.now() - state.currentBreakStart.getTime()
    }
    
    return total
  },
}))
