import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Clock, AlertCircle, Coffee, TrendingUp } from 'lucide-react'

const mockStats = {
  present: 24,
  late: 3,
  onBreak: 5,
  missingClockOut: 2,
}

const mockActiveEmployees = [
  {
    id: '1',
    name: 'John Doe',
    clockIn: '08:55 AM',
    status: 'working',
    location: 'Main Office',
    duration: '3h 25m',
  },
  {
    id: '2',
    name: 'Jane Smith',
    clockIn: '09:10 AM',
    status: 'break',
    location: 'Main Office',
    duration: '3h 10m',
    lateBy: 10,
  },
  {
    id: '3',
    name: 'Mike Johnson',
    clockIn: '08:58 AM',
    status: 'working',
    location: 'Branch Office',
    duration: '3h 22m',
  },
  {
    id: '4',
    name: 'Sarah Williams',
    clockIn: '09:15 AM',
    status: 'working',
    location: 'Main Office',
    duration: '3h 5m',
    lateBy: 15,
  },
]

export function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Real-time attendance overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.present}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline w-3 h-3" /> +2 from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{mockStats.late}</div>
            <p className="text-xs text-muted-foreground">Average: 8 minutes late</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Break</CardTitle>
            <Coffee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.onBreak}</div>
            <p className="text-xs text-muted-foreground">Currently on break</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flags</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {mockStats.missingClockOut}
            </div>
            <p className="text-xs text-muted-foreground">Missing clock-out</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Employees */}
      <Card>
        <CardHeader>
          <CardTitle>Who's In Now</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockActiveEmployees.map((employee) => (
              <div
                key={employee.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-semibold text-primary">
                      {employee.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold">{employee.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>In: {employee.clockIn}</span>
                      <span>•</span>
                      <span>{employee.duration}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{employee.location}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {employee.status === 'break' ? (
                    <Badge variant="warning">On Break</Badge>
                  ) : (
                    <Badge variant="success">Working</Badge>
                  )}
                  {employee.lateBy && (
                    <Badge variant="destructive">Late {employee.lateBy}m</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Map Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Live Location Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Map view with employee locations</p>
              <p className="text-sm text-muted-foreground">24 employees currently tracked</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
