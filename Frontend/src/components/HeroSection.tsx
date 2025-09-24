import React from 'react'
import { motion } from 'framer-motion'
import './HeroSection.css'

interface HeroSectionProps {
  onGetStarted: () => void
  user: any
}

const HeroSection: React.FC<HeroSectionProps> = () => {
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
          
        </div>
        
        <motion.img
          src="/hero-3d.png"
          alt="3D Architectural Render"
          className="hero-3d-image"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 0.3, x: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        />
      </div>
    </section>
  )
}

export default HeroSection