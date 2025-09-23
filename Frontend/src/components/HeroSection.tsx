import React from 'react'
import { motion } from 'framer-motion'
import './HeroSection.css'

interface HeroSectionProps {
  onGetStarted: () => void
  user: any
}

const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted, user }) => {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <div className="hero-text">
          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="hero-title"
          >
            Talking about PDFs, what's <br/>
            <span className="gradient-text">your opinion?</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hero-subtitle"
          >
AI is a useful solution to streamline processes.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="hero-input-section"
          >
            <div className="input-container">
              <input 
                type="text" 
                placeholder="Describe your project"
                className="hero-input"
              />
              <button className="input-submit-btn">→</button>
            </div>
            
            <div className="action-tags">
              <span className="action-tag">📊 Build reports</span>
              <span className="action-tag">🏗️ Architecture plans</span>
              <span className="action-tag">📋 Client proposals</span>
              <span className="action-tag">📈 Lead magnets</span>
              <span className="action-tag">📝 Case studies</span>
              <span className="action-tag">🎯 Marketing materials</span>
              <span className="action-tag">📑 Project docs</span>
              <span className="action-tag">💼 Business cards</span>
            </div>
          </motion.div>
        </div>
        
        <div className="hero-visual">
          <div className="floating-pdf">
            <div className="pdf-icon">📄</div>
            <div className="pdf-text">Professional<br/>PDF Generator</div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection