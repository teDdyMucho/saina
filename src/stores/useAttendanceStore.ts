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

// Local persistence helpers
const PERSIST_KEY = 'attendanceState'
const loadPersisted = (): Partial<AttendanceState> => {
  try {
    const raw = localStorage.getItem(PERSIST_KEY)
    if (!raw) return {}
    const data = JSON.parse(raw)
    const reviveDate = (v: any) => (v ? new Date(v) : null)
    return {
      currentSession: data.currentSession
        ? {
            id: data.currentSession.id,
            type: data.currentSession.type,
            timestamp: reviveDate(data.currentSession.timestamp) as Date,
            location: data.currentSession.location || undefined,
          }
        : null,
      isOnBreak: !!data.isOnBreak,
      breakPeriods: Array.isArray(data.breakPeriods)
        ? data.breakPeriods.map((p: any) => ({ startTime: reviveDate(p.startTime) as Date, endTime: reviveDate(p.endTime) || undefined }))
        : [],
      currentBreakStart: reviveDate(data.currentBreakStart),
    }
  } catch {
    return {}
  }
}

const savePersisted = (state: AttendanceState) => {
  try {
    const payload = {
      currentSession: state.currentSession
        ? {
            id: state.currentSession.id,
            type: state.currentSession.type,
            timestamp: state.currentSession.timestamp.toISOString(),
            location: state.currentSession.location || null,
          }
        : null,
      isOnBreak: state.isOnBreak,
      breakPeriods: state.breakPeriods.map(p => ({
        startTime: p.startTime.toISOString(),
        endTime: p.endTime ? p.endTime.toISOString() : null,
      })),
      currentBreakStart: state.currentBreakStart ? state.currentBreakStart.toISOString() : null,
    }
    localStorage.setItem(PERSIST_KEY, JSON.stringify(payload))
  } catch {}
}

export const useAttendanceStore = create<AttendanceState>((set, get) => {
  const initial = loadPersisted()
  const base: AttendanceState = {
    currentSession: initial.currentSession ?? null,
    isOnBreak: initial.isOnBreak ?? false,
    breakPeriods: initial.breakPeriods ?? [],
    currentBreakStart: initial.currentBreakStart ?? null,
    clockIn: (location) => {
      set((prev) => {
        const next: AttendanceState = {
          ...prev,
          currentSession: {
            id: crypto.randomUUID(),
            type: 'clock_in',
            timestamp: new Date(),
            location,
          },
          isOnBreak: false,
          breakPeriods: [],
          currentBreakStart: null,
          clockIn: prev.clockIn,
          clockOut: prev.clockOut,
          startBreak: prev.startBreak,
          endBreak: prev.endBreak,
          getTotalBreakTime: prev.getTotalBreakTime,
        }
        savePersisted(next)
        return next
      })
    },
    clockOut: () => {
      set((prev) => {
        const next: AttendanceState = {
          ...prev,
          currentSession: null,
          isOnBreak: false,
          breakPeriods: [],
          currentBreakStart: null,
          clockIn: prev.clockIn,
          clockOut: prev.clockOut,
          startBreak: prev.startBreak,
          endBreak: prev.endBreak,
          getTotalBreakTime: prev.getTotalBreakTime,
        }
        savePersisted(next)
        return next
      })
    },
    startBreak: () => {
      set((prev) => {
        const next: AttendanceState = {
          ...prev,
          isOnBreak: true,
          currentBreakStart: new Date(),
          clockIn: prev.clockIn,
          clockOut: prev.clockOut,
          startBreak: prev.startBreak,
          endBreak: prev.endBreak,
          getTotalBreakTime: prev.getTotalBreakTime,
        }
        savePersisted(next)
        return next
      })
    },
    endBreak: () => {
      const state = get()
      if (state.currentBreakStart) {
        set((prev) => {
          const next: AttendanceState = {
            ...prev,
            isOnBreak: false,
            breakPeriods: [
              ...prev.breakPeriods,
              { startTime: prev.currentBreakStart as Date, endTime: new Date() }
            ],
            currentBreakStart: null,
            clockIn: prev.clockIn,
            clockOut: prev.clockOut,
            startBreak: prev.startBreak,
            endBreak: prev.endBreak,
            getTotalBreakTime: prev.getTotalBreakTime,
          }
          savePersisted(next)
          return next
        })
      }
    },
    getTotalBreakTime: () => {
      const state = get()
      let total = 0
      state.breakPeriods.forEach(period => {
        if (period.endTime) {
          total += period.endTime.getTime() - period.startTime.getTime()
        }
      })
      if (state.currentBreakStart) {
        total += Date.now() - state.currentBreakStart.getTime()
      }
      return total
    },
  }
  return base
})
