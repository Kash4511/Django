import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const showcaseCards = [
  { bg: '#0a0a0a', tag: 'Trends Report',  title: 'Sustainable Architecture 2026',   lines: ['85%','60%'] },
  { bg: '#1a1428', tag: 'Ultimate Guide',  title: 'Net-Zero Design Principles',      lines: ['70%','50%'] },
  { bg: '#0f1e18', tag: 'Case Study',      title: 'Biophilic Office Transformation', lines: ['90%','65%'] },
  { bg: '#1e1610', tag: 'ROI Calculator',  title: 'Project ROI & Cost Analysis',     lines: ['75%','55%'] },
]

const LoginPage: React.FC = () => {
  const [formData, setFormData]         = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]               = useState('')
  const [loading, setLoading]           = useState(false)
  const { login }                       = useAuth()
  const navigate                        = useNavigate()
  const location                        = useLocation()
  const successMessage = location.state?.message && !location.state?.isError ? location.state.message : null
  const errorMessage   = location.state?.message && location.state?.isError  ? location.state.message : null

  useEffect(() => { if (errorMessage) setError(errorMessage) }, [errorMessage])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    if (error) setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Login form submitted with data:', { email: formData.email, password: '***' })
    if (!formData.email || !formData.password) { setError('Please fill in all fields'); return }
    setLoading(true); setError('')
    try {
      console.log('Calling login function...')
      await login(formData.email, formData.password)
      console.log('Login successful, navigating to dashboard...')
      navigate('/dashboard')
    } catch (err: unknown) {
      console.error('Login error:', err)
      const asObj = err as Record<string, unknown>
      const data = (asObj.response as any)?.data
      if (data && typeof data === 'object') {
        const details = data.details || data
        if (typeof details === 'string') { setError(details) }
        else if (typeof details === 'object' && details !== null) {
          const d = details as Record<string, any>
          const msg = (Array.isArray(d.non_field_errors) && d.non_field_errors[0]) ||
            (Array.isArray(d.email) && `Email: ${d.email[0]}`) ||
            (Array.isArray(d.password) && `Password: ${d.password[0]}`) ||
            d.detail || data.error || 'Login failed. Please check your credentials.'
          setError(typeof msg === 'string' ? msg : 'Login failed.')
        } else { setError(data.error || 'Login failed. Please check your credentials.') }
      } else if ((asObj.code === 'ECONNABORTED') || (typeof asObj.message === 'string' && (asObj.message as string).includes('timeout'))) {
        setError('Request timed out. Please try again.')
      } else if (asObj.request) { setError('Unable to connect. Please check your connection.') }
      else { setError('An unexpected error occurred. Please try again.') }
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', fontFamily: "'Instrument Sans',sans-serif", background: '#fff' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,700;0,900;1,700&family=Instrument+Sans:wght@400;500;600&display=swap');
        @keyframes lp-spin{to{transform:rotate(360deg)}}
        .lp-in{background:#fafafa;border:1px solid rgba(0,0,0,0.08);border-radius:10px;padding:12px 12px 12px 40px;width:100%;font-family:'Instrument Sans',sans-serif;font-size:0.9rem;color:#111;outline:none;transition:border-color .2s,box-shadow .2s;}
        .lp-in:focus{border-color:rgba(0,0,0,0.28)!important;box-shadow:0 0 0 3px rgba(0,0,0,0.05)!important;}
        .lp-in::placeholder{color:#ccc;}
        .lp-in-pw{padding-right:44px;}
        .lp-btn:hover:not(:disabled){background:#2a2a2a!important;transform:translateY(-1px);box-shadow:0 6px 20px rgba(0,0,0,0.15);}
        .lp-card:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(0,0,0,0.08)!important;}
        .lp-link{color:#0a0a0a;font-weight:600;text-decoration:none;}
        .lp-link:hover{text-decoration:underline;}
        @media(max-width:768px){.lp-right{display:none!important;}}
      `}</style>

      {/* ── LEFT — FORM ── */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 64px', position: 'relative', minHeight: '100vh' }}>
        {/* Top bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 64px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <Link to="/" style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: '1.25rem', color: '#0a0a0a', letterSpacing: '-0.5px', textDecoration: 'none' }}>Forma.</Link>
          <span style={{ fontSize: '0.8rem', color: '#aaa' }}>No account? <Link to="/signup" className="lp-link">Sign up →</Link></span>
        </div>

        <div style={{ maxWidth: 380, width: '100%' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '3px', textTransform: 'uppercase' as const, color: '#bbb', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 16, height: 1.5, background: '#bbb', display: 'inline-block' }} />Welcome back
          </div>
          <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: '2.4rem', fontWeight: 900, letterSpacing: '-1.2px', color: '#0a0a0a', marginBottom: 6, lineHeight: 1.1 }}>
            Sign in to<br/><em style={{ fontStyle: 'italic', color: '#ccc' }}>Forma.</em>
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#999', marginBottom: 28, lineHeight: 1.6 }}>Enter your credentials to access your dashboard.</p>

          {successMessage && <div style={{ background: 'rgba(60,180,100,0.06)', border: '1px solid rgba(60,180,100,0.2)', borderRadius: 9, padding: '10px 14px', fontSize: '0.8rem', color: 'rgba(40,150,80,0.9)', marginBottom: 16 }}>{successMessage}</div>}
          {error && <div style={{ background: 'rgba(220,60,60,0.05)', border: '1px solid rgba(220,60,60,0.18)', borderRadius: 9, padding: '10px 14px', fontSize: '0.8rem', color: 'rgba(200,50,50,0.9)', marginBottom: 16 }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#aaa', display: 'block', marginBottom: 6 }}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#ccc', pointerEvents: 'none' }} />
                <input className="lp-in" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@firm.com" required />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#aaa', display: 'block', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#ccc', pointerEvents: 'none' }} />
                <input className="lp-in lp-in-pw" type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', display: 'flex', alignItems: 'center' }}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="lp-btn"
              style={{ width: '100%', padding: '13px', background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: 10, fontFamily: "'Instrument Sans',sans-serif", fontSize: '0.9rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
              {loading ? <><span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.25)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'lp-spin .65s linear infinite' }} />Signing in…</> : 'Sign in →'}
            </button>
          </form>

          <p style={{ marginTop: 18, fontSize: '0.78rem', color: '#bbb', textAlign: 'center' }}>
            Don't have an account? <Link to="/signup" className="lp-link">Create one</Link>
          </p>
        </div>
      </div>

      {/* ── RIGHT — SHOWCASE ── */}
      <div className="lp-right" style={{ background: '#f7f7f5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 52px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,0,0,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.025) 1px,transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420 }}>
          <div style={{ fontSize: '0.66rem', fontWeight: 600, letterSpacing: '3px', textTransform: 'uppercase' as const, color: '#bbb', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 16, height: 1.5, background: '#bbb', display: 'inline-block' }} />Sample output
          </div>
          <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.8px', color: '#0a0a0a', marginBottom: 6, lineHeight: 1.1 }}>
            Beautiful PDFs,<br/><em style={{ fontStyle: 'italic', color: '#ccc' }}>in seconds.</em>
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#999', marginBottom: 28, lineHeight: 1.6 }}>AI-generated, branded lead magnets for architecture firms — no design skills needed.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {showcaseCards.map((card, i) => (
              <div key={i} className="lp-card" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, overflow: 'hidden', transition: 'all .2s', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
                <div style={{ width: 42, height: 42, borderRadius: 9, background: card.bg, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px)', backgroundSize: '8px 8px' }} />
                  <div style={{ position: 'absolute', top: 9,  left: 8, width: 22, height: 2.5, background: 'rgba(255,255,255,0.28)', borderRadius: 2 }} />
                  <div style={{ position: 'absolute', top: 16, left: 8, width: 15, height: 2,   background: 'rgba(255,255,255,0.14)', borderRadius: 2 }} />
                  <div style={{ position: 'absolute', top: 22, left: 8, width: 19, height: 2,   background: 'rgba(255,255,255,0.14)', borderRadius: 2 }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '1px', color: '#bbb', background: '#f0f0ec', borderRadius: 20, padding: '2px 7px', display: 'inline-block', marginBottom: 4 }}>{card.tag}</span>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: '0.85rem', fontWeight: 700, color: '#0a0a0a', letterSpacing: '-0.2px', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>{card.title}</div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 5 }}>
                    {card.lines.map((w, j) => <div key={j} style={{ height: 3.5, borderRadius: 2, background: '#ebebeb', width: w }} />)}
                  </div>
                </div>
                <div style={{ flexShrink: 0, width: 26, height: 26, background: '#f0f0ec', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem', fontWeight: 700, color: '#bbb', letterSpacing: '0.5px' }}>PDF</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 20 }}>
            <div style={{ display: 'flex' }}>
              {['KR','MA','JS','PL','BT'].map((a, i) => (
                <div key={i} style={{ width: 26, height: 26, borderRadius: '50%', border: '2px solid #f7f7f5', background: '#e8e8e4', marginLeft: i === 0 ? 0 : -8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600, color: '#999' }}>{a}</div>
              ))}
            </div>
            <span style={{ fontSize: '0.72rem', color: '#bbb' }}>Trusted by <strong style={{ color: '#888' }}>200+</strong> architecture firms</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage