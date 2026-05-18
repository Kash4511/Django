import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const showcaseCards = [
  { bg: '#0a0a0a', tag: 'Trends Report',  title: 'Sustainable Architecture 2026',   lines: ['85%','60%'] },
  { bg: '#1a1428', tag: 'Ultimate Guide',  title: 'Net-Zero Design Principles',      lines: ['70%','50%'] },
  { bg: '#0f1e18', tag: 'Case Study',      title: 'Biophilic Office Transformation', lines: ['90%','65%'] },
  { bg: '#1e1610', tag: 'ROI Calculator',  title: 'Project ROI & Cost Analysis',     lines: ['75%','55%'] },
]

const SignupPage: React.FC = () => {
  const [formData, setFormData]               = useState({ name: '', email: '', phone_number: '', password: '', password_confirm: '' })
  const [showPassword, setShowPassword]       = useState(false)
  const [showConfirm, setShowConfirm]         = useState(false)
  const [error, setError]                     = useState('')
  const [loading, setLoading]                 = useState(false)
  const { register }                          = useAuth()
  const navigate                              = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    if (error) setError('')
  }

  const strength = (() => {
    const p = formData.password; if (!p) return 0
    let s = 0
    if (p.length >= 4) s++; if (/[A-Z]/.test(p)) s++; if (/[0-9]/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++
    return s
  })()
  const strengthColors = ['#e0e0e0','#e05c5c','#e8a84b','#aac45a','#3dba8a']
  const strengthLabels = ['','Weak','Fair','Good','Strong']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Signup form submitted with data:', formData)
    if (!formData.name || !formData.email || !formData.password || !formData.password_confirm) { setError('Please fill in all required fields'); return }
    if (formData.password !== formData.password_confirm) { setError('Passwords do not match'); return }
    if (formData.password.length < 4) { setError('Password must be at least 4 characters long'); return }
    setLoading(true); setError('')
    try {
      console.log('Calling register function...')
      await register(formData.email, formData.password, formData.name, formData.phone_number)
      console.log('Registration successful, navigating to login...')
      navigate('/login', { state: { message: 'Account created successfully! Please sign in with your credentials.' } })
    } catch (err: unknown) {
      console.error('Signup error:', err)
      const asObj = err as Record<string, unknown>
      const data = (asObj.response as any)?.data
      if (data && typeof data === 'object') {
        const details = data.details || data
        if (typeof details === 'string') { setError(details) }
        else if (typeof details === 'object' && details !== null) {
          const d = details as Record<string, any>
          const msg = (Array.isArray(d.email) && `Email: ${d.email[0]}`) ||
            (Array.isArray(d.password) && `Password: ${d.password[0]}`) ||
            (Array.isArray(d.non_field_errors) && d.non_field_errors[0]) ||
            d.detail || data.error || 'Registration failed. Please check your information.'
          setError(typeof msg === 'string' ? msg : 'Registration failed.')
        } else { setError(data.error || 'Registration failed. Please check your information.') }
      } else if ((asObj.code === 'ECONNABORTED') || (typeof asObj.message === 'string' && (asObj.message as string).includes('timeout'))) {
        setError('Request timed out. Please try again.')
      } else if (asObj.request) { setError('Unable to connect. Please check your connection.') }
      else { setError('An unexpected error occurred. Please try again.') }
    } finally { setLoading(false) }
  }

  const Label = ({ children }: { children: string }) => (
    <label style={{ fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#aaa', display: 'block', marginBottom: 6 }}>{children}</label>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', fontFamily: "'Instrument Sans',sans-serif", background: '#fff' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,700;0,900;1,700&family=Instrument+Sans:wght@400;500;600&display=swap');
        @keyframes sp-spin{to{transform:rotate(360deg)}}
        .sp-in{background:#fafafa;border:1px solid rgba(0,0,0,0.08);border-radius:10px;padding:11px 11px 11px 38px;width:100%;font-family:'Instrument Sans',sans-serif;font-size:0.88rem;color:#111;outline:none;transition:border-color .2s,box-shadow .2s;}
        .sp-in:focus{border-color:rgba(0,0,0,0.28)!important;box-shadow:0 0 0 3px rgba(0,0,0,0.05)!important;}
        .sp-in::placeholder{color:#ccc;}
        .sp-in-pw{padding-right:42px;}
        .sp-btn:hover:not(:disabled){background:#2a2a2a!important;transform:translateY(-1px);box-shadow:0 6px 20px rgba(0,0,0,0.15);}
        .sp-card:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(0,0,0,0.08)!important;}
        .sp-link{color:#0a0a0a;font-weight:600;text-decoration:none;}
        .sp-link:hover{text-decoration:underline;}
        @media(max-width:768px){.sp-right{display:none!important;}}
      `}</style>

      {/* ── LEFT — FORM ── */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 56px', position: 'relative', minHeight: '100vh', overflowY: 'auto' }}>
        {/* Top bar */}
        <div style={{ position: 'fixed', top: 0, left: 0, width: '50%', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 56px', borderBottom: '1px solid rgba(0,0,0,0.06)', background: '#fff', zIndex: 10 }}>
          <Link to="/" style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: '1.25rem', color: '#0a0a0a', letterSpacing: '-0.5px', textDecoration: 'none' }}>Forma.</Link>
          <span style={{ fontSize: '0.8rem', color: '#aaa' }}>Have an account? <Link to="/login" className="sp-link">Sign in →</Link></span>
        </div>

        <div style={{ maxWidth: 360, width: '100%', paddingTop: 70, paddingBottom: 32 }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '3px', textTransform: 'uppercase' as const, color: '#bbb', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 16, height: 1.5, background: '#bbb', display: 'inline-block' }} />Get started
          </div>
          <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-1.2px', color: '#0a0a0a', marginBottom: 6, lineHeight: 1.1 }}>
            Create your<br/><em style={{ fontStyle: 'italic', color: '#ccc' }}>account.</em>
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#999', marginBottom: 22, lineHeight: 1.6 }}>Start generating lead magnets for free — no credit card required.</p>

          {error && <div style={{ background: 'rgba(220,60,60,0.05)', border: '1px solid rgba(220,60,60,0.18)', borderRadius: 9, padding: '10px 14px', fontSize: '0.78rem', color: 'rgba(200,50,50,0.9)', marginBottom: 14 }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Name */}
            <div>
              <Label>Full Name</Label>
              <div style={{ position: 'relative' }}>
                <User size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#ccc', pointerEvents: 'none' }} />
                <input className="sp-in" type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Your full name" required />
              </div>
            </div>

            {/* Email */}
            <div>
              <Label>Email</Label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#ccc', pointerEvents: 'none' }} />
                <input className="sp-in" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@firm.com" required />
              </div>
            </div>

            {/* Phone */}
            <div>
              <Label>Phone (optional)</Label>
              <div style={{ position: 'relative' }}>
                <Phone size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#ccc', pointerEvents: 'none' }} />
                <input className="sp-in" type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange} placeholder="+1 234 567 8900" />
              </div>
            </div>

            {/* Password */}
            <div>
              <Label>Password</Label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#ccc', pointerEvents: 'none' }} />
                <input className="sp-in sp-in-pw" type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="Min. 4 characters" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', display: 'flex', alignItems: 'center' }}>
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {formData.password && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {[1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? strengthColors[strength] : 'rgba(0,0,0,0.06)', transition: 'background .3s' }} />)}
                  </div>
                  <span style={{ fontSize: '0.68rem', color: strengthColors[strength], marginTop: 3, display: 'block' }}>{strengthLabels[strength]}</span>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <Label>Confirm Password</Label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#ccc', pointerEvents: 'none' }} />
                <input className="sp-in sp-in-pw" type={showConfirm ? 'text' : 'password'} name="password_confirm" value={formData.password_confirm} onChange={handleChange} placeholder="Repeat your password" required />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', display: 'flex', alignItems: 'center' }}>
                  {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="sp-btn"
              style={{ width: '100%', padding: '12px', background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: 10, fontFamily: "'Instrument Sans',sans-serif", fontSize: '0.88rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}
              onClick={() => console.log('Signup button clicked!')}>
              {loading ? <><span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.25)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'sp-spin .65s linear infinite' }} />Creating account…</> : 'Create account →'}
            </button>
          </form>

          <p style={{ marginTop: 14, fontSize: '0.72rem', color: '#bbb', textAlign: 'center', lineHeight: 1.5 }}>
            By continuing you agree to our <span style={{ color: '#aaa', cursor: 'pointer' }}>Terms</span> and <span style={{ color: '#aaa', cursor: 'pointer' }}>Privacy Policy</span>.
          </p>
          <p style={{ marginTop: 10, fontSize: '0.78rem', color: '#bbb', textAlign: 'center' }}>
            Already have an account? <Link to="/login" className="sp-link">Sign in</Link>
          </p>
        </div>
      </div>

      {/* ── RIGHT — SHOWCASE ── */}
      <div className="sp-right" style={{ background: '#f7f7f5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 52px', position: 'sticky' as const, top: 0, height: '100vh', overflow: 'hidden' }}>
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
              <div key={i} className="sp-card" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, overflow: 'hidden', transition: 'all .2s', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
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

export default SignupPage