import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAttendanceStore } from '@/stores/useAttendanceStore'
import { Clock, MapPin, Camera, QrCode, Coffee, LogOut as LogOutIcon, CheckCircle2, AlertTriangle, Satellite, Timer } from 'lucide-react'
import { formatTime } from '@/lib/utils'
import { getCurrentPosition, isWithinGeofence } from '@/lib/geo'
import { motion } from 'framer-motion'

export function EmployeeHome() {
  const { currentSession, isOnBreak, clockIn, clockOut, startBreak, endBreak } = useAttendanceStore()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [elapsedTime, setElapsedTime] = useState('00:00:00')
  const [isCapturing, setIsCapturing] = useState(false)
  const [gpsLocked, setGpsLocked] = useState(false)
  const [insideGeofence, setInsideGeofence] = useState<boolean | null>(null)
  const [selfieReady, setSelfieReady] = useState(false)
  const [cameraBlocked, setCameraBlocked] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)

  // Mock shift data
  const shift = {
    startTime: '09:00 AM',
    endTime: '05:00 PM',
    location: 'Main Office',
    lat: 40.7128,
    lng: -74.0060,
    radiusMeters: 100,
  }

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

  const handleClockIn = async () => {
    setIsCapturing(true)
    try {
      // Simulate selfie capture
      await new Promise((resolve) => setTimeout(resolve, 600))
      setSelfieReady(true)
      
      // Get GPS location
      const position = await getCurrentPosition()
      const { latitude, longitude } = position.coords
      setGpsLocked(true)
      
      // Check geofence
      const withinGeofence = isWithinGeofence(
        latitude,
        longitude,
        shift.lat,
        shift.lng,
        shift.radiusMeters
      )

      if (!withinGeofence) {
        setInsideGeofence(false)
        setGeoError('You are outside the required geofence area')
        setIsCapturing(false)
        return
      }

      setInsideGeofence(true)
      clockIn({ lat: latitude, lng: longitude })
    } catch (error) {
      console.error('Clock in error:', error)
      if ((error as GeolocationPositionError)?.code === 1) {
        setGeoError('Location permission denied')
      } else {
        setGeoError('Unable to get GPS location')
      }
      // For demo: keep requirements visible; do not auto clock-in
    } finally {
      setIsCapturing(false)
    }
  }

  // Derived UI states
  const disabledReason = !gpsLocked
    ? 'Waiting for GPS lock'
    : insideGeofence === false
    ? `Outside geofence (${shift.radiusMeters}m)`
    : !selfieReady
    ? 'Selfie not captured'
    : null

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
                  onClick={handleClockIn}
                  className="w-full h-14 text-lg"
                  size="lg"
                  disabled={Boolean(disabledReason) || isCapturing}
                >
                  {isCapturing ? 'Preparing…' : 'Clock In'}
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
