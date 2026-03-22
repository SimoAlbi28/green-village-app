import { useState, useRef, type MutableRefObject } from 'react'
import { supabase } from '../lib/supabase'

interface VerifyPageProps {
  onGoToLogin: () => void
  isRegisteringRef: MutableRefObject<boolean>
}

export default function VerifyPage({ onGoToLogin, isRegisteringRef }: VerifyPageProps) {
  // Calcola hasSession una sola volta e salvalo in un ref
  const hasSessionRef = useRef(!!(sessionStorage.getItem('reg_email') && sessionStorage.getItem('reg_password')))
  const savedEmailRef = useRef(sessionStorage.getItem('reg_email') || '')
  const savedPasswordRef = useRef(sessionStorage.getItem('reg_password') || '')

  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleVerify = async () => {
    if (!code) {
      setError('Inserisci il codice.')
      return
    }

    const useEmail = hasSessionRef.current ? savedEmailRef.current : email.trim().toLowerCase()
    const usePassword = hasSessionRef.current ? savedPasswordRef.current : password

    if (!useEmail || !usePassword) {
      setError('Inserisci email e password.')
      return
    }

    if (!hasSessionRef.current && usePassword.length < 6) {
      setError('La password deve essere di almeno 6 caratteri.')
      return
    }

    setLoading(true)
    setError('')

    // Blocca gli auth state change durante tutta la registrazione
    isRegisteringRef.current = true

    try {
      // 1. Verifica il codice invito
      const { data: invite, error: inviteErr } = await supabase
        .from('invite_codes')
        .select('*')
        .eq('code', code.trim())
        .gte('expires_at', new Date().toISOString())
        .single()

      if (inviteErr || !invite) {
        setError('Codice non valido, già utilizzato o scaduto.')
        setLoading(false)
        isRegisteringRef.current = false
        return
      }

      // Verifica che l'email corrisponda a quella del codice invito
      if (useEmail !== invite.email) {
        setError('L\'email inserita non corrisponde al codice.')
        setLoading(false)
        isRegisteringRef.current = false
        return
      }

      // 2. Recupera nome/cognome dalla registrazione pendente
      const { data: pending } = await supabase
        .from('pending_registrations')
        .select('nome, cognome')
        .eq('email', invite.email)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      // 3. Elimina il codice invito
      await supabase.from('invite_codes').delete().eq('id', invite.id)

      // 4. Aggiorna lo status della registrazione pendente
      await supabase
        .from('pending_registrations')
        .update({ status: 'approved' })
        .eq('email', useEmail)

      // 5. Crea l'utente in Supabase Auth
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: useEmail,
        password: usePassword,
      })

      if (signUpErr || !signUpData.user) {
        setError("Errore nella creazione dell'account: " + (signUpErr?.message || 'Riprova.'))
        setLoading(false)
        isRegisteringRef.current = false
        return
      }

      // 6. Crea il profilo utente
      await supabase.from('profiles').insert({
        id: signUpData.user.id,
        nome: pending?.nome || '',
        cognome: pending?.cognome || '',
        palazzina: invite.palazzina,
        email: useEmail,
      })

      // 7. Pulisci sessione
      sessionStorage.removeItem('reg_email')
      sessionStorage.removeItem('reg_password')

      // 8. Sblocca gli auth state change e forza il login
      isRegisteringRef.current = false

      // Il signUp potrebbe aver già fatto il login, forziamo un signIn per sicurezza
      await supabase.auth.signInWithPassword({
        email: useEmail,
        password: usePassword,
      })

    } catch (err) {
      setError('Errore durante la registrazione. Riprova.')
      isRegisteringRef.current = false
    }

    setLoading(false)
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
        <h2 className="auth-card-title">Completa registrazione</h2>
        <p className="auth-info">
          {hasSessionRef.current
            ? 'Inserisci il codice ricevuto via email.'
            : 'Inserisci la tua email, scegli una password e inserisci il codice ricevuto.'}
        </p>
        {error && <p className="auth-error">{error}</p>}
        {!hasSessionRef.current && (
          <>
            <input
              className="auth-input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="auth-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="off"
              data-form-type="other"
            />
          </>
        )}
        <input
          className="auth-input"
          type="text"
          inputMode="numeric"
          placeholder="Codice a 5 cifre"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
          maxLength={5}
          style={{ letterSpacing: '6px', fontSize: '20px', textAlign: 'center' }}
        />
        <button
          className="auth-btn-primary"
          onClick={handleVerify}
          disabled={loading || !code.trim() || (!hasSessionRef.current && (!email.trim() || !password))}
          style={{ display: 'block', margin: '4px auto 0' }}
        >
          {loading ? 'Verifica in corso...' : 'Completa registrazione'}
        </button>
        <div className="auth-divider" />
        <button className="auth-btn-link" onClick={onGoToLogin}>
          Torna al login
        </button>
      </div>
    </div>
  )
}
