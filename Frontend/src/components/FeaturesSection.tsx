import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Zap, Settings, Target } from 'lucide-react'
import './FeaturesSection.css'

const features = [
  {
    icon: <Sparkles className="feature-icon" />,
    title: 'AI-generated high-quality content',
    description: 'Our AI creates professional, engaging content tailored specifically for architects and their clients.'
  },
  {
    icon: <Zap className="feature-icon" />,
    title: 'Visually appealing professional PDFs',
    description: 'Generate stunning 10-page PDFs with modern layouts, typography, and architectural design elements.'
  },
  {
    icon: <Settings className="feature-icon" />,
    title: 'Seamless integration with existing systems',
    description: 'Easy integration with your current workflow, CRM, and marketing automation tools.'
  },
  {
    icon: <Target className="feature-icon" />,
    title: 'Specific, engaging, and useful content',
    description: 'Content that resonates with your target audience and drives real engagement and leads.'
  }
]

const FeaturesSection: React.FC = () => {
  return (
    <section className="features-section">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="features-header"
        >
          <h2 className="features-title">
            Transform your architectural expertise into compelling marketing assets
          </h2>
        </motion.div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="feature-card"
            >
              <div className="feature-icon-wrapper">
                {feature.icon}
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturesSection