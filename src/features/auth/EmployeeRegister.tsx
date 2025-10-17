import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/useAuthStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Toast, ToastContainer } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase'
import { 
  UserPlus, 
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  Loader2,
  CheckCircle2
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Custom hook for registration logic
function useRegister() {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  const validateUsername = (username: string): boolean => {
    return username.trim().length >= 3
  }
  

  const validatePhone = (phone: string): boolean => {
    return /^[\d\s\-\+\(\)]{10,}$/.test(phone)
  }

  const validatePassword = (pwd: string): boolean => {
    return pwd.trim().length >= 8
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }

    if (!validateUsername(formData.username)) {
      newErrors.username = 'Username must be at least 3 characters'
    }

    

    if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (!acceptedTerms) {
      newErrors.terms = 'You must accept the terms and conditions'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const register = async (): Promise<{ success: boolean; username: string }> => {
    if (!validateForm()) {
      return { success: false, username: formData.username }
    }

    setLoading(true)

    try {
      // Check username uniqueness in Supabase `user` table
      const { data: existingUser, error: uniqueErr } = await supabase
        .from('user')
        .select('id')
        .eq('user_name', formData.username)
        .maybeSingle()

      if (uniqueErr) {
        // Do not fail fast on read error; just log and continue
        console.warn('Supabase username check error:', uniqueErr)
      }
      if (existingUser) {
        setLoading(false)
        setErrors((prev) => ({ ...prev, username: 'Username already exists' }))
        return { success: false, username: formData.username }
      }

      const res = await fetch('https://southlandroofing.app.n8n.cloud/webhook/registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          username: formData.username,
          phone: formData.phone,
          password: formData.password,
          acceptedTerms,
          createdAt: new Date().toISOString()
        })
      })

      // Read response body text and consider it success only if it contains 'done'
      const text = await res.text().catch(() => '')
      const isDone = /\bdone\b/i.test(text)

      setLoading(false)
      return { success: res.ok && isDone, username: formData.username }
    } catch (err) {
      setLoading(false)
      return { success: false, username: formData.username }
    }
  }

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  return {
    formData,
    updateField,
    loading,
    errors,
    acceptedTerms,
    setAcceptedTerms,
    register,
    isValid: validateForm,
  }
}

interface EmployeeRegisterProps {
  onRegister?: (username: string) => void
}

export default function EmployeeRegister({ onRegister }: EmployeeRegisterProps) {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const {
    formData,
    updateField,
    loading,
    errors,
    acceptedTerms,
    setAcceptedTerms,
    register,
  } = useRegister()

  const [toast, setToast] = useState<{
    show: boolean
    title: string
    description?: string
    variant: 'success' | 'error'
  }>({ show: false, title: '', variant: 'success' })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Highlight fields with errors
    const errorFields: Record<string, boolean> = {}
    Object.keys(errors).forEach((key) => {
      errorFields[key] = true
    })
    setFieldErrors(errorFields)
    
    // Clear highlights after animation
    setTimeout(() => setFieldErrors({}), 500)

    if (Object.keys(errors).length > 0) {
      setToast({
        show: true,
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        variant: 'error'
      })
      return
    }

    const result = await register()
    
    if (result.success) {
      // Show success toast
      setToast({
        show: true,
        title: 'Registration Successful!',
        description: 'Your account has been created. Redirecting to login...',
        variant: 'success'
      })

      // Call callback
      onRegister?.(result.username)

      // Navigate back to login after short delay
      setTimeout(() => {
        navigate('/login')
      }, 1200)
    } else {
      setToast({
        show: true,
        title: 'Registration Failed',
        description: 'Unable to create account. Please try again.',
        variant: 'error'
      })
    }
  }

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
          className="w-full max-w-[480px]"
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
                  <UserPlus className="w-8 h-8 text-white" strokeWidth={2.5} />
                </div>
              </div>
            </motion.div>

            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Join STAR
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create your employee account
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <motion.div
                    animate={fieldErrors.fullName ? {
                      x: [0, -10, 10, -10, 10, 0],
                      transition: { duration: 0.4 }
                    } : {}}
                  >
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={(e) => updateField('fullName', e.target.value)}
                      className={cn(
                        "pl-10 h-11 bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all",
                        errors.fullName && "border-red-500 focus:ring-red-500"
                      )}
                      disabled={loading}
                      aria-invalid={!!errors.fullName}
                      required
                    />
                  </motion.div>
                </div>
                {errors.fullName && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-600 dark:text-red-400"
                  >
                    {errors.fullName}
                  </motion.p>
                )}
              </div>

              {/* Email removed as requested */}

              {/* Username */}
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  User Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <motion.div
                    animate={fieldErrors.username ? {
                      x: [0, -10, 10, -10, 10, 0],
                      transition: { duration: 0.4 }
                    } : {}}
                  >
                    <Input
                      id="username"
                      type="text"
                      placeholder="johndoe"
                      value={formData.username}
                      onChange={(e) => updateField('username', e.target.value)}
                      className={cn(
                        "pl-10 h-11 bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all",
                        errors.username && "border-red-500 focus:ring-red-500"
                      )}
                      disabled={loading}
                      aria-invalid={!!errors.username}
                      required
                    />
                  </motion.div>
                </div>
                {errors.username && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-600 dark:text-red-400"
                  >
                    {errors.username}
                  </motion.p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <motion.div
                    animate={fieldErrors.phone ? {
                      x: [0, -10, 10, -10, 10, 0],
                      transition: { duration: 0.4 }
                    } : {}}
                  >
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      className={cn(
                        "pl-10 h-11 bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all",
                        errors.phone && "border-red-500 focus:ring-red-500"
                      )}
                      disabled={loading}
                      aria-invalid={!!errors.phone}
                      required
                    />
                  </motion.div>
                </div>
                {errors.phone && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-600 dark:text-red-400"
                  >
                    {errors.phone}
                  </motion.p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <motion.div
                    animate={fieldErrors.password ? {
                      x: [0, -10, 10, -10, 10, 0],
                      transition: { duration: 0.4 }
                    } : {}}
                  >
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => updateField('password', e.target.value)}
                      className={cn(
                        "pl-10 pr-10 h-11 bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all",
                        errors.password && "border-red-500 focus:ring-red-500"
                      )}
                      disabled={loading}
                      aria-invalid={!!errors.password}
                      required
                    />
                  </motion.div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-600 dark:text-red-400"
                  >
                    {errors.password}
                  </motion.p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <motion.div
                    animate={fieldErrors.confirmPassword ? {
                      x: [0, -10, 10, -10, 10, 0],
                      transition: { duration: 0.4 }
                    } : {}}
                  >
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => updateField('confirmPassword', e.target.value)}
                      className={cn(
                        "pl-10 pr-10 h-11 bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all",
                        errors.confirmPassword && "border-red-500 focus:ring-red-500"
                      )}
                      disabled={loading}
                      aria-invalid={!!errors.confirmPassword}
                      required
                    />
                  </motion.div>
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-600 dark:text-red-400"
                  >
                    {errors.confirmPassword}
                  </motion.p>
                )}
              </div>

              {/* Terms and Conditions */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                  />
                  <label htmlFor="terms" className="text-sm cursor-pointer">
                    I agree to the{' '}
                    <a href="#" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                      Terms and Conditions
                    </a>
                  </label>
                </div>
                {errors.terms && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-600 dark:text-red-400"
                  >
                    {errors.terms}
                  </motion.p>
                )}
              </div>

              {/* Register button */}
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  disabled={
                    loading ||
                    !acceptedTerms ||
                    !formData.fullName ||
                    !formData.username ||
                    !formData.phone ||
                    !formData.password ||
                    !formData.confirmPassword
                  }
                  className="w-full h-11 text-sm font-medium bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Create Account
                    </>
                  )}
                </Button>
              </motion.div>

              {/* Demo mode helper */}
              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                Demo mode: Fill all fields to continue
              </p>

              {/* Login link */}
              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                  Sign in
                </Link>
              </p>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
