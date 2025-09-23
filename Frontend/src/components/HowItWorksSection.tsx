import React from 'react'
import { motion } from 'framer-motion'
import { FileText, Bot, Download, Edit3 } from 'lucide-react'
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
            Easy as one, two, three.
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

                <div className="step-content">
                  <h3 className="step-title">{step.title}</h3>
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