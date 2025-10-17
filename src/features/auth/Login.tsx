import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/useAuthStore'
import { LogIn } from 'lucide-react'

export function Login() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'employee'>('employee')
  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      login(email, role)
      navigate(role === 'admin' ? '/admin' : '/employee')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <LogIn className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Welcome to STAR</CardTitle>
          <CardDescription className="text-center">
            Shift Time & Attendance Record
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="your.email@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Login As</label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={role === 'employee' ? 'default' : 'outline'}
                  onClick={() => setRole('employee')}
                  className="w-full"
                >
                  Employee
                </Button>
                <Button
                  type="button"
                  variant={role === 'admin' ? 'default' : 'outline'}
                  onClick={() => setRole('admin')}
                  className="w-full"
                >
                  Admin
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg">
              Sign In
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-4">
              Demo mode - Enter any email to continue
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
