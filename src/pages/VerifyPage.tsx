import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface VerifyPageProps {
  onGoToLogin: () => void
}

export default function VerifyPage({ onGoToLogin }: VerifyPageProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleVerify = async () => {
    if (!code) {
      setError('Inserisci il codice.')
      return
    }

    // Recupera email e password salvate durante la registrazione
    const savedEmail = sessionStorage.getItem('reg_email')
    const savedPassword = sessionStorage.getItem('reg_password')
    if (!savedEmail || !savedPassword) {
      setError('Sessione scaduta. Torna al login e registrati di nuovo.')
      return
    }

    setLoading(true)
    setError('')

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
      return
    }

    // 2. Recupera nome/cognome dalla registrazione pendente usando l'email dal codice
    const { data: pending } = await supabase
      .from('pending_registrations')
      .select('nome, cognome')
      .eq('email', invite.email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // 3. Crea l'utente in Supabase Auth
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email: savedEmail,
      password: savedPassword,
    })

    if (signUpErr || !signUpData.user) {
      setError("Errore nella creazione dell'account: " + (signUpErr?.message || 'Riprova.'))
      setLoading(false)
      return
    }

    // 4. Crea il profilo utente
    await supabase.from('profiles').insert({
      id: signUpData.user.id,
      nome: pending?.nome || '',
      cognome: pending?.cognome || '',
      palazzina: invite.palazzina,
      email: savedEmail,
    })

    // 5. Elimina il codice (monouso)
    await supabase.from('invite_codes').delete().eq('id', invite.id)

    // 6. Aggiorna lo status della registrazione pendente e pulisci sessione
    await supabase
      .from('pending_registrations')
      .update({ status: 'approved' })
      .eq('email', savedEmail)
    sessionStorage.removeItem('reg_email')
    sessionStorage.removeItem('reg_password')

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="auth-page">
        <p className="auth-tagline">
        Resta aggiornato e condividi con i tuoi colleghi consiglieri manutenzioni, problemi e attività svolte nel condominio.<br />
        <span>Insieme si migliora l'ambiente di vita.</span>
      </p>
        <div className="auth-card">
          <h2 className="auth-card-title">Quasi fatto!</h2>
          <p className="auth-info">
            Account creato con successo. Controlla la tua email: ti abbiamo inviato un link di conferma.
            Dopo aver cliccato il link, potrai accedere con email e password.
          </p>
          <button className="auth-btn-primary" onClick={onGoToLogin}>
            Vai al login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <img src="/logo-green-village.png" alt="Green Village" className="auth-logo" />
      <div className="auth-card">
        <h2 className="auth-card-title">Completa registrazione</h2>
        <p className="auth-info">
          Inserisci il codice ricevuto via email e scegli la tua password.
        </p>
        {error && <p className="auth-error">{error}</p>}
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
          disabled={loading || !code.trim()}
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
