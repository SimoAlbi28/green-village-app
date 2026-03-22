import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface RegisterPageProps {
  onGoToLogin: () => void
  onGoToVerify: () => void
}

export default function RegisterPage({ onGoToLogin, onGoToVerify }: RegisterPageProps) {
  const [nome, setNome] = useState('')
  const [cognome, setCognome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [palazzina, setPalazzina] = useState('A')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleRegister = async () => {
    if (!nome.trim() || !cognome.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Compila tutti i campi.')
      return
    }
    if (!email.includes('@')) {
      setError('Email non valida.')
      return
    }
    if (password !== confirmPassword) {
      setError('Le password non coincidono.')
      return
    }
    if (password.length < 6) {
      setError('La password deve essere di almeno 6 caratteri.')
      return
    }
    setLoading(true)
    setError('')
    const { error } = await supabase.from('pending_registrations').insert({
      nome: nome.trim(),
      cognome: cognome.trim(),
      email: email.trim().toLowerCase(),
      palazzina,
    })
    if (error) {
      setError('Errore durante la registrazione. Riprova.')
      setLoading(false)
      return
    }
    // Salva email e password temporaneamente per la VerifyPage
    sessionStorage.setItem('reg_email', email.trim().toLowerCase())
    sessionStorage.setItem('reg_password', password)
    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-badge-label">Sede</div>
        <div className="auth-welcome-badge">
          <div className="auth-badge-main">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#5cb85c"><path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2-8 2 8-2 12-6 12-6S17.5 4.5 17 8z"/></svg>
            <span>Via Pietro Maroncelli</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#5cb85c"><path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2-8 2 8-2 12-6 12-6S17.5 4.5 17 8z"/></svg>
          </div>
          <div className="auth-badge-sub">Trezzano sul Naviglio</div>
        </div>
        <hr className="auth-divider-line" />
        <div className="auth-card">
          <h2 className="auth-card-title">Richiesta inviata!</h2>
          <p className="auth-info">
            La tua richiesta è stata inviata. Riceverai un codice via email non appena
            verificata la tua identità come consigliere della palazzina.
          </p>
          <button className="auth-btn-primary" onClick={onGoToVerify} style={{ display: 'block', margin: '4px auto 0' }}>
            Ho ricevuto il codice
          </button>
          <div className="auth-divider" />
          <button className="auth-btn-link" onClick={() => { sessionStorage.removeItem('reg_email'); sessionStorage.removeItem('reg_password'); onGoToLogin(); }}>
            Torna al login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-badge-label">Sede</div>
      <div className="auth-welcome-badge">
        <div className="auth-badge-main">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#5cb85c"><path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2-8 2 8-2 12-6 12-6S17.5 4.5 17 8z"/></svg>
          <span>Via Pietro Maroncelli</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#5cb85c"><path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2-8 2 8-2 12-6 12-6S17.5 4.5 17 8z"/></svg>
        </div>
        <div className="auth-badge-sub">Trezzano sul Naviglio</div>
      </div>
      <hr className="auth-divider-line" />
      <div className="auth-card">
        <h2 className="auth-card-title">Registrazione</h2>
        <p className="auth-info">Verrai verificato prima di ricevere il codice di accesso.</p>
        {error && <p className="auth-error">{error}</p>}
        <input className="auth-input" type="text" placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
        <input className="auth-input" type="text" placeholder="Cognome" value={cognome} onChange={(e) => setCognome(e.target.value)} />
        <input className="auth-input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="auth-input" type="password" placeholder="Password (min. 6 caratteri)" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        <input className="auth-input" type="password" placeholder="Conferma password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
        <label className="auth-label">Palazzina di appartenenza</label>
        <select className="auth-input" value={palazzina} onChange={(e) => setPalazzina(e.target.value)}>
          {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].map((p) => (
            <option key={p} value={p}>Palazzina {p}</option>
          ))}
        </select>
        <button className="auth-btn-primary" onClick={handleRegister} disabled={loading} style={{ display: 'block', margin: '4px auto 0' }}>
          {loading ? 'Invio...' : 'Richiedi codice'}
        </button>
        <div className="auth-divider" />
        <button className="auth-btn-link" onClick={onGoToLogin}>
          Torna al login
        </button>
      </div>
    </div>
  )
}
