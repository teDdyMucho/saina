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
  const [placeName, setPlaceName] = useState<string | null>(null)
  const { user } = useAuthStore()

  // Actively request geolocation and resolve a human-readable place name
  async function requestLocationAndName(): Promise<{ lat: number; lng: number } | null> {
    if (!('geolocation' in navigator)) {
      setError((prev) => (prev ? prev + ' Location unsupported.' : 'Location unsupported.'))
      return null
    }
    try {
      const pos: GeolocationPosition = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0,
        })
      )
      const c = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      setCoords(c)
      try {
        const r = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${c.lat}&longitude=${c.lng}&localityLanguage=en`)
        const d = await r.json()
        setPlaceName(composePlaceName(d))
      } catch {}
      return c
    } catch (e) {
      setError((prev) => (prev ? prev + ' Location blocked.' : 'Location blocked.'))
      return null
    }
  }

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

      await requestLocationAndName()
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
    // Pause preview to freeze the frame after capture
    try { videoRef.current.pause() } catch {}
  }

  const retake = () => {
    setCaptured(null)
    // Resume the camera preview so it's ready to capture again
    if (videoRef.current) {
      videoRef.current.play().catch(() => {})
    }
  }

  const composePlaceName = (d: any) => {
    const province = d?.principalSubdivision || d?.localityInfo?.administrative?.find((x: any) => /province/i.test(x?.description || ''))?.name
    const locality = d?.locality || d?.city || d?.localityInfo?.administrative?.find((x: any) => /city|municipality|district/i.test(x?.description || ''))?.name
    const country = (d?.countryName || '').toLowerCase()
    const left = [province, locality].filter(Boolean).join(', ')
    const result = `${left}${country ? ` ${country}` : ''}`.trim()
    return result || d?.plusCode || d?.locality || d?.principalSubdivision || null
  }

  const formatTime12h = (d: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0')
    const yyyy = d.getFullYear()
    const mm = pad(d.getMonth() + 1)
    const dd = pad(d.getDate())
    let h = d.getHours()
    const ampm = h >= 12 ? 'PM' : 'AM'
    h = h % 12
    if (h === 0) h = 12
    const hh = h.toString().padStart(2, '0')
    const mins = pad(d.getMinutes())
    return `${yyyy}-${mm}-${dd} ${hh}:${mins} ${ampm}`
  }

  const saveAndClose = async () => {
    const current = coords || (await requestLocationAndName())
    if (!current) {
      setError('Waiting for location... please enable location and try again.')
      return
    }
    // Fire webhook with current location (and selfie if captured)
    let nameToSend = placeName
    if (!nameToSend) {
      try {
        const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${current.lat}&longitude=${current.lng}&localityLanguage=en`)
        const d = await res.json()
        nameToSend = composePlaceName(d)
      } catch {}
    }
    const payload = {
      name: nameToSend || `${current.lat.toFixed(5)}, ${current.lng.toFixed(5)}`,
      time: formatTime12h(new Date()),
      image: captured || null,
      location: current,
      employee: user ? { name: user.name, username: user.email } : null,
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
            {captured ? (
              <img src={captured} alt="Captured" className="w-full h-64 object-cover bg-black/10" />
            ) : (
              <video ref={videoRef} playsInline muted className="w-full h-64 object-cover bg-black/10" />
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />

          <div className="text-sm">
            <p>Location: {placeName ? placeName : coords ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : 'Waiting for location...'}</p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2 justify-end">
            {!captured ? (
              <Button variant="outline" onClick={takePhoto}>Take Photo</Button>
            ) : (
              <>
                <Button variant="outline" onClick={retake}>Retake</Button>
                <Button onClick={saveAndClose} disabled={!coords}>Save & Close</Button>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Tip: On mobile, ensure camera and location permissions are allowed.</p>
        </CardContent>
      </Card>
    </div>
  )
}
