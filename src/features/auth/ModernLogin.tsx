import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/useAuthStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ToggleGroup } from '@/components/ui/toggle-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Toast, ToastContainer } from '@/components/ui/toast'
import { 
  ArrowRightCircle, 
  Loader2,
  Lock,
  Eye,
  EyeOff,
  User
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

// Custom hook for login logic
function useLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'employee' | 'admin'>('employee')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rememberMe, setRememberMe] = useState(false)

  const validateUsername = (u: string): boolean => u.trim().length >= 3
  const validatePassword = (pwd: string): boolean => pwd.trim().length >= 6

  const signIn = async (): Promise<{ success: boolean; role: 'employee' | 'admin'; username: string; fullName?: string }> => {
    setError(null)
    setLoading(true)

    // Validate username
    if (!validateUsername(username)) {
      setLoading(false)
      setError('Please enter a valid username (min 3 characters)')
      return { success: false, role, username }
    }
    // Validate password
    if (!validatePassword(password)) {
      setLoading(false)
      setError('Please enter your password (min 6 characters)')
      return { success: false, role, username }
    }

    try {
      const { data, error: dbError } = await supabase
        .from('user')
        .select('id, user_name, password, name')
        .eq('user_name', username)
        .eq('password', password)
        .maybeSingle()

      setLoading(false)

      if (dbError) {
        setError('Login failed. Please try again later.')
        return { success: false, role, username }
      }

      if (!data) {
        setError('Invalid username or password')
        return { success: false, role, username }
      }

      return { success: true, role, username, fullName: data.name as string | undefined }
    } catch (e) {
      setLoading(false)
      setError('Login failed. Please try again later.')
      return { success: false, role, username }
    }
  }

  return {
    username,
    setUsername,
    password,
    setPassword,
    role,
    setRole,
    loading,
    error,
    setError,
    rememberMe,
    setRememberMe,
    signIn,
    isValid: validateUsername(username) && validatePassword(password)
  }
}

interface ModernLoginProps {
  onAuth?: (role: 'employee' | 'admin', username: string) => void
}

export default function ModernLogin({ onAuth }: ModernLoginProps) {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const {
    username,
    setUsername,
    password,
    setPassword,
    role,
    setRole,
    loading,
    error,
    setError,
    rememberMe,
    setRememberMe,
    signIn,
    isValid
  } = useLogin()

  const [toast, setToast] = useState<{
    show: boolean
    title: string
    description?: string
    variant: 'success' | 'error'
  }>({ show: false, title: '', variant: 'success' })

  const [emailError, setEmailError] = useState(false)
  const [passwordError, setPasswordError] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isValid) {
      // highlight which field is invalid
      if (username.trim().length < 3) {
        setEmailError(true)
        setTimeout(() => setEmailError(false), 500)
      }
      if (password.trim().length < 6) {
        setPasswordError(true)
        setTimeout(() => setPasswordError(false), 500)
      }
      return
    }

    const result = await signIn()
    
    if (result.success) {
      // Show success toast
      setToast({
        show: true,
        title: 'Success!',
        description: `Signed in as ${role.charAt(0).toUpperCase() + role.slice(1)}`,
        variant: 'success'
      })

      // Call auth callback
      onAuth?.(result.role, result.username)
      
      // Update auth store and navigate
      setTimeout(() => {
        login(result.username, result.role, result.fullName || 'John Doe')
        navigate(result.role === 'admin' ? '/admin' : '/employee')
      }, 1000)
    } else {
      setToast({
        show: true,
        title: 'Error',
        description: error || 'Failed to sign in',
        variant: 'error'
      })
    }
  }

  // SSO removed

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ ...toast, show: false })
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900">
      {/* Animated background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-100/50 via-transparent to-transparent dark:from-indigo-900/20" />
      
      {/* Toast notifications */}
      <AnimatePresence>
        {toast.show && (
          <ToastContainer>
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Toast
                title={toast.title}
                description={toast.description}
                variant={toast.variant}
                onClose={() => setToast({ ...toast, show: false })}
              />
            </motion.div>
          </ToastContainer>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-[420px]"
        >
          {/* Glassmorphic card */}
          <div className="relative rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-2xl shadow-blue-500/10 dark:shadow-indigo-500/10 p-8">
            {/* Brand icon with glow effect */}
            <motion.div 
              className="flex justify-center mb-6"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-blue-600 rounded-full blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <ArrowRightCircle className="w-8 h-8 text-white" strokeWidth={2.5} />
                </div>
              </div>
            </motion.div>

            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome to STAR
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Shift Time & Attendance Record
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username input */}
              <div className="space-y-2">
                <label 
                  htmlFor="username" 
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  User Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <motion.div
                    animate={emailError ? {
                      x: [0, -10, 10, -10, 10, 0],
                      transition: { duration: 0.4 }
                    } : {}}
                  >
                    <Input
                      id="username"
                      type="text"
                      placeholder="johndoe"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value)
                        setError(null)
                      }}
                      className={cn(
                        "pl-10 h-11 bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all",
                        error && "border-red-500 focus:ring-red-500"
                      )}
                      disabled={loading}
                      aria-invalid={!!error}
                      aria-describedby={error ? "username-error" : undefined}
                    />
                  </motion.div>
                </div>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    id="username-error"
                    className="text-xs text-red-600 dark:text-red-400"
                  >
                    {error}
                  </motion.p>
                )}
              </div>

              {/* Password input */}
              <div className="space-y-2">
                <label 
                  htmlFor="password" 
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <motion.div
                    animate={passwordError ? {
                      x: [0, -10, 10, -10, 10, 0],
                      transition: { duration: 0.4 }
                    } : {}}
                  >
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        setError(null)
                      }}
                      className={cn(
                        "pl-10 pr-10 h-11 bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all",
                        error && "border-red-500 focus:ring-red-500"
                      )}
                      disabled={loading}
                      aria-invalid={passwordError}
                    />
                  </motion.div>
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Role selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Login As
                </label>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <ToggleGroup
                    value={role}
                    onValueChange={(value) => setRole(value as 'employee' | 'admin')}
                    options={[
                      { value: 'employee', label: 'Employee' },
                      { value: 'admin', label: 'Admin' }
                    ]}
                    className="w-full"
                  />
                </motion.div>
              </div>

              {/* Remember me & Forgot password */}
              <div className="flex items-center justify-between">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  label="Remember me"
                />
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Sign in button */}
              <Button
                type="submit"
                disabled={loading || !isValid}
                className="w-full h-11 text-sm font-medium bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>

              {/* Demo mode helper */}
              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                Demo mode: Enter any username to continue
              </p>

              {/* Register link - Only for Employee */}
              {role === 'employee' && (
                <p className="text-sm text-center text-muted-foreground">
                  Don't have an account?{' '}
                  <a href="/register" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                    Create Account
                  </a>
                </p>
              )}

              {/* SSO removed */}
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
