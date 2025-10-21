import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Download, Filter, Calendar, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'

type ReportRow = {
  id: string
  employee: string
  shift: string
  daysWorked: number
  totalHours: number // hours (not minutes)
  lateCount: number
  absences: number
  userName?: string
}

export function Reports() {
  const [filters, setFilters] = useState({
    startDate: '', // yyyy-mm-dd
    endDate: '',   // yyyy-mm-dd
    department: '',
    employee: '',
  })
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<ReportRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  // Helpers
  const parseTimeToDate = (timeStr?: string | null, dateStr?: string): Date | null => {
    if (!timeStr || !dateStr) return null
    try {
      if (timeStr.includes('T') || timeStr.includes('-')) return new Date(timeStr)
      const m = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
      if (!m) return null
      let h = parseInt(m[1], 10)
      const min = parseInt(m[2], 10)
      const period = m[3].toUpperCase()
      if (period === 'PM' && h !== 12) h += 12
      if (period === 'AM' && h === 12) h = 0
      const d = new Date(dateStr)
      d.setHours(h, min, 0, 0)
      return d
    } catch { return null }
  }

  const getDateRange = () => {
    // Default to current month if no filters
    if (filters.startDate && filters.endDate) return { start: filters.startDate, end: filters.endDate }
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }
  }

  const fetchReport = async () => {
    setLoading(true)
    setError(null)
    try {
      const { start, end } = getDateRange()

      // 1) Load users
      const { data: users, error: userErr } = await supabase
        .from('user')
        .select('id, name, user_name')
      if (userErr) throw userErr

      // We'll initially keep all users; we'll narrow after loading schedules/ins/outs
      let filteredUsers = (users || []).filter((u: any) =>
        !filters.employee || (u.name || '').toLowerCase().includes(filters.employee.toLowerCase())
      )

      // 2) Load schedules for range to get shift_name per user (load all, we'll filter per user/date)
      const { data: schedules } = await supabase
        .from('schedule')
        .select('user_name, shift_name, start_date, end_date, employee_name')

      // 3) Load templates (shift start times)
      const { data: templates } = await supabase
        .from('template')
        .select('shift_name, start_time, end_time, days, break_time')

      // 4) Load all clock-ins/outs in range for all users
      const { data: ins } = await supabase
        .from('clock_in')
        .select('*')
        .gte('created_at', start)
        .lte('created_at', end + 'T23:59:59')

      const { data: outs } = await supabase
        .from('clock_out')
        .select('*')
        .gte('created_at', start)
        .lte('created_at', end + 'T23:59:59')

      // Restrict users to those who have either:
      // - any active schedule in the range, or
      // - any clock activity in the range
      const activeUserNames = new Set<string>()
      for (const s of schedules || []) {
        const sd = s.start_date ? new Date(s.start_date) : null
        const ed = s.end_date ? new Date(s.end_date) : null
        const rangeOverlaps = (!sd || new Date(end) >= sd) && (!ed || new Date(start) <= ed)
        if (rangeOverlaps && s.user_name) activeUserNames.add(s.user_name)
      }
      for (const ci of ins || []) if (ci.user_name) activeUserNames.add(ci.user_name)
      for (const co of outs || []) if (co.user_name) activeUserNames.add(co.user_name)

      filteredUsers = filteredUsers.filter((u: any) => activeUserNames.has(u.user_name))

      const rows: ReportRow[] = []

      for (const u of filteredUsers) {
        const uname = u.user_name
        const name = u.name || uname

        const userIns = (ins || []).filter((r: any) => r.user_name === uname)
        const userOuts = (outs || []).filter((r: any) => r.user_name === uname)

        // All schedules for this user (we will evaluate per-day)
        const userSchedules = (schedules || []).filter((s: any) => s.user_name === uname)

        // Map date => {in, out}
        const byDate = new Map<string, { in?: any; out?: any }>()
        for (const ci of userIns) {
          const d = new Date(ci.created_at).toISOString().split('T')[0]
          byDate.set(d, { ...(byDate.get(d) || {}), in: ci })
        }
        for (const co of userOuts) {
          const d = new Date(co.created_at).toISOString().split('T')[0]
          byDate.set(d, { ...(byDate.get(d) || {}), out: co })
        }

        let daysWorked = 0
        let totalMinutes = 0
        let lateCount = 0
        let absences = 0

        // Build list of all dates in range
        const startDate = new Date(start)
        const endDate = new Date(end)
        const today = new Date()
        today.setHours(0,0,0,0)
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          // Do not count future days as absences
          const dMid = new Date(d)
          dMid.setHours(0,0,0,0)
          if (dMid > today) continue
          const dateStr = d.toISOString().split('T')[0]
          const pair = byDate.get(dateStr)
          // Active schedule for this specific date
          const activeSched = userSchedules.find((s: any) => {
            const sd = s.start_date ? new Date(s.start_date) : null
            const ed = s.end_date ? new Date(s.end_date) : null
            const dayOk = (!sd || new Date(dateStr) >= sd) && (!ed || new Date(dateStr) <= ed)
            return dayOk
          })
          const activeTmpl = activeSched ? (templates || []).find((t: any) => t.shift_name === activeSched.shift_name) : null
          const daysStr = String(activeTmpl?.days || '').toLowerCase()
          const weekday = d.getDay() // 0=Sun..6=Sat
          const map = ['sun','mon','tue','wed','thu','fri','sat']
          const isScheduledWorkday = !!activeSched && daysStr.includes(map[weekday])

          if (pair?.in) {
            daysWorked += 1
            const inTime = parseTimeToDate(pair.in.clockIn, dateStr) || new Date(pair.in.created_at)
            const outTime = pair.out ? (parseTimeToDate(pair.out.clockOut, dateStr) || new Date(pair.out.created_at)) : null
            if (outTime) {
              const mins = Math.max(0, Math.floor((outTime.getTime() - inTime.getTime()) / 60000))
              let breakMin = 0
              if (pair.in.startBreak && pair.in.endBreak) {
                const b1 = parseTimeToDate(pair.in.startBreak, dateStr)
                const b2 = parseTimeToDate(pair.in.endBreak, dateStr)
                if (b1 && b2) breakMin = Math.max(0, Math.floor((b2.getTime() - b1.getTime()) / 60000))
              }
              totalMinutes += Math.max(0, mins - breakMin)
            }
            // Late detection vs template start_time if available
            if (activeTmpl?.start_time) {
              const baseline = parseTimeToDate(String(activeTmpl.start_time), dateStr)
              if (baseline && inTime > baseline) lateCount += 1
            }
          } else if (isScheduledWorkday) {
            // Absence only if there is an active schedule on this date and it is a workday per template
            absences += 1
          }
        }

        rows.push({
          id: String(u.id),
          employee: name,
          shift: (userSchedules[userSchedules.length - 1]?.shift_name) || '—',
          daysWorked,
          totalHours: Math.round((totalMinutes / 60) * 10) / 10,
          lateCount,
          absences,
          userName: uname,
        })
      }

      setRows(rows)
    } catch (e: any) {
      setError(e?.message || 'Failed to load report')
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleExport = () => {
    // Simple CSV export
    const header = ['Employee','Shift','Days','Hours','Late','Absences']
    const lines = [header.join(',')].concat(
      rows.map(r => [r.employee, r.shift, r.daysWorked, r.totalHours, r.lateCount, r.absences].join(','))
    )
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'attendance_report.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4 md:space-y-6 px-4 sm:px-6 lg:px-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Reports</h2>
          <p className="text-sm md:text-base text-muted-foreground">Generate and export attendance reports</p>
        </div>
        <Button onClick={handleExport} className="w-full sm:w-auto" disabled={loading}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      {!loading && (
      <Card className="rounded-xl md:rounded-2xl">
        <CardHeader className="px-4 md:px-6">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Filter className="w-4 h-4 md:w-5 md:h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 md:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-xs md:text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs md:text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs md:text-sm font-medium">Shift</label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-xs md:text-sm"
                value={filters.department}
                onChange={(e) =>
                  setFilters({ ...filters, department: e.target.value })
                }
              >
                <option value="">All Shifts</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs md:text-sm font-medium">Employee</label>
              <Input
                placeholder="Search employee..."
                value={filters.employee}
                onChange={(e) =>
                  setFilters({ ...filters, employee: e.target.value })
                }
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <Button className="w-full sm:w-auto text-xs md:text-sm" onClick={fetchReport} disabled={loading}>
              {loading ? 'Loading…' : 'Apply Filters'}
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                setFilters({ startDate: '', endDate: '', department: '', employee: '' })
              }
              className="w-full sm:w-auto text-xs md:text-sm"
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Loading state */}
      {loading && (
        <Card className="rounded-xl md:rounded-2xl">
          <CardContent className="py-16 flex items-center justify-center">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading report…</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {!loading && (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="rounded-xl md:rounded-2xl">
          <CardHeader className="pb-2 px-3 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium">Total Employees</CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            <div className="text-xl md:text-2xl font-bold">{rows.length}</div>
          </CardContent>
        </Card>

        <Card className="rounded-xl md:rounded-2xl">
          <CardHeader className="pb-2 px-3 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium">Total Hours</CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            <div className="text-xl md:text-2xl font-bold">
              {rows.reduce((sum, emp) => sum + (emp.totalHours || 0), 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl md:rounded-2xl">
          <CardHeader className="pb-2 px-3 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium">Late Incidents</CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            <div className="text-xl md:text-2xl font-bold text-yellow-600">
              {rows.reduce((sum, emp) => sum + (emp.lateCount || 0), 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl md:rounded-2xl">
          <CardHeader className="pb-2 px-3 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium">Absences</CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            <div className="text-xl md:text-2xl font-bold text-red-600">
              {rows.reduce((sum, emp) => sum + (emp.absences || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Report Table */}
      {!loading && (
      <Card className="rounded-xl md:rounded-2xl">
        <CardHeader className="px-4 md:px-6">
          <CardTitle className="text-base md:text-lg">Attendance Report</CardTitle>
        </CardHeader>
        <CardContent className="px-0 md:px-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 md:p-4 font-medium text-xs md:text-sm">Employee</th>
                  <th className="text-left p-2 md:p-4 font-medium text-xs md:text-sm hidden sm:table-cell">Shift</th>
                  <th className="text-right p-2 md:p-4 font-medium text-xs md:text-sm">Days</th>
                  <th className="text-right p-2 md:p-4 font-medium text-xs md:text-sm">Hours</th>
                  <th className="text-right p-2 md:p-4 font-medium text-xs md:text-sm hidden md:table-cell">Late</th>
                  <th className="text-right p-2 md:p-4 font-medium text-xs md:text-sm hidden md:table-cell">Absences</th>
                  <th className="text-right p-2 md:p-4 font-medium text-xs md:text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b hover:bg-muted/50 cursor-pointer"
                    onClick={() => {
                      const params = new URLSearchParams()
                      if (filters.startDate) params.set('start', filters.startDate)
                      if (filters.endDate) params.set('end', filters.endDate)
                      const qs = params.toString() ? `?${params.toString()}` : ''
                      navigate(`/admin/reports/${encodeURIComponent(row.userName || row.employee)}` + qs)
                    }}
                  >
                    <td className="p-2 md:p-4 font-medium text-xs md:text-sm">
                      <div>{row.employee}</div>
                      <div className="text-xs text-muted-foreground sm:hidden">{row.shift}</div>
                    </td>
                    <td className="p-2 md:p-4 text-xs md:text-sm hidden sm:table-cell">{row.shift}</td>
                    <td className="p-2 md:p-4 text-right text-xs md:text-sm">{row.daysWorked}</td>
                    <td className="p-2 md:p-4 text-right text-xs md:text-sm">{row.totalHours}h</td>
                    <td className="p-2 md:p-4 text-right text-xs md:text-sm hidden md:table-cell">
                      {row.lateCount > 0 ? (
                        <span className="text-yellow-600">{row.lateCount}</span>
                      ) : (
                        row.lateCount
                      )}
                    </td>
                    <td className="p-2 md:p-4 text-right text-xs md:text-sm hidden md:table-cell">
                      {row.absences > 0 ? (
                        <span className="text-red-600">{row.absences}</span>
                      ) : (
                        row.absences
                      )}
                    </td>
                    <td className="p-2 md:p-4 text-right text-xs md:text-sm">
                      {row.lateCount === 0 && row.absences === 0 ? (
                        <Badge variant="success" className="text-xs">Excellent</Badge>
                      ) : row.lateCount <= 2 && row.absences <= 1 ? (
                        <Badge variant="secondary" className="text-xs">Good</Badge>
                      ) : (
                        <Badge variant="warning" className="text-xs">Review</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  )
}
