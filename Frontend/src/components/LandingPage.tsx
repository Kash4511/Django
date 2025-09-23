import React, { useState } from 'react'
import HeroSection from './HeroSection'
import FeaturesSection from './FeaturesSection'
import DemoSection from './DemoSection'
import Footer from './Footer'
import AuthPages from './AuthPages'
import './LandingPage.css'

const LandingPage: React.FC = () => {
  const [showAuth, setShowAuth] = useState(false)
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

  return (
    <div className="landing-page">
      {/* Promotional Banner */}
      <div className="promo-banner">
        <span className="promo-text">Introducing PDF AI Builder - Available Now</span>
        <button className="promo-cta" onClick={() => setShowAuth(true)}>
          Try now →
        </button>
      </div>

      <nav className="main-nav">
        <div className="nav-brand">🤖 PDFy</div>
        <div className="nav-links">
          <a href="#solutions">Solutions</a>
          <a href="#pricing">Pricing</a>
          <a href="#integrations">Integrations</a>
          <a href="#resources">Resources</a>
        </div>
        <div className="nav-actions">
          {user ? (
            <div className="user-menu">
              <span className="welcome-text">Welcome, {user.name}!</span>
              <button className="nav-button secondary" onClick={handleLogout}>
                Sign Out
              </button>
            </div>
          ) : (
            <>
              <button className="nav-button ghost" onClick={() => setShowAuth(true)}>
                Log in
              </button>
              <button className="nav-button outline">
                Talk to sales
              </button>
              <button className="nav-button primary" onClick={() => setShowAuth(true)}>
                Try for free
              </button>
            </>
          )}
        </div>
      </nav>
      
      <HeroSection onGetStarted={() => setShowAuth(true)} user={user} />
      <FeaturesSection />
      <DemoSection />
      <Footer />
      
      {showAuth && (
        <AuthPages
          onLogin={handleLogin}
          onClose={() => setShowAuth(false)}
        />
      )}
    </div>
  )
}

export default LandingPage