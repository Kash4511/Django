import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import './HeroSection.css'

interface HeroSectionProps {
  onGetStarted: () => void
  user: any
}

const HeroSection: React.FC<HeroSectionProps> = () => {
  const highlightRef = useRef<HTMLSpanElement>(null)
  const heroSectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      const maxScroll = window.innerHeight * 0.8 // Fade completes at 80% of viewport height
      const fadeValue = Math.min(scrollPosition / maxScroll, 1)

      // Update CSS custom property for the highlight text background
      if (highlightRef.current) {
        highlightRef.current.style.setProperty('--scroll-fade', fadeValue.toString())
      }

      // Update CSS custom property for the hero section background
      if (heroSectionRef.current) {
        heroSectionRef.current.style.setProperty('--scroll-fade', fadeValue.toString())
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Call once to set initial state

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <section className="hero-section" ref={heroSectionRef}>
      <div className="hero-content">
        <div className="hero-text">
          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="hero-title"
          >
            Where AI Meets <span className="highlight-text" ref={highlightRef}>Architectural Marketing</span>.
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
      </div>
    </section>
  )
}

export default HeroSection