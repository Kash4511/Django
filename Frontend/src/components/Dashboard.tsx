import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, Download, Plus, Settings, LogOut, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import './Dashboard.css'

interface DashboardProps {}

const Dashboard: React.FC<DashboardProps> = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }
  const [projects] = useState([
    {
      id: 1,
      title: 'Modern Office Complex Lead Magnet',
      status: 'completed',
      created: '2 days ago',
      downloads: 45
    },
    {
      id: 2, 
      title: 'Residential Home Design Guide',
      status: 'in-progress',
      created: '1 week ago',
      downloads: 23
    },
    {
      id: 3,
      title: 'Sustainable Architecture Trends',
      status: 'draft',
      created: '3 days ago',
      downloads: 0
    }
  ])

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-brand">Forma</div>
        <div className="nav-actions">
          <div className="user-menu">
            <User className="user-icon" size={20} />
            <span className="user-name">{user?.name}</span>
            <button className="logout-btn" onClick={handleLogout}>
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="dashboard-header">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="dashboard-title"
          >
            Welcome back, {user?.name?.split(' ')[0]}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="dashboard-subtitle"
          >
            Create and manage your AI-powered lead magnets
          </motion.p>
        </div>

        <div className="dashboard-stats">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="stat-card"
          >
            <FileText className="stat-icon" />
            <div className="stat-content">
              <h3>3</h3>
              <p>Lead Magnets</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="stat-card"
          >
            <Download className="stat-icon" />
            <div className="stat-content">
              <h3>68</h3>
              <p>Total Downloads</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="stat-card"
          >
            <Settings className="stat-icon" />
            <div className="stat-content">
              <h3>1</h3>
              <p>Active Campaigns</p>
            </div>
          </motion.div>
        </div>

        <div className="dashboard-main">
          <div className="projects-section">
            <div className="section-header">
              <h2>Your Lead Magnets</h2>
              <button className="create-btn">
                <Plus size={20} />
                Create New
              </button>
            </div>

            <div className="projects-grid">
              {projects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className={`project-card ${project.status}`}
                >
                  <div className="project-header">
                    <FileText className="project-icon" />
                    <span className={`status-badge ${project.status}`}>
                      {project.status === 'in-progress' ? 'In Progress' : 
                       project.status === 'completed' ? 'Completed' : 'Draft'}
                    </span>
                  </div>
                  
                  <h3 className="project-title">{project.title}</h3>
                  
                  <div className="project-stats">
                    <span className="project-created">Created {project.created}</span>
                    <span className="project-downloads">{project.downloads} downloads</span>
                  </div>
                  
                  <div className="project-actions">
                    <button className="action-btn primary">Edit</button>
                    <button className="action-btn secondary">Download</button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard