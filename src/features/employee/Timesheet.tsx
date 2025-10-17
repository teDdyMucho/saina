import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock } from 'lucide-react'
import { formatDuration } from '@/lib/utils'

const mockTimesheets = [
  {
    id: '1',
    date: '2025-10-16',
    clockIn: '09:05 AM',
    clockOut: '05:30 PM',
    workedMinutes: 485,
    breakMinutes: 60,
    lateMinutes: 5,
    flags: ['late'],
  },
  {
    id: '2',
    date: '2025-10-15',
    clockIn: '08:58 AM',
    clockOut: '05:00 PM',
    workedMinutes: 482,
    breakMinutes: 60,
    lateMinutes: 0,
    flags: [],
  },
  {
    id: '3',
    date: '2025-10-14',
    clockIn: '09:00 AM',
    clockOut: '05:15 PM',
    workedMinutes: 495,
    breakMinutes: 60,
    lateMinutes: 0,
    flags: [],
  },
]

export function Timesheet() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Timesheet</h2>
        <p className="text-muted-foreground">View your attendance history</p>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>This Week Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">24h 12m</p>
              <p className="text-sm text-muted-foreground">Total Worked</p>
            </div>
            <div>
              <p className="text-2xl font-bold">3h</p>
              <p className="text-sm text-muted-foreground">Total Break</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">5m</p>
              <p className="text-sm text-muted-foreground">Late Minutes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timesheet List */}
      <div className="space-y-3">
        {mockTimesheets.map((entry) => (
          <Card key={entry.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold">
                      {new Date(entry.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span>In: {entry.clockIn}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span>Out: {entry.clockOut}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 text-sm">
                    <span className="text-muted-foreground">
                      Worked: <strong>{formatDuration(entry.workedMinutes)}</strong>
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">
                      Break: <strong>{formatDuration(entry.breakMinutes)}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 items-end">
                  {entry.flags.includes('late') && (
                    <Badge variant="warning">
                      Late {formatDuration(entry.lateMinutes)}
                    </Badge>
                  )}
                  {entry.flags.length === 0 && (
                    <Badge variant="success">On Time</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
