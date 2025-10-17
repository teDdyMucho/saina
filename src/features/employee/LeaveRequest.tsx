import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Calendar, FileText } from 'lucide-react'

const mockLeaveTypes = [
  { id: '1', name: 'Annual Leave', balance: 120 },
  { id: '2', name: 'Sick Leave', balance: 80 },
  { id: '3', name: 'Personal Leave', balance: 40 },
]

const mockLeaveRequests = [
  {
    id: '1',
    type: 'Annual Leave',
    startDate: '2025-10-25',
    endDate: '2025-10-27',
    days: 3,
    status: 'pending' as const,
    note: 'Family vacation',
  },
  {
    id: '2',
    type: 'Sick Leave',
    startDate: '2025-10-10',
    endDate: '2025-10-10',
    days: 1,
    status: 'approved' as const,
    note: 'Medical appointment',
  },
]

export function LeaveRequest() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    note: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert('Leave request submitted!')
    setIsFormOpen(false)
    setFormData({ leaveType: '', startDate: '', endDate: '', note: '' })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Leave Management</h2>
          <p className="text-muted-foreground">Request time off and view your balances</p>
        </div>
        <Button onClick={() => setIsFormOpen(!isFormOpen)}>
          {isFormOpen ? 'Cancel' : 'Request Leave'}
        </Button>
      </div>

      {/* Leave Balances */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockLeaveTypes.map((type) => (
              <div key={type.id} className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">{type.name}</p>
                <p className="text-2xl font-bold">
                  {Math.floor(type.balance / 60)}h {type.balance % 60}m
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Request Form */}
      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>New Leave Request</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Leave Type</label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.leaveType}
                  onChange={(e) =>
                    setFormData({ ...formData, leaveType: e.target.value })
                  }
                  required
                >
                  <option value="">Select leave type</option>
                  {mockLeaveTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Note (Optional)</label>
                <textarea
                  className="w-full min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Reason for leave..."
                  value={formData.note}
                  onChange={(e) =>
                    setFormData({ ...formData, note: e.target.value })
                  }
                />
              </div>

              <Button type="submit" className="w-full">
                Submit Request
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Leave History */}
      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Leave Requests</h3>
        {mockLeaveRequests.map((request) => (
          <Card key={request.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold">{request.type}</span>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    {new Date(request.startDate).toLocaleDateString()} -{' '}
                    {new Date(request.endDate).toLocaleDateString()}
                    <span className="ml-2">({request.days} day{request.days > 1 ? 's' : ''})</span>
                  </div>

                  {request.note && (
                    <div className="flex items-start gap-2 text-sm">
                      <FileText className="w-3 h-3 text-muted-foreground mt-0.5" />
                      <span className="text-muted-foreground">{request.note}</span>
                    </div>
                  )}
                </div>

                <Badge
                  variant={
                    request.status === 'approved'
                      ? 'success'
                      : request.status === 'pending'
                      ? 'warning'
                      : 'destructive'
                  }
                >
                  {request.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
