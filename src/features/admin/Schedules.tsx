import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Users } from 'lucide-react'

const mockShiftTemplates = [
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

const mockSchedules = [
  {
    id: '1',
    employee: 'John Doe',
    shift: 'Morning Shift',
    startDate: '2025-10-01',
    endDate: null,
    recurrence: 'weekly',
  },
  {
    id: '2',
    employee: 'Jane Smith',
    shift: 'Afternoon Shift',
    startDate: '2025-10-01',
    endDate: null,
    recurrence: 'weekly',
  },
]

const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function Schedules() {
  const [isFormOpen, setIsFormOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Schedules</h2>
          <p className="text-muted-foreground">Manage shift templates and employee schedules</p>
        </div>
        <Button onClick={() => setIsFormOpen(!isFormOpen)}>
          {isFormOpen ? 'Cancel' : 'New Schedule'}
        </Button>
      </div>

      {/* Shift Templates */}
      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Shift Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockShiftTemplates.map((shift) => (
            <Card key={shift.id}>
              <CardHeader>
                <CardTitle className="text-lg">{shift.name}</CardTitle>
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
        <h3 className="text-xl font-semibold">Assigned Schedules</h3>
        {mockSchedules.map((schedule) => (
          <Card key={schedule.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold">{schedule.employee}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{schedule.shift}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        From {new Date(schedule.startDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <Badge variant="secondary">{schedule.recurrence}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* New Schedule Form */}
      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>Assign New Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Employee</label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select employee</option>
                  <option value="1">John Doe</option>
                  <option value="2">Jane Smith</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Shift Template</label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select shift</option>
                  {mockShiftTemplates.map((shift) => (
                    <option key={shift.id} value={shift.id}>
                      {shift.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date (Optional)</label>
                  <Input type="date" />
                </div>
              </div>

              <Button type="submit" className="w-full">
                Assign Schedule
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
