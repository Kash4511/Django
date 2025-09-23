import React from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, Eye } from 'lucide-react'
import './DemoSection.css'

const sampleMagnets = [
  {
    title: 'Modern Home Design Trends 2024',
    description: 'Latest trends in contemporary residential architecture',
    pages: '12 pages',
    downloads: '2.3k',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=300&h=200&fit=crop'
  },
  {
    title: 'Sustainable Architecture Guide',
    description: 'Eco-friendly design principles and practices',
    pages: '16 pages', 
    downloads: '1.8k',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=300&h=200&fit=crop'
  },
  {
    title: 'Small Space, Big Ideas',
    description: 'Maximizing potential in compact living spaces',
    pages: '10 pages',
    downloads: '3.1k', 
    image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=300&h=200&fit=crop'
  }
]

const DemoSection: React.FC = () => {
  return (
    <section className="demo-section">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="demo-header"
        >
          <h2 className="demo-title">
            See what you can create
          </h2>
          <p className="demo-subtitle">
            Sample lead magnets created with our AI-powered generator
          </p>
        </motion.div>

        <div className="demo-grid">
          {sampleMagnets.map((magnet, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="demo-card"
            >
              <div className="demo-image">
                <img src={magnet.image} alt={magnet.title} />
                <div className="demo-overlay">
                  <button className="demo-preview-btn">
                    <Eye size={20} />
                    Preview
                  </button>
                </div>
              </div>
              <div className="demo-content">
                <h3 className="demo-card-title">{magnet.title}</h3>
                <p className="demo-description">{magnet.description}</p>
                <div className="demo-stats">
                  <div className="demo-stat">
                    <FileText size={16} />
                    <span>{magnet.pages}</span>
                  </div>
                  <div className="demo-stat">
                    <Download size={16} />
                    <span>{magnet.downloads}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="demo-cta"
        >
          <button className="cta-button primary large">
            Create Your First Lead Magnet
          </button>
        </motion.div>
      </div>
    </section>
  )
}

export default DemoSection