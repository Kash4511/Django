import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Bot, Download, Edit3, MousePointer } from 'lucide-react'
import './HowItWorksSection.css'

const steps = [
  {
    step: "1",
    title: "Enter Your Details",
    subtitle: "Provide your project info, branding, and target audience.",
    icon: Edit3,
    gradient: "linear-gradient(135deg, #f8e8ff 0%, #e8d5ff 100%)",
    iconColor: "#8b5cf6"
  },
  {
    step: "2", 
    title: "AI Generates Content",
    subtitle: "Our AI creates structured, engaging, and professional content tailored for architects.",
    icon: Bot,
    gradient: "linear-gradient(135deg, #fff4e6 0%, #fef3c7 100%)",
    iconColor: "#f59e0b"
  },
  {
    step: "3",
    title: "Download Your Lead Magnet", 
    subtitle: "Get a polished, 10-page PDF ready to share with clients.",
    icon: Download,
    gradient: "linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%)",
    iconColor: "#3b82f6"
  }
]

// Animation components for each step
const TypingAnimation: React.FC = () => {
  const [currentText, setCurrentText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const texts = useMemo(() => (
    ['Project Name...', 'Modern Villa Design', 'Target Audience: Homeowners', 'Brand Colors: #2563eb']
  ), [])
  
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    
    const typeText = () => {
      const fullText = texts[currentIndex]
      
      if (!isTyping && currentText === '') {
        setIsTyping(true)
      }
      
      if (currentText.length < fullText.length && isTyping) {
        timeout = setTimeout(() => {
          setCurrentText(fullText.substring(0, currentText.length + 1))
        }, 80)
      } else if (currentText.length === fullText.length) {
        timeout = setTimeout(() => {
          setIsTyping(false)
          setCurrentText('')
          setCurrentIndex((prev) => (prev + 1) % texts.length)
        }, 2000)
      }
    }
    
    typeText()
    return () => clearTimeout(timeout)
  }, [currentText, currentIndex, isTyping, texts])
  
  return (
    <div className="typing-demo">
      <div className="form-field">
        <input type="text" value={currentText} readOnly />
        <motion.div 
          className="cursor"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
        />
      </div>
    </div>
  )
}

const AIGeneratingAnimation: React.FC = () => {
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [isGenerating, setIsGenerating] = useState(true)
  const contentLines = useMemo(() => ([
    'Sustainable Architecture Trends...',
    'Energy-efficient design principles...',
    'Modern materials and techniques...',
    'Client presentation strategies...'
  ]), [])
  
  useEffect(() => {
    const interval = setInterval(() => {
      setIsGenerating(true)
      setTimeout(() => {
        setCurrentLineIndex((prev) => (prev + 1) % contentLines.length)
        setIsGenerating(false)
      }, 1000)
    }, 2500)
    return () => clearInterval(interval)
  }, [contentLines])
  
  return (
    <div className="ai-demo">
      <div className="ai-brain">
        <Bot size={24} />
        <motion.div
          className="thinking-dots"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <span>•</span><span>•</span><span>•</span>
        </motion.div>
      </div>
      
      <div className="generated-content">
        <AnimatePresence mode="wait">
          {!isGenerating && (
            <motion.div
              key={currentLineIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="content-line"
            >
              {contentLines[currentLineIndex]}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

const DownloadAnimation: React.FC = () => {
  const [isClicking, setIsClicking] = useState(false)
  const [progress, setProgress] = useState(0)
  
  useEffect(() => {
    const sequence = async () => {
      // Move cursor to button
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Click animation
      setIsClicking(true)
      await new Promise(resolve => setTimeout(resolve, 200))
      setIsClicking(false)
      
      // Progress animation
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval)
            setTimeout(() => setProgress(0), 1000)
            return 100
          }
          return prev + 5
        })
      }, 100)
    }
    
    const interval = setInterval(sequence, 4000)
    sequence() // Start immediately
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="download-demo">
      <motion.div
        className="cursor-pointer"
        animate={{
          x: [0, 60, 60, 0],
          y: [0, 0, 0, 0]
        }}
        transition={{ duration: 4, repeat: Infinity, repeatDelay: 0 }}
      >
        <MousePointer size={20} />
      </motion.div>
      
      <motion.button
        className="download-btn-demo"
        animate={{
          scale: isClicking ? 0.95 : 1
        }}
        transition={{ duration: 0.1 }}
      >
        <Download size={16} />
        Download PDF
      </motion.button>
      
      {progress > 0 && (
        <div className="progress-bar">
          <motion.div
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
          <span>{progress}%</span>
        </div>
      )}
    </div>
  )
}

const HowItWorksSection: React.FC = () => {
  return (
    <section className="how-it-works-section">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="how-it-works-header"
        >
          <div className="badge">
            <FileText size={16} />
            From concept to conversion.
          </div>
          <h2 className="how-it-works-title">How it works</h2>
        </motion.div>

        <div className="steps-container">
          {steps.map((step, index) => {
            const IconComponent = step.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="step-card"
                style={{ background: step.gradient }}
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)"
                }}
              >
                <div className="step-number">{step.step}</div>
                
                <div className="step-icon-container">
                  <motion.div 
                    className="step-icon"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 10 }}
                    style={{ color: step.iconColor }}
                  >
                    <IconComponent size={32} />
                  </motion.div>
                </div>
                
                <div className="step-animation">
                  {index === 0 && <TypingAnimation />}
                  {index === 1 && <AIGeneratingAnimation />}
                  {index === 2 && <DownloadAnimation />}
                </div>

                <div className="step-content">
                  <h3 className="step-title white-title">{step.title}</h3>
                  <p className="step-subtitle">{step.subtitle}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default HowItWorksSection