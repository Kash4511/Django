import React, { useState } from 'react'
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react'
import axios from 'axios'

interface AuthPagesProps {
  onLogin: (userData: { name?: string; email?: string }) => void
  onClose: () => void
  initialMode?: 'login' | 'signup'
}

const AuthPages: React.FC<AuthPagesProps> = ({ onLogin, onClose, initialMode = 'login' }) => {
  const [isLogin, setIsLogin]           = useState(initialMode === 'login')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [formData, setFormData]         = useState({
    email: '', name: '', phone_number: '', password: '', password_confirm: ''
  })

  const change = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    if (!isLogin) {
      if (formData.password !== formData.password_confirm) { setError('Passwords do not match.'); setLoading(false); return }
      if (!formData.name.trim()) { setError('Full name is required.'); setLoading(false); return }
    }
    try {
      const apiBase = (import.meta as any).env?.VITE_API_BASE_URL || `${window.location.protocol}//${window.location.hostname}:8000`
      const endpoint = isLogin ? '/api/auth/login/' : '/api/auth/register/'
      const payload  = isLogin ? { email: formData.email, password: formData.password } : formData
      const res = await axios.post(`${apiBase}${endpoint}`, payload, { headers: { 'Content-Type': 'application/json' }, timeout: 10000 })
      const data = res.data
      if (data.access && data.refresh) {
        localStorage.setItem('access_token', data.access)
        localStorage.setItem('refresh_token', data.refresh)
        try {
          const prof = await axios.get(`${apiBase}/api/auth/profile/`, { headers: { Authorization: `Bearer ${data.access}` }, timeout: 5000 })
          onLogin(prof.data)
        } catch { onLogin(data.user || { name: 'User', email: formData.email }) }
      } else { setError('Invalid response from server.') }
    } catch (err: unknown) {
      const r = (err as any)?.response?.data
      if (r) setError(r.email?.[0] || r.password?.[0] || r.non_field_errors?.[0] || r.detail || 'Authentication failed.')
      else if ((err as any)?.code === 'ECONNABORTED') setError('Request timed out.')
      else if ((err as any)?.request) setError('Unable to connect. Check your connection.')
      else setError('An unexpected error occurred.')
    } finally { setLoading(false) }
  }

  const strength = (() => {
    const p = formData.password; if (!p) return 0
    let s = 0
    if (p.length >= 8) s++; if (/[A-Z]/.test(p)) s++; if (/[0-9]/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++
    return s
  })()
  const strengthColor = ['#e0e0e0','#e05c5c','#e8a84b','#aac45a','#3dba8a'][strength]
  const strengthLabel = ['','Weak','Fair','Good','Strong'][strength]

  const field = (label: string, name: string, type: string, placeholder: string, Icon: any, required = true) => (
    <div>
      <label style={{ fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#aaa', display: 'block', marginBottom: 6 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <Icon size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#ccc', pointerEvents: 'none' }} />
        <input name={name} type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
          value={(formData as any)[name]} onChange={change} placeholder={placeholder} required={required}
          style={{ width: '100%', paddingLeft: 38, paddingRight: name.includes('password') ? 42 : 14, paddingTop: 11, paddingBottom: 11, background: '#fafafa', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, fontFamily: "'Instrument Sans',sans-serif", fontSize: '0.88rem', color: '#111', outline: 'none', transition: 'border-color .2s' }}
          onFocus={e => { e.target.style.borderColor = 'rgba(0,0,0,0.3)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,0,0,0.04)' }}
          onBlur={e  => { e.target.style.borderColor = 'rgba(0,0,0,0.08)'; e.target.style.boxShadow = 'none' }}
        />
        {name === 'password' && (
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', display: 'flex', alignItems: 'center' }}>
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {name === 'password' && !isLogin && formData.password && (
        <div style={{ marginTop: 7 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? strengthColor : 'rgba(0,0,0,0.06)', transition: 'background .3s' }} />)}
          </div>
          <span style={{ fontSize: '0.68rem', color: strengthColor, marginTop: 3, display: 'block' }}>{strengthLabel}</span>
        </div>
      )}
    </div>
  )

  const showcaseCards = [
    { color: '#0a0a0a', tag: 'Trends Report',  title: 'Sustainable Architecture 2026',   w: '85%' },
    { color: '#1a1428', tag: 'Ultimate Guide',  title: 'Net-Zero Design Principles',      w: '70%' },
    { color: '#0f1e18', tag: 'Case Study',      title: 'Biophilic Office Transformation', w: '90%' },
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,700;0,900;1,700&family=Instrument+Sans:wght@400;500;600&display=swap');
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes apSpin{to{transform:rotate(360deg)}}
        .ap-fade{animation:fadeIn .22s ease;}
        .ap-card-h:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(0,0,0,0.09) !important;}
        @media(max-width:720px){.ap-right-panel{display:none !important;}.ap-left-panel{flex:1 !important;border-right:none !important;}}
      `}</style>

      <div onClick={e => e.stopPropagation()}
        style={{ width: '92vw', maxWidth: 960, height: '90vh', maxHeight: 700, background: '#fff', borderRadius: 20, overflow: 'hidden', display: 'flex', boxShadow: '0 32px 80px rgba(0,0,0,0.22)' }}>

        {/* LEFT */}
        <div className="ap-left-panel" style={{ flex: '0 0 400px', display: 'flex', flexDirection: 'column', padding: '36px 40px', overflowY: 'auto', borderRight: '1px solid rgba(0,0,0,0.07)' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
            <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: '1.25rem', color: '#0a0a0a', letterSpacing: '-0.5px' }}>Forma.</div>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid rgba(0,0,0,0.08)', background: 'transparent', cursor: 'pointer', fontSize: 17, color: '#bbb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', background: '#f7f7f5', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 11, padding: 4, gap: 4, marginBottom: 24 }}>
            {['Sign in','Create account'].map((lbl,i) => {
              const active = isLogin ? i===0 : i===1
              return (
                <button key={i} onClick={() => { setIsLogin(i===0); setError('') }}
                  style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', fontFamily: "'Instrument Sans',sans-serif", fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', background: active ? '#fff' : 'transparent', color: active ? '#111' : '#aaa', boxShadow: active ? '0 1px 4px rgba(0,0,0,0.07)' : 'none', transition: 'all .2s' }}>
                  {lbl}
                </button>
              )
            })}
          </div>

          <div className="ap-fade" key={isLogin ? 'login' : 'signup'}>
            <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: '1.55rem', fontWeight: 900, letterSpacing: '-0.5px', color: '#0a0a0a', marginBottom: 4 }}>
              {isLogin ? 'Welcome back.' : 'Create account.'}
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#999', marginBottom: 20 }}>
              {isLogin ? 'Sign in to your Forma account' : 'Start generating lead magnets for free'}
            </p>

            {error && (
              <div style={{ background: 'rgba(220,60,60,0.05)', border: '1px solid rgba(220,60,60,0.18)', borderRadius: 9, padding: '9px 13px', fontSize: '0.78rem', color: 'rgba(200,50,50,0.9)', marginBottom: 14 }}>
                {error}
              </div>
            )}

            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {field('Email', 'email', 'email', 'you@firm.com', Mail)}
              {!isLogin && field('Full Name', 'name', 'text', 'Your full name', User)}
              {!isLogin && field('Phone', 'phone_number', 'tel', '+1 234 567 8900', Phone, false)}
              {field('Password', 'password', 'password', '••••••••', Lock)}
              {!isLogin && field('Confirm Password', 'password_confirm', 'password', '••••••••', Lock)}

              <button type="submit" disabled={loading}
                style={{ width: '100%', padding: '12px', background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: 10, fontFamily: "'Instrument Sans',sans-serif", fontSize: '0.88rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}
                onMouseEnter={e => { if (!loading) { (e.target as HTMLButtonElement).style.background = '#2a2a2a'; (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)' }}}
                onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = '#0a0a0a'; (e.target as HTMLButtonElement).style.transform = 'none' }}>
                {loading
                  ? <><span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.25)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'apSpin .65s linear infinite' }} /> Please wait…</>
                  : isLogin ? 'Sign in →' : 'Create account →'}
              </button>
            </form>

            <div style={{ marginTop: 16, textAlign: 'center', fontSize: '0.76rem', color: '#bbb' }}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => { setIsLogin(!isLogin); setError('') }}
                style={{ background: 'none', border: 'none', fontFamily: "'Instrument Sans',sans-serif", fontSize: '0.76rem', fontWeight: 600, color: 'rgba(0,0,0,0.5)', cursor: 'pointer' }}>
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </div>

            {!isLogin && (
              <p style={{ marginTop: 12, fontSize: '0.68rem', color: '#ccc', textAlign: 'center', lineHeight: 1.5 }}>
                By continuing you agree to our <span style={{ color: '#aaa', cursor: 'pointer' }}>Terms</span> and <span style={{ color: '#aaa', cursor: 'pointer' }}>Privacy Policy</span>.
              </p>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className="ap-right-panel" style={{ flex: 1, background: '#f7f7f5', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 44px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,0,0,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.025) 1px,transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '0.66rem', fontWeight: 600, letterSpacing: '3px', textTransform: 'uppercase' as const, color: '#bbb', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 16, height: 1.5, background: '#bbb', display: 'inline-block' }} />Sample lead magnets
            </div>
            <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: '1.85rem', fontWeight: 900, letterSpacing: '-0.8px', color: '#0a0a0a', marginBottom: 6, lineHeight: 1.1 }}>
              Over 200+ firms<br/>trust <em style={{ fontStyle: 'italic', color: '#ccc' }}>Forma.</em>
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#999', marginBottom: 24, lineHeight: 1.6 }}>
              Polished, branded PDF lead magnets in seconds — no design skills needed.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {showcaseCards.map((card, i) => (
                <div key={i} className="ap-card-h"
                  style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 11, overflow: 'hidden', transition: 'all .2s', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: card.color, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px)', backgroundSize: '8px 8px' }} />
                    <div style={{ position: 'absolute', top: 9, left: 8, width: 20, height: 2.5, background: 'rgba(255,255,255,0.25)', borderRadius: 2 }} />
                    <div style={{ position: 'absolute', top: 15, left: 8, width: 14, height: 2, background: 'rgba(255,255,255,0.12)', borderRadius: 2 }} />
                    <div style={{ position: 'absolute', top: 20, left: 8, width: 18, height: 2, background: 'rgba(255,255,255,0.12)', borderRadius: 2 }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '1px', color: '#bbb', background: '#f0f0ec', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 20, padding: '2px 7px', display: 'inline-block', marginBottom: 4 }}>{card.tag}</span>
                    <div style={{ fontFamily: "'Fraunces',serif", fontSize: '0.85rem', fontWeight: 700, color: '#0a0a0a', letterSpacing: '-0.2px', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>{card.title}</div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 5 }}>
                      <div style={{ height: 3.5, borderRadius: 2, background: '#f0f0ec', width: card.w }} />
                      <div style={{ height: 3.5, borderRadius: 2, background: '#f0f0ec', width: '40%' }} />
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, width: 26, height: 26, background: '#f0f0ec', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem', fontWeight: 700, color: '#bbb', letterSpacing: '0.5px' }}>PDF</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 20 }}>
              <div style={{ display: 'flex' }}>
                {['KR','MA','JS','PL','BT'].map((a,i) => (
                  <div key={i} style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #f7f7f5', background: '#e8e8e4', marginLeft: i===0 ? 0 : -7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 600, color: '#999' }}>{a}</div>
                ))}
              </div>
              <span style={{ fontSize: '0.72rem', color: '#bbb' }}>Trusted by <strong style={{ color: '#999' }}>200+</strong> architecture firms</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default AuthPages