import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, Download, Plus, Settings, LogOut, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import './Dashboard.css'

interface DashboardProps {}

const Dashboard: React.FC<DashboardProps> = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

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
      downloads: 42
    },
    {
      id: 2,
      title: 'Residential Design Trends 2024',
      status: 'in-progress',
      created: '1 day ago',
      downloads: 26
    },
    {
      id: 3,
      title: 'Sustainable Architecture Trends',
      status: 'draft',
      created: '3 days ago',
      downloads: 0
    }
  ])

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects
    const query = searchQuery.toLowerCase()
    return projects.filter(project => 
      project.title.toLowerCase().includes(query) ||
      project.status.toLowerCase().includes(query)
    )
  }, [projects, searchQuery])

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

      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <div className="sidebar-brand">
            <div className="brand-icon">📄</div>
            <div className="brand-info">
              <h3>AI Lead Magnets</h3>
              <p>Your AI Workforce</p>
            </div>
          </div>
          
          <button className="sidebar-create-btn">
            <Plus size={20} />
            Create Lead Magnet
          </button>

          <div className="sidebar-section">
            <h4>Navigation</h4>
            <nav className="sidebar-nav">
              <a href="#" className="nav-item active">
                <FileText size={18} />
                My Lead Magnets
              </a>
              <a href="#" className="nav-item">
                <Download size={18} />
                Active Campaigns
              </a>
              <a href="#" className="nav-item">
                <Settings size={18} />
                Integrations
              </a>
              <a href="#" className="nav-item">
                <User size={18} />
                Analytics
              </a>
            </nav>
          </div>

          <div className="sidebar-section">
            <h4>Account</h4>
            <nav className="sidebar-nav">
              <a href="#" className="nav-item">
                <Settings size={18} />
                Settings
              </a>
            </nav>
          </div>
        </aside>

        <main className="dashboard-main-content">
          <div className="main-header">
            <div className="header-top">
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="main-title"
              >
                My Lead Magnets
              </motion.h1>
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="create-btn-header"
              >
                <Plus size={20} />
                Create Lead Magnet
              </motion.button>
            </div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="main-subtitle"
            >
              Manage and interact with your AI-powered lead magnets
            </motion.p>
          </div>

          <div className="stats-grid">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="stat-card"
            >
              <div className="stat-header">
                <span className="stat-label">Total Lead Magnets</span>
                <FileText className="stat-icon" />
              </div>
              <div className="stat-value">3</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="stat-card"
            >
              <div className="stat-header">
                <span className="stat-label">Active Lead Magnets</span>
                <Download className="stat-icon" />
              </div>
              <div className="stat-value">2</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="stat-card"
            >
              <div className="stat-header">
                <span className="stat-label">Total Downloads</span>
                <Settings className="stat-icon" />
              </div>
              <div className="stat-value">68</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="stat-card"
            >
              <div className="stat-header">
                <span className="stat-label">Leads Generated</span>
                <User className="stat-icon" />
              </div>
              <div className="stat-value">290</div>
            </motion.div>
          </div>

          <div className="content-section">
            <div className="search-section">
              <div className="search-wrapper">
                <input
                  type="text"
                  placeholder="Search lead magnets..."
                  className="search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="projects-grid">
              {filteredProjects.length === 0 && searchQuery.trim() ? (
                <div className="no-results">
                  <p>No lead magnets found matching "{searchQuery}"</p>
                </div>
              ) : (
                filteredProjects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className={`project-card ${project.status}`}
                  >
                    <div className="project-header">
                      <div className="project-avatar">
                        <FileText className="project-icon" />
                      </div>
                      <div className="project-info">
                        <h3 className="project-title">{project.title}</h3>
                        <span className={`status-badge ${project.status}`}>
                          {project.status === 'in-progress' ? 'In Progress' : 
                           project.status === 'completed' ? 'Completed' : 'Draft'}
                        </span>
                      </div>
                      <button className="project-menu">⋮</button>
                    </div>
                    
                    <p className="project-description">
                      {project.status === 'completed' ? 'Generates high-quality leads for architectural services' :
                       project.status === 'in-progress' ? 'Converting prospects into qualified leads' : 
                       'Draft lead magnet ready for review'}
                    </p>
                    
                    <div className="project-metrics">
                      <div className="metric">
                        <span className="metric-value">{project.downloads}</span>
                        <span className="metric-label">Downloads</span>
                      </div>
                      <div className="metric">
                        <span className="metric-value">{Math.floor(project.downloads * 0.3)}</span>
                        <span className="metric-label">Leads Generated</span>
                      </div>
                    </div>
                    
                    <div className="project-footer">
                      <span className="project-last-activity">Last active: {project.created}</span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Dashboard