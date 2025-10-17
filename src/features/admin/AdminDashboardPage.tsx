import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Users, 
  Clock, 
  AlertCircle, 
  Coffee, 
  TrendingUp, 
  Search,
  MoreVertical,
  MessageSquare,
  Flag,
  User,
  RefreshCw,
  MapPin,
  X
} from 'lucide-react'

// Mock data with types
interface Employee {
  id: string
  name: string
  clockIn: string
  status: 'working' | 'break'
  location: string
  duration: string
  lateBy?: number
}

interface KPIStat {
  label: string
  value: number
  delta: string
  icon: React.ElementType
  color: string
  sparkline: number[]
}

const mockStats: KPIStat[] = [
  {
    label: 'Present Today',
    value: 24,
    delta: '+2 from yesterday',
    icon: Users,
    color: 'text-emerald-600',
    sparkline: [18, 20, 19, 22, 21, 23, 24],
  },
  {
    label: 'Late Today',
    value: 3,
    delta: 'Avg 8 min late',
    icon: Clock,
    color: 'text-amber-600',
    sparkline: [5, 4, 6, 3, 4, 2, 3],
  },
  {
    label: 'On Break',
    value: 5,
    delta: 'Currently active',
    icon: Coffee,
    color: 'text-sky-600',
    sparkline: [3, 4, 3, 5, 4, 6, 5],
  },
  {
    label: 'Flags',
    value: 2,
    delta: 'Missing clock-out',
    icon: AlertCircle,
    color: 'text-rose-600',
    sparkline: [4, 3, 2, 3, 1, 2, 2],
  },
]

const mockActiveEmployees: Employee[] = [
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
  {
    id: '5',
    name: 'David Brown',
    clockIn: '09:00 AM',
    status: 'working',
    location: 'Branch Office',
    duration: '3h 20m',
  },
]

// Sparkline SVG component
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const width = 80
  const height = 24
  const points = data
    .map((value, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((value - min) / range) * height
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg width={width} height={height} className="opacity-60">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        points={points}
        className={color}
      />
    </svg>
  )
}

export function AdminDashboardPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSite, setSelectedSite] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)

  const filteredEmployees = mockActiveEmployees.filter((emp) => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSite = !selectedSite || emp.location === selectedSite
    const matchesStatus = !selectedStatus || emp.status === selectedStatus
    return matchesSearch && matchesSite && matchesStatus
  })

  const sites = Array.from(new Set(mockActiveEmployees.map((e) => e.location)))

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedSite(null)
    setSelectedStatus(null)
  }

  const hasFilters = searchQuery || selectedSite || selectedStatus

  return (
    <div className="space-y-4 md:space-y-6 px-4 sm:px-6 lg:px-10">
      {/* Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-sm md:text-base text-muted-foreground">Real-time attendance overview</p>
      </div>

      {/* Hero KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {mockStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <Card className="rounded-xl md:rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border-white/60 dark:border-white/10">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 md:space-y-2">
                      <p className="text-xs md:text-sm font-medium text-muted-foreground">
                        {stat.label}
                      </p>
                      <p className={`text-2xl md:text-3xl font-bold ${stat.color}`}>
                        {stat.value}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <TrendingUp className="w-3 h-3" />
                        <span className="hidden sm:inline">{stat.delta}</span>
                        <span className="sm:hidden">{stat.delta.split(' ')[0]}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 md:gap-2">
                      <Icon className={`w-4 h-4 md:w-5 md:h-5 ${stat.color} opacity-60`} />
                      <div className="hidden sm:block">
                        <Sparkline data={stat.sparkline} color={stat.color} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Who's In Now */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.2 }}
      >
        <Card className="rounded-xl md:rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border-white/60 dark:border-white/10">
          <CardHeader className="px-4 md:px-6">
            <CardTitle className="text-base md:text-lg">Who's In Now</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-4 md:px-6">
            {/* Filter Row */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 pb-4 border-b">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 w-full"
                />
              </div>

              <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                {sites.map((site) => (
                  <Badge
                    key={site}
                    variant={selectedSite === site ? 'default' : 'outline'}
                    className="cursor-pointer text-xs whitespace-nowrap"
                    onClick={() => setSelectedSite(selectedSite === site ? null : site)}
                  >
                    <MapPin className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">{site}</span>
                    <span className="sm:hidden">{site.split(' ')[0]}</span>
                  </Badge>
                ))}

                <Badge
                  variant={selectedStatus === 'working' ? 'default' : 'outline'}
                  className="cursor-pointer text-xs whitespace-nowrap"
                  onClick={() =>
                    setSelectedStatus(selectedStatus === 'working' ? null : 'working')
                  }
                >
                  Working
                </Badge>

                <Badge
                  variant={selectedStatus === 'break' ? 'default' : 'outline'}
                  className="cursor-pointer text-xs whitespace-nowrap"
                  onClick={() =>
                    setSelectedStatus(selectedStatus === 'break' ? null : 'break')
                  }
                >
                  <span className="hidden sm:inline">On Break</span>
                  <span className="sm:hidden">Break</span>
                </Badge>

                {hasFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-7 px-2 text-xs"
                  >
                    <X className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">Clear</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Employee List */}
            <div className="space-y-3">
              {filteredEmployees.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No employees match your filters</p>
                </div>
              ) : (
                filteredEmployees.map((employee) => {
                  const initials = employee.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')

                  return (
                    <motion.div
                      key={employee.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 md:p-4 rounded-xl border bg-card hover:shadow-md transition-shadow gap-3"
                    >
                      <div className="flex items-center gap-3 md:gap-4 min-w-0">
                        <div className="w-10 h-10 flex-shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm md:text-base truncate">{employee.name}</p>
                          <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground flex-wrap">
                            <Clock className="w-3 h-3 flex-shrink-0" />
                            <span className="whitespace-nowrap">In: {employee.clockIn}</span>
                            <span className="hidden sm:inline">•</span>
                            <span className="whitespace-nowrap">{employee.duration}</span>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            {employee.location}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 md:gap-3 justify-between sm:justify-end">
                        <div className="flex gap-1.5 md:gap-2 flex-wrap">
                          {employee.status === 'break' ? (
                            <Badge
                              variant="secondary"
                              className="bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200 text-xs whitespace-nowrap"
                            >
                              <span className="hidden sm:inline">On Break</span>
                              <span className="sm:hidden">Break</span>
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200 text-xs whitespace-nowrap"
                            >
                              Working
                            </Badge>
                          )}
                          {employee.lateBy && (
                            <Badge
                              variant="secondary"
                              className="bg-rose-100 text-rose-800 dark:bg-rose-900/20 dark:text-rose-200 text-xs whitespace-nowrap"
                            >
                              Late {employee.lateBy}m
                            </Badge>
                          )}
                        </div>

                        {/* Quick Actions Dropdown */}
                        <div className="relative group flex-shrink-0">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                          <div className="absolute right-0 top-full mt-1 w-40 bg-popover border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            <button className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted rounded-t-lg">
                              <User className="w-4 h-4" />
                              View Profile
                            </button>
                            <button className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted">
                              <MessageSquare className="w-4 h-4" />
                              Message
                            </button>
                            <button className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted rounded-b-lg text-rose-600">
                              <Flag className="w-4 h-4" />
                              Flag
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Live Location Map */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.3 }}
      >
        <Card className="rounded-xl md:rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border-white/60 dark:border-white/10">
          <CardHeader className="px-4 md:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="text-base md:text-lg">Live Location Map</CardTitle>
              <div className="flex items-center gap-2">
                <select className="h-8 px-2 text-xs md:text-sm border rounded-md bg-background flex-1 sm:flex-initial">
                  <option>All Sites</option>
                  <option>Main Office</option>
                  <option>Branch Office</option>
                </select>
                <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 md:px-6">
            <div className="w-full h-48 md:h-64 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-xl flex items-center justify-center border">
              <div className="text-center px-4">
                <MapPin className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm md:text-base text-muted-foreground font-medium">Map view with employee locations</p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {filteredEmployees.length} employees currently tracked
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
