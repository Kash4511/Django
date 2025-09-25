import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import LandingPage from './components/LandingPage'
import LoginPage from './components/LoginPage'
import SignupPage from './components/SignupPage'
import Dashboard from './components/Dashboard'
import CreateLeadMagnet from './components/CreateLeadMagnet'
import BrandAssets from './components/BrandAssets'
import FormaAI from './components/FormaAI'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/create-lead-magnet" 
            element={
              <ProtectedRoute>
                <CreateLeadMagnet />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/brand-assets" 
            element={
              <ProtectedRoute>
                <BrandAssets />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/forma-ai" 
            element={
              <ProtectedRoute>
                <FormaAI />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </AuthProvider>
    </div>
  )
}

export default App
