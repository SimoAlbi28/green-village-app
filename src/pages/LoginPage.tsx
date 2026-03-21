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
      <img src="/logo-green-village.png" alt="Green Village" className="auth-logo" />
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
      </div>
    </div>
  )
}
