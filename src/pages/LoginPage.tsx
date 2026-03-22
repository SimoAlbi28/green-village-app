import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface LoginPageProps {
  onGoToRegister: () => void
  onGoToVerify: () => void
}

export default function LoginPage({ onGoToRegister, onGoToVerify }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Inserisci email e password.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
      if (error) {
        if (error.message.toLowerCase().includes('email not confirmed')) {
          setError('Email non ancora confermata. Contatta l\'amministratore.')
        } else {
          setError('Credenziali non valide. Controlla email e password.')
        }
      }
    } catch {
      setError('Errore di rete. Riprova.')
    }
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-welcome-badge">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#5cb85c"><path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2-8 2 8-2 12-6 12-6S17.5 4.5 17 8z"/></svg>
        <span>Trezzano sul Naviglio</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#5cb85c"><path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2-8 2 8-2 12-6 12-6S17.5 4.5 17 8z"/></svg>
      </div>
      <div className="auth-card">
        <h2 className="auth-card-title">Accedi</h2>
        {error && <p className="auth-error">{error}</p>}
        <input
          className="auth-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <input
          className="auth-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          autoComplete="current-password"
        />
        <button className="auth-btn-primary" onClick={handleLogin} disabled={loading} style={{ display: 'block', margin: '4px auto 0' }}>
          {loading ? 'Accesso in corso...' : 'Accedi'}
        </button>
        <div className="auth-divider" />
        <button className="auth-btn-link" onClick={onGoToRegister}>
          Registrati
        </button>
        <div className="auth-divider" />
        <button className="auth-btn-link" onClick={onGoToVerify}>
          Ho il codice
        </button>
      </div>
      <hr className="auth-divider-line" />
      <p className="auth-tagline">
        Resta aggiornato e condividi con i tuoi colleghi consiglieri manutenzioni, problemi e attività svolte nel condominio.<br />
        <span>Insieme si migliora l'ambiente di vita.</span>
      </p>
    </div>
  )
}
