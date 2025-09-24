import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import HeroSection from './HeroSection'
import HowItWorksSection from './HowItWorksSection'
import FeaturesSection from './FeaturesSection'
import DemoSection from './DemoSection'
import Footer from './Footer'
import './LandingPage.css'

const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  // If user is already logged in, redirect to dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  const handleLoginClick = () => {
    navigate('/login')
  }

  const handleSignupClick = () => {
    navigate('/signup')
  }

  return (
    <div className="landing-page">
      <nav className="main-nav">
        <div className="nav-brand">Forma</div>
        <div className="nav-actions">
          <button className="nav-button white-btn" onClick={handleLoginClick}>
            Login
          </button>
          <button className="nav-button black-btn" onClick={handleSignupClick}>
            Sign Up
          </button>
        </div>
      </nav>
      
      <HeroSection onGetStarted={handleSignupClick} />
      <HowItWorksSection />
      <FeaturesSection />
      <DemoSection />
      <Footer />
    </div>
  )
}

export default LandingPage