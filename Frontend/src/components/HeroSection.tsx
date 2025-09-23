import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Float } from '@react-three/drei'
import { motion } from 'framer-motion'
import './HeroSection.css'

function FloatingShapes() {
  return (
    <>
      <Float speed={1.2} rotationIntensity={1} floatIntensity={2}>
        <mesh position={[2, 0, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#4f46e5" transparent opacity={0.7} />
        </mesh>
      </Float>
      <Float speed={1.5} rotationIntensity={0.8} floatIntensity={1.5}>
        <mesh position={[-2, 1, -1]}>
          <sphereGeometry args={[0.8, 32, 32]} />
          <meshStandardMaterial color="#06b6d4" transparent opacity={0.8} />
        </mesh>
      </Float>
      <Float speed={1.8} rotationIntensity={1.2} floatIntensity={2.5}>
        <mesh position={[0, -1, 1]}>
          <octahedronGeometry args={[0.9]} />
          <meshStandardMaterial color="#8b5cf6" transparent opacity={0.6} />
        </mesh>
      </Float>
      <Float speed={1.4} rotationIntensity={0.6} floatIntensity={1.8}>
        <mesh position={[-1, -2, 0]}>
          <tetrahedronGeometry args={[0.7]} />
          <meshStandardMaterial color="#f59e0b" transparent opacity={0.7} />
        </mesh>
      </Float>
    </>
  )
}

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
            Meet your first AI employee
            <br />
            <span className="gradient-text">for PDF Generation</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hero-subtitle"
          >
            Simplest way for businesses to create, manage, and share PDF content. Now with just a prompt.
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
                placeholder="How can I help? Describe your PDF and I'll build it."
                className="hero-input"
              />
              <button className="input-submit-btn">↑</button>
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
        
        <div className="hero-3d">
          <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
            <ambientLight intensity={0.4} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <Suspense fallback={null}>
              <FloatingShapes />
            </Suspense>
            <OrbitControls enableZoom={false} enablePan={false} />
          </Canvas>
        </div>
      </div>
    </section>
  )
}

export default HeroSection