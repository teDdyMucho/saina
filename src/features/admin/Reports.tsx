import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Download, Filter, Calendar } from 'lucide-react'

const mockReportData = [
  {
    id: '1',
    employee: 'John Doe',
    department: 'Engineering',
    daysWorked: 20,
    totalHours: 160,
    lateCount: 2,
    absences: 0,
  },
  {
    id: '2',
    employee: 'Jane Smith',
    department: 'Marketing',
    daysWorked: 19,
    totalHours: 152,
    lateCount: 1,
    absences: 1,
  },
  {
    id: '3',
    employee: 'Mike Johnson',
    department: 'Sales',
    daysWorked: 21,
    totalHours: 168,
    lateCount: 0,
    absences: 0,
  },
  {
    id: '4',
    employee: 'Sarah Williams',
    department: 'Engineering',
    daysWorked: 18,
    totalHours: 144,
    lateCount: 3,
    absences: 2,
  },
]

export function Reports() {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    department: '',
    employee: '',
  })

  const handleExport = () => {
    alert('Exporting report as CSV...')
  }

  return (
    <div className="space-y-4 md:space-y-6 px-4 sm:px-6 lg:px-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Reports</h2>
          <p className="text-sm md:text-base text-muted-foreground">Generate and export attendance reports</p>
        </div>
        <Button onClick={handleExport} className="w-full sm:w-auto">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
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
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs md:text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs md:text-sm font-medium">Department</label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-xs md:text-sm"
                value={filters.department}
                onChange={(e) =>
                  setFilters({ ...filters, department: e.target.value })
                }
              >
                <option value="">All Departments</option>
                <option value="engineering">Engineering</option>
                <option value="marketing">Marketing</option>
                <option value="sales">Sales</option>
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
            <Button className="w-full sm:w-auto text-xs md:text-sm">Apply Filters</Button>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="rounded-xl md:rounded-2xl">
          <CardHeader className="pb-2 px-3 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium">Total Employees</CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            <div className="text-xl md:text-2xl font-bold">{mockReportData.length}</div>
          </CardContent>
        </Card>

        <Card className="rounded-xl md:rounded-2xl">
          <CardHeader className="pb-2 px-3 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium">Total Hours</CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            <div className="text-xl md:text-2xl font-bold">
              {mockReportData.reduce((sum, emp) => sum + emp.totalHours, 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl md:rounded-2xl">
          <CardHeader className="pb-2 px-3 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium">Late Incidents</CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            <div className="text-xl md:text-2xl font-bold text-yellow-600">
              {mockReportData.reduce((sum, emp) => sum + emp.lateCount, 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl md:rounded-2xl">
          <CardHeader className="pb-2 px-3 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium">Absences</CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            <div className="text-xl md:text-2xl font-bold text-red-600">
              {mockReportData.reduce((sum, emp) => sum + emp.absences, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Table */}
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
                  <th className="text-left p-2 md:p-4 font-medium text-xs md:text-sm hidden sm:table-cell">Department</th>
                  <th className="text-right p-2 md:p-4 font-medium text-xs md:text-sm">Days</th>
                  <th className="text-right p-2 md:p-4 font-medium text-xs md:text-sm">Hours</th>
                  <th className="text-right p-2 md:p-4 font-medium text-xs md:text-sm hidden md:table-cell">Late</th>
                  <th className="text-right p-2 md:p-4 font-medium text-xs md:text-sm hidden md:table-cell">Absences</th>
                  <th className="text-right p-2 md:p-4 font-medium text-xs md:text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {mockReportData.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-muted/50">
                    <td className="p-2 md:p-4 font-medium text-xs md:text-sm">
                      <div>{row.employee}</div>
                      <div className="text-xs text-muted-foreground sm:hidden">{row.department}</div>
                    </td>
                    <td className="p-2 md:p-4 text-xs md:text-sm hidden sm:table-cell">{row.department}</td>
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
    </div>
  )
}
