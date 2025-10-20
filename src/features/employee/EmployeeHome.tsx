import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAttendanceStore } from '@/stores/useAttendanceStore'
import { Clock, MapPin, Camera, QrCode, Coffee, LogOut as LogOutIcon, CheckCircle2, AlertTriangle, Satellite, Timer } from 'lucide-react'
import { formatTime } from '@/lib/utils'
import { getCurrentPosition, isWithinGeofence } from '@/lib/geo'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { useNavigate } from 'react-router-dom'

export function EmployeeHome() {
  const { currentSession, isOnBreak, clockIn, clockOut, startBreak, endBreak } = useAttendanceStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [elapsedTime, setElapsedTime] = useState('00:00:00')
  const [isCapturing, setIsCapturing] = useState(false)
  const [gpsLocked, setGpsLocked] = useState(false)
  const [insideGeofence, setInsideGeofence] = useState<boolean | null>(null)
  const [selfieReady, setSelfieReady] = useState(false)
  const [cameraBlocked, setCameraBlocked] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [selfieDataUrl, setSelfieDataUrl] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [shift, setShift] = useState({
    startTime: '--',
    endTime: '--',
    location: 'Main Office',
    lat: 40.7128,
    lng: -74.0060,
    radiusMeters: 100,
  })

  // Load today's shift for logged-in user by username (fallback to full name)
  useEffect(() => {
    const fetchToday = async () => {
      if (!user) return
      const username = user.email // in our auth store, identifier holds username
      const fullName = user.name
      const today = new Date()
      const yyyy = today.getFullYear()
      const mm = String(today.getMonth() + 1).padStart(2, '0')
      const dd = String(today.getDate()).padStart(2, '0')
      const todayStr = `${yyyy}-${mm}-${dd}`

      // Find schedule where user_name matches username OR employee_name matches full name
      const { data: schedules, error } = await supabase
        .from('schedule')
        .select('id, shift_name, start_date, end_date, employee_name, user_name, created_at')
        .or(`user_name.eq.${username},employee_name.eq.${fullName}`)
        .order('created_at', { ascending: false })

      if (error || !schedules || schedules.length === 0) return

      // Pick first active schedule covering today
      const active = schedules.find((s: any) => {
        const startOk = !s.start_date || s.start_date <= todayStr
        const endOk = !s.end_date || s.end_date >= todayStr
        return startOk && endOk
      }) || schedules[0]

      if (!active?.shift_name) return

      const { data: tmpl } = await supabase
        .from('template')
        .select('start_time, end_time, break_time, days')
        .eq('shift_name', active.shift_name)
        .maybeSingle()

      if (tmpl) {
        const to12h = (s?: string) => {
          if (!s) return '--'
          const m = String(s).toLowerCase().match(/^(\d{1,2}):(\d{2})(?:\s*(am|pm))?$/)
          if (!m) return s
          let h = parseInt(m[1], 10)
          const min = m[2]
          const hasAmPm = !!m[3]
          let ampm = m[3]
          if (!hasAmPm) {
            ampm = h >= 12 ? 'pm' : 'am'
            h = h % 12
            if (h === 0) h = 12
          }
          const hh = h < 10 ? `0${h}` : String(h)
          return `${hh}:${min} ${ampm}`
        }
        setShift((prev) => ({
          ...prev,
          startTime: to12h(tmpl.start_time) || prev.startTime,
          endTime: to12h(tmpl.end_time) || prev.endTime,
        }))
      }
    }
    fetchToday()
  }, [user])

  // Inline camera is disabled; use dedicated capture route instead

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
      if (currentSession) {
        const elapsed = Date.now() - currentSession.timestamp.getTime()
        const hours = Math.floor(elapsed / 3600000)
        const minutes = Math.floor((elapsed % 3600000) / 60000)
        const seconds = Math.floor((elapsed % 60000) / 1000)
        setElapsedTime(
          `${hours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        )
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [currentSession])

  const handleAction = async (action: 'clockIn' | 'startBreak' | 'endBreak' | 'clockOut') => {
    setIsCapturing(true)
    try {
      localStorage.setItem('pendingAction', action)
      navigate('/employee/selfie')
      return
    } catch (error) {
      console.error('Navigation error:', error)
      setGeoError('Unable to open selfie capture')
    } finally {
      setIsCapturing(false)
    }
  }

  // After returning from the capture route, if selfie + geo exist in localStorage, complete the pending action
  useEffect(() => {
    const selfie = localStorage.getItem('selfieDataUrl')
    const geo = localStorage.getItem('lastGeo')
    const pendingAction = (localStorage.getItem('pendingAction') as any) as 'clockIn' | 'startBreak' | 'endBreak' | 'clockOut' | null
    if (!selfie || !geo || !pendingAction) return
    try {
      const { lat, lng } = JSON.parse(geo)
      setSelfieDataUrl(selfie)
      setSelfieReady(true)
      setGpsLocked(true)

      // Check geofence
      const withinGeofence = isWithinGeofence(
        lat,
        lng,
        shift.lat,
        shift.lng,
        shift.radiusMeters
      )

      if (!withinGeofence) {
        setInsideGeofence(false)
        setGeoError('You are outside the required geofence area')
        return
      }

      setInsideGeofence(true)

      // Apply local state change based on action
      if (pendingAction === 'clockIn') {
        clockIn({ lat, lng })
      } else if (pendingAction === 'startBreak') {
        startBreak()
      } else if (pendingAction === 'endBreak') {
        endBreak()
        try { localStorage.setItem('breakCompleted', '1') } catch {}
      } else if (pendingAction === 'clockOut') {
        clockOut()
        try { localStorage.removeItem('breakCompleted') } catch {}
      }

      // Optionally send to webhook if configured
      const webhook = import.meta.env.VITE_CLOCKIN_WEBHOOK as string | undefined
      if (webhook) {
        const payload = {
          user: { name: user?.name, username: user?.email },
          timestamp: new Date().toISOString(),
          location: { lat, lng },
          selfie,
          shift: { startTime: shift.startTime, endTime: shift.endTime },
        }
        // fire-and-forget; do not block UI
        fetch(webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(() => {})
      }
      // Clear the cached items
      localStorage.removeItem('selfieDataUrl')
      localStorage.removeItem('lastGeo')
      localStorage.removeItem('pendingAction')
    } catch (e) {
      // ignore parse errors
    }
  }, [user])

  // Derived UI states
  const disabledReason = null

  // Decide button label and action
  let mainAction: 'clockIn' | 'startBreak' | 'endBreak' | 'clockOut' = 'clockIn'
  let mainLabel = 'Clock In'
  const breakDone = typeof window !== 'undefined' ? localStorage.getItem('breakCompleted') === '1' : false
  if (currentSession) {
    if (isOnBreak) {
      mainAction = 'endBreak'
      mainLabel = 'End Break'
    } else if (!breakDone) {
      mainAction = 'startBreak'
      mainLabel = 'Start Break'
    } else {
      mainAction = 'clockOut'
      mainLabel = 'Clock Out'
    }
  }

  return (
    <div className="space-y-6 px-6 lg:px-10 bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950 rounded-2xl">
      {/* Row A: Current Time and Today's Shift */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" aria-live="polite">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
          <Card className="rounded-2xl border-border/60 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Current Time</p>
                <p className="text-4xl font-bold">{formatTime(currentTime)}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.05 }}>
          <Card className="rounded-2xl border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" /> Today's Shift
              </CardTitle>
              <CardDescription>Be on time and within geofence</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Start Time</p>
                  <p className="text-lg font-semibold">{shift.startTime}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">End Time</p>
                  <p className="text-lg font-semibold">{shift.endTime}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{shift.location}</span>
                <Badge variant="outline" className="ml-auto">{shift.radiusMeters}m radius</Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Row B: Clock-in panel */}
      {!currentSession ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <Card className="rounded-2xl border-border/60">
            <CardHeader className="pb-2">
              <CardTitle>Ready to Clock In?</CardTitle>
              <CardDescription>
                {insideGeofence ? (
                  <span className="text-green-600 dark:text-green-400">You're inside the {shift.radiusMeters}m geofence</span>
                ) : insideGeofence === false ? (
                  <span className="text-amber-600 dark:text-amber-400">Outside geofence</span>
                ) : (
                  <span className="text-muted-foreground">Checking location…</span>
                )}
                {' '}
                • {gpsLocked ? 'GPS locked' : 'GPS…'} • {selfieReady ? 'Selfie ready' : 'Selfie pending'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selfie is captured in /employee/selfie route */}

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <motion.div animate={selfieReady ? { scale: 1.05 } : {}} transition={{ type: 'spring', stiffness: 300, damping: 15 }}>
                    {selfieReady ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Camera className="w-4 h-4 text-muted-foreground" />
                    )}
                  </motion.div>
                  <span>Selfie</span>
                </div>
                <div className="flex items-center gap-2">
                  <motion.div animate={gpsLocked ? { scale: 1.05 } : {}} transition={{ type: 'spring', stiffness: 300, damping: 15 }}>
                    {gpsLocked ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Satellite className="w-4 h-4 text-muted-foreground" />
                    )}
                  </motion.div>
                  <span>GPS</span>
                </div>
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-muted-foreground" />
                  <span>QR (optional)</span>
                </div>
              </div>

              {/* Warning / Info banners */}
              {geoError && (
                <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200 p-3">
                  <AlertTriangle className="w-4 h-4 mt-0.5" />
                  <div className="text-sm">
                    <p>{geoError}</p>
                    {insideGeofence === false && (
                      <a className="underline" href="https://www.google.com/maps" target="_blank" rel="noreferrer">Open Maps</a>
                    )}
                  </div>
                </div>
              )}
              {cameraBlocked && (
                <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200 p-3">
                  <AlertTriangle className="w-4 h-4 mt-0.5" />
                  <div className="text-sm">
                    <p>Camera blocked</p>
                    <button className="underline" onClick={() => window.open('about:preferences#privacy')}>Enable camera</button>
                  </div>
                </div>
              )}

              <motion.div whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => handleAction(mainAction)}
                  className="w-full h-14 text-lg"
                  size="lg"
                  disabled={isCapturing}
                >
                  {isCapturing ? 'Preparing…' : mainLabel}
                </Button>
              </motion.div>
              {disabledReason && (
                <p className="text-sm text-muted-foreground">{disabledReason}</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        // Active Session
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <Card className="rounded-2xl border-green-500/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" /> Currently Clocked In
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Time Elapsed</p>
                <p className="text-5xl font-bold font-mono">{elapsedTime}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {!isOnBreak ? (
                  <Button onClick={startBreak} variant="outline" className="h-12">
                    <Coffee className="w-4 h-4 mr-2" /> Start Break
                  </Button>
                ) : (
                  <Button onClick={endBreak} variant="secondary" className="h-12">
                    <Coffee className="w-4 h-4 mr-2" /> End Break
                  </Button>
                )}
                <Button onClick={clockOut} variant="destructive" className="h-12">
                  <LogOutIcon className="w-4 h-4 mr-2" /> Clock Out
                </Button>
              </div>
              {isOnBreak && (
                <Badge variant="warning" className="w-full justify-center py-2">On Break</Badge>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Row C: KPI mini cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
          <Card className="rounded-2xl">
            <CardContent className="p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">This Week Worked</p>
                  <p className="text-2xl font-bold">24h 12m</p>
                </div>
                <Timer className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <Card className="rounded-2xl">
            <CardContent className="p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Breaks</p>
                  <p className="text-2xl font-bold">3h</p>
                </div>
                <Coffee className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
          <Card className="rounded-2xl">
            <CardContent className="p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Late Minutes</p>
                  <p className="text-2xl font-bold text-amber-600">5m</p>
                </div>
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
