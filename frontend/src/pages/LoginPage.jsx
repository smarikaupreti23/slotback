import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import AppButton from '../components/AppButton'
import FormSectionWrapper from '../components/FormSectionWrapper'
import InputField from '../components/InputField'
import { api, getToken, saveSession } from '../lib/api'

// LoginPage — Screen 1
// Real authentication via the backend (Supabase Auth). Same validation as the MVP,
// plus a "create account" mode so a new coordinator can register.

export default function LoginPage() {
  const navigate = useNavigate()

  const [mode, setMode]         = useState('signin') // 'signin' | 'register'
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '' })
  const [errors, setErrors]     = useState({ fullName: '', email: '', password: '' })
  const [serverError, setServerError] = useState('')
  const [loading, setLoading]   = useState(false)

  if (getToken()) return <Navigate to="/cancel" replace />

  const isRegister = mode === 'register'

  function handleChange(field) {
    return (e) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }))
      if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
      if (serverError) setServerError('')
    }
  }

  function switchMode() {
    setMode(isRegister ? 'signin' : 'register')
    setErrors({ fullName: '', email: '', password: '' })
    setServerError('')
  }

  async function handleSubmit() {
    const newErrors = { fullName: '', email: '', password: '' }

    if (isRegister && formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Please enter your full name'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required'
    } else if (!formData.email.includes('@')) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (newErrors.fullName || newErrors.email || newErrors.password) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    setServerError('')
    try {
      const email = formData.email.trim()
      const session = isRegister
        ? await api.register(formData.fullName.trim(), email, formData.password)
        : await api.login(email, formData.password)
      saveSession(session)
      navigate('/cancel')
    } catch (err) {
      setServerError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">
          <span className="login-logo-mark">🏥</span>
          <div className="login-logo-name">SlotBack</div>
          <div className="login-logo-tagline">Appointment Waitlist Manager</div>
        </div>

        <FormSectionWrapper
          title={isRegister ? 'Create Coordinator Account' : 'Coordinator Sign In'}
          icon="🔐"
        >
          {serverError && <div className="form-error-banner">{serverError}</div>}

          {isRegister && (
            <InputField
              label="Full Name"
              value={formData.fullName}
              onChange={handleChange('fullName')}
              placeholder="e.g. Sarah Mitchell"
              error={errors.fullName}
              required
            />
          )}

          <InputField
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            placeholder="you@slotback.com.au"
            error={errors.email}
            required
          />

          <InputField
            label="Password"
            type="password"
            value={formData.password}
            onChange={handleChange('password')}
            placeholder="Enter your password"
            error={errors.password}
            required
            helpText="Min. 6 characters"
          />

          <div style={{ marginTop: '8px' }}>
            <AppButton
              label={loading ? 'Please wait…' : isRegister ? 'Create Account' : 'Sign In'}
              onClick={handleSubmit}
              variant="primary"
              disabled={loading}
              fullWidth
            />
          </div>

          <p style={{ textAlign: 'center', marginTop: '14px', fontSize: '13px', color: '#636E72' }}>
            {isRegister ? 'Already have an account? ' : 'New coordinator? '}
            <button type="button" className="link-button" onClick={switchMode}>
              {isRegister ? 'Sign in' : 'Create an account'}
            </button>
          </p>
        </FormSectionWrapper>

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#9AAAAA', marginTop: '16px' }}>
          SlotBack · La Trobe University BUS4012
        </p>
      </div>
    </div>
  )
}
