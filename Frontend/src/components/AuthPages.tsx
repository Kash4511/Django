import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, User, Mail, Phone, Lock } from 'lucide-react'
import axios from 'axios'
import './AuthPages.css'

interface AuthPagesProps {
  onLogin: (userData: { name?: string; email?: string }) => void
  onClose: () => void
  initialMode?: 'login' | 'signup'
}

const AuthPages: React.FC<AuthPagesProps> = ({ onLogin, onClose, initialMode = 'login' }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login')
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone_number: '',
    password: '',
    password_confirm: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Client-side validation for signup
    if (!isLogin) {
      if (formData.password !== formData.password_confirm) {
        setError('Passwords do not match.')
        setLoading(false)
        return
      }
      if (!formData.name.trim()) {
        setError('Full name is required.')
        setLoading(false)
        return
      }
      if (!formData.password_confirm.trim()) {
        setError('Please confirm your password.')
        setLoading(false)
        return
      }
    }

    try {
      const endpoint = isLogin ? '/api/auth/login/' : '/api/auth/register/'
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData

      // Construct API base URL - use current origin in Replit environment
      let apiBase = import.meta.env.VITE_API_BASE_URL
      
      if (!apiBase) {
        if (window.location.hostname.includes('replit.dev')) {
          // In Replit environment, use the same domain but port 8000
          apiBase = `${window.location.protocol}//${window.location.hostname}:8000`
        } else {
          // Local development
          apiBase = `${window.location.protocol}//${window.location.hostname}:8000`
        }
      }
      
      console.log('Making API request to:', `${apiBase}${endpoint}`)
      console.log('Payload:', payload)
      
      const response = await axios.post(`${apiBase}${endpoint}`, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      })

      const data = response.data
      console.log('API Response:', data)

      if (data.access && data.refresh) {
        localStorage.setItem('access_token', data.access)
        localStorage.setItem('refresh_token', data.refresh)
        
        // Fetch user profile after successful authentication
        try {
          const profileResponse = await axios.get(`${apiBase}/api/auth/profile/`, {
            headers: {
              'Authorization': `Bearer ${data.access}`,
              'Content-Type': 'application/json'
            },
            timeout: 5000
          })
          onLogin(profileResponse.data)
        } catch {
          // Fallback to user data from response or minimal user object
          onLogin(data.user || { name: 'User', email: formData.email })
        }
      } else {
        setError('Invalid response from server. Please try again.')
      }
    } catch (err: unknown) {
      console.error('API error:', err)
      const asObj = err as Record<string, unknown>
      const response = asObj.response as { data?: unknown } | undefined
      const data = response?.data
      if (data && typeof data === 'object') {
        const errorData = data as Record<string, unknown>
        if (Array.isArray(errorData.email) && typeof errorData.email[0] === 'string') {
          setError(errorData.email[0] as string)
        } else if (Array.isArray(errorData.password) && typeof errorData.password[0] === 'string') {
          setError(errorData.password[0] as string)
        } else if (Array.isArray(errorData.non_field_errors) && typeof errorData.non_field_errors[0] === 'string') {
          setError(errorData.non_field_errors[0] as string)
        } else if (typeof errorData.detail === 'string') {
          setError(errorData.detail as string)
        } else {
          setError('Authentication failed. Please check your information.')
        }
      } else if (
        (asObj.code === 'ECONNABORTED') ||
        (typeof asObj.message === 'string' && (asObj.message as string).includes('timeout'))
      ) {
        setError('Request timed out. Please try again.')
      } else if (asObj.request) {
        setError('Unable to connect to server. Please check your connection and try again.')
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-overlay" onClick={onClose}>
      <motion.div
        className="auth-modal"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="auth-header">
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p>{isLogin ? 'Sign in to your account' : 'Join us to create amazing PDFs'}</p>
          <button className="auth-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <motion.div
              className="auth-error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={20} />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          {!isLogin && (
            <>
              <div className="auth-field">
                <label htmlFor="name">Full Name</label>
                <div className="input-wrapper">
                  <User className="input-icon" size={20} />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="phone_number">Phone Number</label>
                <div className="input-wrapper">
                  <Phone className="input-icon" size={20} />
                  <input
                    type="tel"
                    id="phone_number"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>
            </>
          )}

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="auth-field">
              <label htmlFor="password_confirm">Confirm Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password_confirm"
                  name="password_confirm"
                  value={formData.password_confirm}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  required
                />
              </div>
            </div>
          )}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Create Account')}
          </button>
        </form>

        <div className="auth-switch">
          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="auth-switch-btn"
            >
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default AuthPages