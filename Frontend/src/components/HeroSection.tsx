import React from 'react'
import { motion } from 'framer-motion'
import './HeroSection.css'

interface HeroSectionProps {
  onGetStarted: () => void
}

const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted }) => {
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
            Where AI Meets <span className="highlight-text">Architectural Marketing</span>.
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hero-subtitle"
          >
We help architects turn ideas into polished, engaging lead magnets with the power of AI.
          </motion.p>
          
          <motion.button
            onClick={onGetStarted}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="hero-cta-button"
          >
            Get Started Free
          </motion.button>
          
        </div>
        
      </div>
    </section>
  )
}

export default HeroSection