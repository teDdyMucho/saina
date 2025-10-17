import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SelfieCapture() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [captured, setCaptured] = useState<string | null>(null)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const { user } = useAuthStore()

  useEffect(() => {
    const start = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
        setStream(s)
        if (videoRef.current) {
          videoRef.current.srcObject = s
          await videoRef.current.play().catch(() => {})
        }
      } catch (e) {
        setError('Camera permission denied or unavailable.')
      }

      if (!('geolocation' in navigator)) {
        setError((prev) => (prev ? prev + ' Location unsupported.' : 'Location unsupported.'))
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setError((prev) => (prev ? prev + ' Location blocked.' : 'Location blocked.')),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      )
    }
    start()
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    const w = videoRef.current.videoWidth || 640
    const h = videoRef.current.videoHeight || 480
    const c = canvasRef.current
    c.width = w
    c.height = h
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.drawImage(videoRef.current, 0, 0, w, h)
    const dataUrl = c.toDataURL('image/jpeg', 0.8)
    setCaptured(dataUrl)
  }

  const saveAndClose = () => {
    if (!coords) {
      setError('Waiting for location... please enable location and try again.')
      return
    }
    // Fire webhook with current location (and selfie if captured)
    const payload = {
      user: user ? { name: user.name, username: user.email } : undefined,
      createdAt: new Date().toISOString(),
      location: coords,
      selfie: captured || undefined,
    }
    fetch('https://primary-production-6722.up.railway.app/webhook/clockIn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {})

    // Persist for parent page to complete clock-in
    if (captured) localStorage.setItem('selfieDataUrl', captured)
    localStorage.setItem('lastGeo', JSON.stringify(coords))
    window.close()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Selfie & Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md overflow-hidden border bg-black/5">
            <video ref={videoRef} playsInline muted className="w-full h-64 object-cover bg-black/10" />
          </div>
          <canvas ref={canvasRef} className="hidden" />

          <div className="text-sm">
            <p>Location: {coords ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : 'Waiting for location...'}</p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={takePhoto}>Take Photo</Button>
            <Button onClick={saveAndClose}>Save & Close</Button>
          </div>
          <p className="text-xs text-muted-foreground">Tip: On mobile, ensure camera and location permissions are allowed.</p>
        </CardContent>
      </Card>
    </div>
  )
}
