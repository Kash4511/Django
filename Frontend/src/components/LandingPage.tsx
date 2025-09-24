import React, { useState } from 'react'
import HeroSection from './HeroSection'
import HowItWorksSection from './HowItWorksSection'
import FeaturesSection from './FeaturesSection'
import DemoSection from './DemoSection'
import Footer from './Footer'
import AuthPages from './AuthPages'
import Dashboard from './Dashboard'
import './LandingPage.css'

const LandingPage: React.FC = () => {
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [user, setUser] = useState(null)

  // Check for existing session on mount
  React.useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token')
      if (token) {
        try {
          const apiBase = import.meta.env.VITE_API_BASE_URL || window.location.protocol + '//' + window.location.hostname + ':8000'
          const response = await fetch(`${apiBase}/api/auth/profile/`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          if (response.ok) {
            const userData = await response.json()
            setUser(userData)
          } else {
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
          }
        } catch (err) {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        }
      }
    }
    checkAuth()
  }, [])

  const handleLogin = (userData: any) => {
    setUser(userData)
    setShowAuth(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }

  // Show dashboard if user is logged in
  if (user) {
    return <Dashboard user={user} onLogout={handleLogout} />
  }

  return (
    <div className="landing-page">
      <nav className="main-nav">
        <div className="nav-brand">Forma</div>
        <div className="nav-actions">
          <button className="nav-button white-btn" onClick={() => { setAuthMode('login'); setShowAuth(true) }}>
            Login
          </button>
          <button className="nav-button black-btn" onClick={() => { setAuthMode('signup'); setShowAuth(true) }}>
            Sign Up
          </button>
        </div>
      </nav>
      
      <HeroSection onGetStarted={() => { setAuthMode('signup'); setShowAuth(true) }} user={user} />
      <HowItWorksSection />
      <FeaturesSection />
      <DemoSection />
      <Footer />
      
      {showAuth && (
        <AuthPages
          onLogin={handleLogin}
          onClose={() => setShowAuth(false)}
          initialMode={authMode}
        />
      )}
    </div>
  )
}

export default LandingPage