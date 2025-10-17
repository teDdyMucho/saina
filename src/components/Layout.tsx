import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Button } from './ui/button'
import { useAuthStore } from '@/stores/useAuthStore'
import { useThemeStore } from '@/stores/useThemeStore'
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  FileText,
  Settings,
  LogOut,
  Home,
  Clock,
  FileCheck,
  Moon,
  Sun,
  Menu,
  X,
  Timer,
} from 'lucide-react'
import { useMemo, useState } from 'react'

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore()
  const { isDark, toggleTheme } = useThemeStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Helpers
  const initials = useMemo(() => {
    const n = user?.name || 'User'
    const parts = n.trim().split(' ')
    const first = parts[0]?.[0] ?? 'U'
    const second = parts[1]?.[0] ?? ''
    return (first + second).toUpperCase()
  }, [user?.name])

  // Mock next shift: 09:00 today or tomorrow
  const nextShiftIn = useMemo(() => {
    const now = new Date()
    const target = new Date(now)
    target.setHours(9, 0, 0, 0)
    if (now > target) {
      target.setDate(target.getDate() + 1)
    }
    const diffMs = target.getTime() - now.getTime()
    const h = Math.floor(diffMs / 3600000)
    const m = Math.floor((diffMs % 3600000) / 60000)
    return `${h}h ${m}m`
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isAdmin = user?.role === 'admin'

  const adminLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/schedules', icon: Calendar, label: 'Schedules' },
    { to: '/admin/approvals', icon: CheckSquare, label: 'Approvals' },
    { to: '/admin/reports', icon: FileText, label: 'Reports' },
  ]

  const employeeLinks = [
    { to: '/employee', icon: Home, label: 'Home' },
    { to: '/employee/timesheet', icon: Clock, label: 'Timesheet' },
    { to: '/employee/leave', icon: FileCheck, label: 'Leave' },
  ]

  const links = isAdmin ? adminLinks : employeeLinks

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100 dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-4">
          <div className="flex items-center gap-2">
            <button
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
            <Link to={isAdmin ? '/admin' : '/employee'} className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">S</span>
              </div>
              <span className="font-bold text-xl hidden md:inline">STAR</span>
            </Link>
          </div>

          {/* Right cluster: next shift, theme, user */}
          <div className="ml-auto flex items-center gap-4">
            {/* Next shift micro-summary */}
            {!isAdmin && (
              <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground px-2 py-1 rounded-md border">
                <Timer className="w-3.5 h-3.5" />
                <span>Next shift in</span>
                <span className="font-medium text-foreground">{nextShiftIn}</span>
              </div>
            )}

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>

            {/* User avatar + role pill + actions */}
            <div className="hidden md:flex items-center gap-3">
              <div className="h-8 px-2 rounded-full border text-xs capitalize flex items-center">
                {user?.role}
              </div>
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                {initials}
              </div>
              <div className="text-sm leading-tight">
                <p className="font-medium line-clamp-1 max-w-[140px]">{user?.name}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{user?.email}</p>
              </div>
            </div>

            <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-64 border-r min-h-[calc(100vh-4rem)] p-4">
          <nav className="space-y-2">
            {links.map((link) => {
              const Icon = link.icon
              const isActive = location.pathname === link.to
              return (
                <Link key={link.to} to={link.to}>
                  <div
                    className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                      isActive
                        ? 'bg-primary/90 text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{link.label}</span>
                  </div>
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm">
            <aside className="fixed left-0 top-16 bottom-0 w-64 border-r bg-background p-4">
              <nav className="space-y-2">
                {links.map((link) => {
                  const Icon = link.icon
                  const isActive = location.pathname === link.to
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div
                        className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{link.label}</span>
                      </div>
                    </Link>
                  )
                })}
              </nav>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
