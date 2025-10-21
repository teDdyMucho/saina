import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Image as ImageIcon, X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDuration } from '@/lib/utils'

export default function ReportUserDetail() {
  const { userName } = useParams()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [rows, setRows] = useState<any[]>([])
  const [preview, setPreview] = useState<{ src: string; title: string } | null>(null)

  const range = useMemo(() => {
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    if (start && end) return { start, end }
    const now = new Date()
    const s = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const e = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
    return { start: s, end: e }
  }, [searchParams])

  useEffect(() => {
    const load = async () => {
      if (!userName) return
      setLoading(true)
      setError(null)
      try {
        const { data: users } = await supabase.from('user').select('name, user_name, id').eq('user_name', userName).maybeSingle()
        setUserInfo(users)

        const { data: ins } = await supabase
          .from('clock_in')
          .select('*')
          .eq('user_name', userName)
          .gte('created_at', range.start)
          .lte('created_at', range.end + 'T23:59:59')
          .order('created_at', { ascending: true })

        const { data: outs } = await supabase
          .from('clock_out')
          .select('*')
          .eq('user_name', userName)
          .gte('created_at', range.start)
          .lte('created_at', range.end + 'T23:59:59')
          .order('created_at', { ascending: true })

        const outsSorted = outs || []
        const used = new Set<any>()
        const entries: any[] = []
        for (const ci of ins || []) {
          const inDate = new Date(ci.created_at)
          const cutoff = inDate.getTime() + 36*60*60*1000
          const match = outsSorted.find(o => o.user_name === ci.user_name && !used.has(o.id ?? o.created_at) && new Date(o.created_at).getTime() > inDate.getTime() && new Date(o.created_at).getTime() <= cutoff)
          let worked = 0
          let breakMin = 0
          if (match) {
            used.add(match.id ?? match.created_at)
            // Parse times
            const dateInISO = inDate.toISOString().split('T')[0]
            const outISO = new Date(match.created_at).toISOString().split('T')[0]
            const inDt = parseTimeToDate(ci.clockIn, dateInISO) || new Date(ci.created_at)
            const outDt = parseTimeToDate(match.clockOut, outISO) || new Date(match.created_at)
            if (inDt && outDt && outDt > inDt) {
              worked = Math.max(0, Math.floor((outDt.getTime() - inDt.getTime())/60000))
              if (ci.startBreak && ci.endBreak) {
                const b1 = parseTimeToDate(ci.startBreak, dateInISO)
                const b2 = parseTimeToDate(ci.endBreak, dateInISO)
                if (b1 && b2 && b1 >= inDt && b2 <= outDt && b2 > b1) {
                  breakMin = Math.max(0, Math.floor((b2.getTime()-b1.getTime())/60000))
                }
              }
            }
          }
          entries.push({
            date: inDate.toISOString().split('T')[0],
            clockIn: ci.clockIn,
            clockOut: match?.clockOut || null,
            workedMinutes: Math.max(0, worked - breakMin),
            breakMinutes: breakMin,
            inImage: ci.image,
            outImage: match?.image || null,
            inLocation: ci.location || null,
            outLocation: match?.location || null,
          })
        }
        setRows(entries)
      } catch (e: any) {
        setError(e?.message || 'Failed to load user report')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userName, range.start, range.end])

  const parseTimeToDate = (timeStr?: string | null, dateStr?: string) => {
    if (!timeStr || !dateStr) return null
    if (timeStr.includes('T') || timeStr.includes('-')) return new Date(timeStr)
    const m = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
    if (!m) return null
    let h = parseInt(m[1], 10)
    const min = parseInt(m[2], 10)
    const p = m[3].toUpperCase()
    if (p === 'PM' && h !== 12) h += 12
    if (p === 'AM' && h === 12) h = 0
    const d = new Date(dateStr)
    d.setHours(h, min, 0, 0)
    return d
  }

  if (loading) return (
    <div className="p-6">
      <Card>
        <CardContent className="py-16 flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading user data…</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
  if (error) return <div className="p-6 text-red-600">{error}</div>

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">{userInfo?.name || userName}</h2>
          <p className="text-sm text-muted-foreground">Details from {range.start} to {range.end}</p>
        </div>
      </div>

      <Card className="rounded-xl md:rounded-2xl">
        <CardHeader>
          <CardTitle>Daily Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 md:p-3 text-xs md:text-sm">Date</th>
                  <th className="text-left p-2 md:p-3 text-xs md:text-sm">Clock In</th>
                  <th className="text-left p-2 md:p-3 text-xs md:text-sm">Clock Out</th>
                  <th className="text-right p-2 md:p-3 text-xs md:text-sm">Worked</th>
                  <th className="text-right p-2 md:p-3 text-xs md:text-sm">Break</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2 md:p-3 text-xs md:text-sm">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="p-2 md:p-3 text-xs md:text-sm">
                      <div className="space-y-1">
                        <div>{r.clockIn || '—'}</div>
                        {r.inImage ? (
                          <div className="mt-1">
                            <img src={r.inImage} alt="Clock In" className="w-28 h-16 object-cover rounded border cursor-zoom-in" onClick={() => setPreview({ src: r.inImage, title: 'Clock In' })} />
                          </div>
                        ) : (
                          <div className="w-28 h-16 flex items-center justify-center rounded border bg-muted/50">
                            <ImageIcon className="w-5 h-5 text-muted-foreground/60" />
                          </div>
                        )}
                        {r.inLocation && (
                          <div className="flex items-start gap-1 text-[11px] text-muted-foreground">
                            <MapPin className="w-3 h-3 mt-0.5" />
                            <span className="line-clamp-2">{r.inLocation}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-2 md:p-3 text-xs md:text-sm">
                      <div className="space-y-1">
                        <div>{r.clockOut || '—'}</div>
                        {r.outImage ? (
                          <div className="mt-1">
                            <img src={r.outImage} alt="Clock Out" className="w-28 h-16 object-cover rounded border cursor-zoom-in" onClick={() => setPreview({ src: r.outImage, title: 'Clock Out' })} />
                          </div>
                        ) : (
                          <div className="w-28 h-16 flex items-center justify-center rounded border bg-muted/50">
                            <ImageIcon className="w-5 h-5 text-muted-foreground/60" />
                          </div>
                        )}
                        {r.outLocation && (
                          <div className="flex items-start gap-1 text-[11px] text-muted-foreground">
                            <MapPin className="w-3 h-3 mt-0.5" />
                            <span className="line-clamp-2">{r.outLocation}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-2 md:p-3 text-right text-xs md:text-sm">{formatDuration(r.workedMinutes)}</td>
                    <td className="p-2 md:p-3 text-right text-xs md:text-sm">{formatDuration(r.breakMinutes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Image Lightbox */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button className="absolute -top-3 -right-3 bg-white rounded-full p-1 shadow hover:opacity-90" aria-label="Close preview" onClick={() => setPreview(null)}>
              <X className="w-5 h-5" />
            </button>
            <div className="bg-background rounded-lg overflow-hidden">
              <img src={preview.src} alt={preview.title} className="w-full h-auto max-h-[80vh] object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
