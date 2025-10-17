import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const initialShiftTemplates = [
  {
    id: '1',
    name: 'Morning Shift',
    startTime: '08:00',
    endTime: '16:00',
    breakMinutes: 60,
    graceMinutes: 15,
    weekdays: [1, 2, 3, 4, 5],
  },
  {
    id: '2',
    name: 'Afternoon Shift',
    startTime: '12:00',
    endTime: '20:00',
    breakMinutes: 60,
    graceMinutes: 10,
    weekdays: [1, 2, 3, 4, 5],
  },
  {
    id: '3',
    name: 'Night Shift',
    startTime: '20:00',
    endTime: '04:00',
    breakMinutes: 60,
    graceMinutes: 10,
    weekdays: [0, 1, 2, 3, 4, 5, 6],
  },
]

// Assigned schedules mock removed; hook up to Supabase later if needed

const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Helper to convert "HH:mm" to 12-hour e.g. "09:00 am"
function to12h(hhmm: string) {
  if (!hhmm) return hhmm
  const [hStr, mStr] = hhmm.split(':')
  let h = Number(hStr)
  const ampm = h >= 12 ? 'pm' : 'am'
  h = h % 12
  if (h === 0) h = 12
  const hPad = h < 10 ? `0${h}` : String(h)
  return `${hPad}:${mStr} ${ampm}`
}

export function Schedules() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [shiftTemplates, setShiftTemplates] = useState(initialShiftTemplates)
  const [editing, setEditing] = useState<null | (typeof initialShiftTemplates)[number]>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [form, setForm] = useState({
    id: '',
    name: '',
    startTime: '',
    endTime: '',
    breakMinutes: 0,
    graceMinutes: 0,
    weekdays: [] as number[],
  })
  const [assign, setAssign] = useState({
    employeeId: '',
    shiftId: '',
    startDate: '',
    endDate: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg] = useState<string | null>(null)
  const [templateSubmitting, setTemplateSubmitting] = useState(false)
  const [templateMsg, setTemplateMsg] = useState<string | null>(null)
  const [assigned, setAssigned] = useState<Array<{
    id: string
    employeeName: string
    shiftName: string
    startDate: string
    endDate?: string | null
    recurrence?: string
    details?: {
      startTime: string
      endTime: string
      breakMinutes: number
      graceMinutes: number
      weekdays: string[]
    }
  }>>([])

  // Employees from Supabase `user` table
  const [employees, setEmployees] = useState<Array<{ id: number | string; name: string; user_name?: string }>>([])
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [employeesError, setEmployeesError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoadingEmployees(true)
      setEmployeesError(null)
      const { data, error } = await supabase.from('user').select('id, name, user_name')
      if (error) {
        setEmployeesError('Failed to load employees')
      } else {
        setEmployees((data || []).map((r) => ({ id: r.id as any, name: (r as any).name || 'Unnamed', user_name: (r as any).user_name })))
      }
      setLoadingEmployees(false)
    }
    load()
  }, [])

  const loadSchedules = async (): Promise<void> => {
    const { data, error } = await supabase
      .from('schedule')
      .select('id, employee_name, shift_name, start_date, end_date, created_at')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setAssigned(
        data.map((row: any) => {
          const t = shiftTemplates.find((x) => x.name === row.shift_name)
          return {
            id: String(row.id),
            employeeName: row.employee_name as string,
            shiftName: row.shift_name as string,
            startDate: row.start_date as string,
            endDate: (row.end_date as string) || null,
            recurrence: 'weekly',
            // attach details if found
            details: t
              ? {
                  startTime: t.startTime,
                  endTime: t.endTime,
                  breakMinutes: t.breakMinutes,
                  graceMinutes: t.graceMinutes,
                  weekdays: t.weekdays.map((i) => weekdayNames[i]),
                }
              : undefined,
          }
        })
      )
    }
  }

  useEffect(() => {
    loadSchedules()
  }, [])

  // Load shift templates from Supabase `template` table
  useEffect(() => {
    const loadTemplates = async () => {
      const { data, error } = await supabase
        .from('template')
        .select('id, shift_name, start_time, end_time, break_time, grace, days')

      if (!error && data) {
        const mapped = data.map((row: any) => {
          let dayNames: string[] = []
          try {
            dayNames = JSON.parse(row.days || '[]')
          } catch {
            dayNames = []
          }
          const weekdays = dayNames
            .map((d) => weekdayNames.indexOf(d))
            .filter((i) => i >= 0)
          return {
            id: String(row.id),
            name: row.shift_name as string,
            startTime: (row.start_time as string) || '',
            endTime: (row.end_time as string) || '',
            breakMinutes: parseInt(row.break_time ?? '0', 10) || 0,
            graceMinutes: parseInt(row.grace ?? '0', 10) || 0,
            weekdays,
          }
        })
        setShiftTemplates(mapped)
      }
    }
    loadTemplates()
  }, [])

  // Reload schedules when templates change so details can be populated
  useEffect(() => {
    loadSchedules()
  }, [shiftTemplates])

  const openEdit = (tmpl: (typeof initialShiftTemplates)[number]) => {
    setEditing(tmpl)
    setIsCreating(false)
    setForm({
      id: tmpl.id,
      name: tmpl.name,
      startTime: tmpl.startTime,
      endTime: tmpl.endTime,
      breakMinutes: tmpl.breakMinutes,
      graceMinutes: tmpl.graceMinutes,
      weekdays: [...tmpl.weekdays],
    })
  }

  const openCreate = () => {
    const newId = `${Date.now()}`
    setIsCreating(true)
    setEditing({
      id: newId,
      name: 'New Shift',
      startTime: '09:00',
      endTime: '18:00',
      breakMinutes: 60,
      graceMinutes: 10,
      weekdays: [1,2,3,4,5],
    })
    setForm({
      id: newId,
      name: 'New Shift',
      startTime: '09:00',
      endTime: '18:00',
      breakMinutes: 60,
      graceMinutes: 10,
      weekdays: [1,2,3,4,5],
    })
  }

  const deleteTemplate = (id: string) => {
    setShiftTemplates((list) => list.filter((s) => s.id !== id))
  }

  const toggleWeekday = (i: number) => {
    setForm((f) => {
      const has = f.weekdays.includes(i)
      return { ...f, weekdays: has ? f.weekdays.filter((d) => d !== i) : [...f.weekdays, i] }
    })
  }

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTemplateMsg(null)
    // Update UI state
    setShiftTemplates((list) => {
      const exists = list.some((s) => s.id === form.id)
      if (exists) {
        return list.map((s) => (s.id === form.id ? { ...s, ...form } : s))
      }
      return [...list, { ...form } as any]
    })
    // Send to webhook
    setTemplateSubmitting(true)
    try {
      const res = await fetch('https://primary-production-6722.up.railway.app/webhook/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: form.id,
          name: form.name,
          startTime: to12h(form.startTime),
          endTime: to12h(form.endTime),
          breakMinutes: form.breakMinutes,
          graceMinutes: form.graceMinutes,
          weekdays: form.weekdays.map((i) => weekdayNames[i]),
          action: isCreating ? 'create' : 'update',
          createdAt: new Date().toISOString(),
        }),
      })
      const text = await res.text().catch(() => '')
      setTemplateMsg(res.ok ? 'Template saved' : `Failed to send: ${text || res.status}`)
      if (res.ok) {
        setEditing(null)
        setIsCreating(false)
      }
    } catch (err) {
      setTemplateMsg('Network error')
    } finally {
      setTemplateSubmitting(false)
    }
  }

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitMsg(null)
    if (!assign.employeeId || !assign.shiftId || !assign.startDate) {
      setSubmitMsg('Please select employee, shift, and start date')
      return
    }
    const shift = shiftTemplates.find((s) => s.id === assign.shiftId)
    const emp = employees.find((x) => String(x.id) === String(assign.employeeId))
    setSubmitting(true)
    try {
      const res = await fetch('https://primary-production-6722.up.railway.app/webhook/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: assign.employeeId,
          employeeName: emp?.name,
          user_name: emp?.user_name,
          shiftTemplateId: assign.shiftId,
          shiftName: shift?.name,
          startDate: assign.startDate,
          endDate: assign.endDate || null,
          schedule: shift ? {
            startTime: to12h(shift.startTime),
            endTime: to12h(shift.endTime),
            breakMinutes: shift.breakMinutes,
            graceMinutes: shift.graceMinutes,
            weekdays: shift.weekdays.map((i) => weekdayNames[i]),
          } : null,
          createdAt: new Date().toISOString(),
        }),
      })
      const text = await res.text().catch(() => '')
      // Determine success: HTTP ok AND (JSON {success:true} OR has id OR contains 'done')
      let payload: any = null
      try { payload = JSON.parse(text) } catch {}
      const logicalOk = res.ok && (
        (payload && (payload.success === true || payload.ok === true || payload.id)) || /\bdone\b/i.test(text)
      )
      setSubmitMsg(logicalOk ? 'Schedule sent' : `Failed to send: ${text || res.status}`)
      if (logicalOk) {
        await loadSchedules()
        setAssign({ employeeId: '', shiftId: '', startDate: '', endDate: '' })
      }
    } catch (err: any) {
      setSubmitMsg('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Schedules</h2>
          <p className="text-muted-foreground">Manage shift templates and employee schedules</p>
        </div>
        {/* New Schedule button moved to Assigned Schedules section */}
      </div>

      {/* Shift Templates */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Shift Templates</h3>
          <Button size="sm" onClick={openCreate}>Add Template</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shiftTemplates.map((shift) => (
            <Card key={shift.id} className="group">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">{shift.name}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(shift)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Edit template"
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteTemplate(shift.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete template"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {shift.startTime} - {shift.endTime}
                  </span>
                </div>
                
                <div className="text-sm">
                  <p className="text-muted-foreground">
                    Break: {shift.breakMinutes}m • Grace: {shift.graceMinutes}m
                  </p>
                </div>

                <div className="flex gap-1 flex-wrap">
                  {weekdayNames.map((day, index) => (
                    <Badge
                      key={index}
                      variant={shift.weekdays.includes(index) ? 'default' : 'outline'}
                      className="text-xs"
                    >
                      {day}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Assigned Schedules */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Assigned Schedules</h3>
          <Button onClick={() => setIsFormOpen(!isFormOpen)}>{isFormOpen ? 'Cancel' : 'New Schedule'}</Button>
        </div>
        {assigned.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              No schedules to display yet.
            </CardContent>
          </Card>
        ) : (
          assigned.map((s) => (
            <Card key={s.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold">{s.employeeName}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        {s.shiftName}
                        {s.details ? ` • ${s.details.startTime} - ${s.details.endTime}` : ''}
                      </span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>From {new Date(s.startDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {s.details && (
                      <>
                        <div className="text-sm text-muted-foreground">
                          Break: {s.details.breakMinutes}m • Grace: {s.details.graceMinutes}m
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {s.details.weekdays.map((d) => (
                            <Badge key={d} className="text-xs">{d}</Badge>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  <Badge variant="secondary">{s.recurrence || 'weekly'}</Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* New Schedule Form */}
      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>Assign New Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleAssign}>
              <div className="space-y-2">
                <label className="text-sm font-medium">Employee</label>
                <select 
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={assign.employeeId}
                  onChange={(e) => setAssign((a) => ({ ...a, employeeId: e.target.value }))}
                >
                  <option value="">{loadingEmployees ? 'Loading...' : 'Select employee'}</option>
                  {employees.map((e) => (
                    <option key={e.id} value={String(e.id)}>{e.name}</option>
                  ))}
                </select>
                {employeesError && (
                  <p className="text-xs text-red-600 mt-1">{employeesError}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Shift Template</label>
                <select 
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={assign.shiftId}
                  onChange={(e) => setAssign((a) => ({ ...a, shiftId: e.target.value }))}
                >
                  <option value="">Select shift</option>
                  {shiftTemplates.map((shift) => (
                    <option key={shift.id} value={shift.id}>
                      {shift.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <Input type="date" value={assign.startDate} onChange={(e) => setAssign((a) => ({ ...a, startDate: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date (Optional)</label>
                  <Input type="date" value={assign.endDate} onChange={(e) => setAssign((a) => ({ ...a, endDate: e.target.value }))} />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Sending...' : 'Assign Schedule'}
              </Button>
              {submitMsg && <p className="text-xs text-muted-foreground">{submitMsg}</p>}
            </form>
          </CardContent>
        </Card>
      )}

      {/* Edit Template Modal (simple overlay) */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Edit Shift Template</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveEdit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Time</label>
                    <Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">End Time</label>
                    <Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Break (minutes)</label>
                    <Input type="number" min={0} value={form.breakMinutes} onChange={(e) => setForm({ ...form, breakMinutes: Number(e.target.value) })} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Grace (minutes)</label>
                    <Input type="number" min={0} value={form.graceMinutes} onChange={(e) => setForm({ ...form, graceMinutes: Number(e.target.value) })} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Weekdays</label>
                  <div className="flex gap-1 flex-wrap">
                    {weekdayNames.map((d, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleWeekday(i)}
                        className={`px-2 py-1 rounded border text-xs ${form.weekdays.includes(i) ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'}`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setEditing(null)} disabled={templateSubmitting}>Cancel</Button>
                  <Button type="submit" disabled={templateSubmitting}>{templateSubmitting ? 'Saving...' : 'Save'}</Button>
                </div>
                {templateMsg && <p className="text-xs text-muted-foreground">{templateMsg}</p>}
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
