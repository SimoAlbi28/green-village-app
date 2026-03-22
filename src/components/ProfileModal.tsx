import { useState } from 'react'
import type { UserProfile } from '../types'

const FAKE_PWD = '__FAKE_PWD__'

interface ProfileModalProps {
  profile: UserProfile
  userEmail: string
  consiglieri: UserProfile[]
  onClose: () => void
  onLogout: () => void
  onUpdateProfile: (updates: { nome: string; cognome: string; telefono?: string; oldPassword?: string; newPassword?: string; avatar_color?: string }) => Promise<{ error?: string } | void>
}

export default function ProfileModal({ profile, userEmail, consiglieri, onClose, onLogout, onUpdateProfile }: ProfileModalProps) {
  const [profileView, setProfileView] = useState<'profilo' | 'consiglieri'>('profilo')
  const [selectedConsigliere, setSelectedConsigliere] = useState<UserProfile | null>(null)

  const [editMode, setEditMode] = useState(false)
  const [editNome, setEditNome] = useState('')
  const [editCognome, setEditCognome] = useState('')
  const [editTelefono, setEditTelefono] = useState('')
  const [editOldPassword, setEditOldPassword] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editPasswordConferma, setEditPasswordConferma] = useState('')
  const [showOldPwd, setShowOldPwd] = useState(false)
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [editAvatarColor, setEditAvatarColor] = useState(profile.avatar_color || '#1a3a6b')

  const AVATAR_COLORS = [
    '#ffffff', '#00bcd4', '#5cb85c', '#f06292',
    '#f57c00', '#e53935', '#c2185b', '#9c27b0',
    '#7b1fa2', '#1565c0', '#00838f', '#2d6a2d',
    '#37474f', '#1a3a6b',
  ]

  const initials = `${profile.nome[0] ?? ''}${profile.cognome[0] ?? ''}`.toUpperCase()
  const isChangingPwd = editOldPassword !== '' && editOldPassword !== FAKE_PWD

  const hasChanges = () =>
    editNome !== profile.nome ||
    editCognome !== profile.cognome ||
    editTelefono !== (profile.telefono ?? '') ||
    editAvatarColor !== (profile.avatar_color || '#1a3a6b') ||
    isChangingPwd ||
    editPassword !== ''

  const enterEditMode = () => {
    setEditNome(profile.nome)
    setEditCognome(profile.cognome)
    setEditTelefono(profile.telefono ?? '')
    setEditOldPassword(FAKE_PWD)
    setEditPassword('')
    setEditPasswordConferma('')
    setShowOldPwd(false)
    setShowNewPwd(false)
    setShowConfirmPwd(false)
    setSaveError('')
    setEditAvatarColor(profile.avatar_color || '#1a3a6b')
    setEditMode(true)
  }

  const handleCancel = () => {
    if (hasChanges()) {
      if (!confirm('Hai delle modifiche non salvate. Sei sicuro di voler annullare? Le modifiche andranno perse.')) return
    }
    setEditMode(false)
    setSaveError('')
  }

  const handleSave = async () => {
    if (!editNome.trim() || !editCognome.trim()) {
      setSaveError('Nome e cognome sono obbligatori.')
      return
    }
    if (editPassword && !isChangingPwd) {
      setSaveError('Inserisci la password attuale per cambiarla.')
      return
    }
    if (editPassword && editPassword.length < 6) {
      setSaveError('La nuova password deve avere almeno 6 caratteri.')
      return
    }
    if (editPassword && editPassword !== editPasswordConferma) {
      setSaveError('Le password non coincidono.')
      return
    }
    setSaveLoading(true)
    setSaveError('')
    const result = await onUpdateProfile({
      nome: editNome.trim(),
      cognome: editCognome.trim(),
      telefono: editTelefono.trim() || undefined,
      oldPassword: isChangingPwd ? editOldPassword : undefined,
      newPassword: isChangingPwd && editPassword ? editPassword : undefined,
      avatar_color: editAvatarColor,
    })
    if (result?.error) {
      setSaveError(result.error)
      setSaveLoading(false)
      return
    }
    setSaveLoading(false)
    setEditMode(false)
  }

  const closeModal = () => {
    if (editMode && hasChanges()) {
      if (!confirm('Hai delle modifiche non salvate. Sei sicuro di voler chiudere? Le modifiche andranno perse.')) return
    }
    setEditMode(false)
    onClose()
  }

  return (
    <div className="modal" onClick={closeModal}>
      <div className="profile-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="profile-close-btn" onClick={closeModal}>✕</button>

        <div className="profile-modal-tabs">
          <button
            className={profileView === 'profilo' ? 'tab-active' : 'tab-inactive'}
            onClick={() => setProfileView('profilo')}
          >
            Profilo
          </button>
          <button
            className={profileView === 'consiglieri' ? 'tab-active' : 'tab-inactive'}
            onClick={() => setProfileView('consiglieri')}
          >
            Consiglieri
          </button>
        </div>

        {profileView === 'profilo' && !editMode && (
          <div className="profile-view">
            <div className="profile-avatar-row">
              <div className="profile-avatar" style={{ backgroundColor: profile.avatar_color || '#1a3a6b', color: profile.avatar_color === '#ffffff' ? '#000' : '#fff', border: profile.avatar_color === '#ffffff' ? '2px solid #000' : undefined }}>{initials}</div>
              <button className="btn-edit-profile" onClick={enterEditMode} title="Modifica profilo">✏️</button>
            </div>
            <p className="profile-name">{profile.nome} {profile.cognome}</p>
            <p className="profile-palazzina">Palazzina {profile.palazzina}</p>
            <div className="profile-info-row">
              <span className="profile-info-label">✉️</span>
              <span className="profile-info-value">{userEmail}</span>
            </div>
            {profile.telefono && (
              <div className="profile-info-row">
                <span className="profile-info-label">📞</span>
                <span className="profile-info-value">{profile.telefono}</span>
              </div>
            )}
            <button className="btn-logout profile-logout-btn" onClick={onLogout}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
                <path d="M16 13v-2H7V8l-5 4 5 4v-3z"/>
                <path d="M20 3H10c-1.1 0-2 .9-2 2v4h2V5h10v14H10v-4H8v4c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
              </svg>
              Logout
            </button>
          </div>
        )}

        {profileView === 'profilo' && editMode && (
          <div className="profile-edit-view">
            {saveError && <p className="auth-error" style={{ marginBottom: 8 }}>{saveError}</p>}
            <div className="edit-field">
              <div className="avatar-color-preview-top">
                <div className="profile-avatar" style={{ backgroundColor: editAvatarColor, color: editAvatarColor === '#ffffff' ? '#000' : '#fff', border: editAvatarColor === '#ffffff' ? '2px solid #000' : undefined }}>{initials}</div>
              </div>
              <label>Colore avatar</label>
              <div className="avatar-color-picker">
                {AVATAR_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`avatar-color-swatch${editAvatarColor === color ? ' avatar-color-swatch--selected' : ''}`}
                    style={{ backgroundColor: color, border: color === '#ffffff' ? '2px solid #000' : undefined }}
                    onClick={() => setEditAvatarColor(color)}
                  />
                ))}
              </div>
            </div>
            <div className="edit-field">
              <label>Nome</label>
              <input className="auth-input" value={editNome} onChange={(e) => setEditNome(e.target.value)} />
            </div>
            <div className="edit-field">
              <label>Cognome</label>
              <input className="auth-input" value={editCognome} onChange={(e) => setEditCognome(e.target.value)} />
            </div>
            <div className="edit-field">
              <label>Email</label>
              <input className="auth-input" value={userEmail} disabled style={{ opacity: 0.5 }} />
            </div>
            <div className="edit-field">
              <label>Telefono</label>
              <input className="auth-input" type="tel" placeholder="Es. 333 1234567" value={editTelefono} onChange={(e) => setEditTelefono(e.target.value)} />
            </div>
            <div className="edit-field">
              <label>Password attuale <span style={{ fontWeight: 400, fontSize: 12, color: '#888' }}>(clicca per cambiarla)</span></label>
              <div className="pwd-input-row">
                <input
                  className="auth-input"
                  type={showOldPwd ? 'text' : 'password'}
                  value={editOldPassword === FAKE_PWD ? 'fakepassword' : editOldPassword}
                  onFocus={() => { if (editOldPassword === FAKE_PWD) setEditOldPassword('') }}
                  onBlur={() => { if (editOldPassword === '') setEditOldPassword(FAKE_PWD) }}
                  onChange={(e) => setEditOldPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button type="button" className="btn-show-pwd" onClick={() => setShowOldPwd(v => !v)}>{showOldPwd ? '🙈' : '👁️'}</button>
              </div>
            </div>
            {isChangingPwd && (
              <div className="edit-field">
                <label>Nuova password</label>
                <div className="pwd-input-row">
                  <input className="auth-input" type={showNewPwd ? 'text' : 'password'} placeholder="Min. 6 caratteri" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} autoComplete="new-password" />
                  <button type="button" className="btn-show-pwd" onClick={() => setShowNewPwd(v => !v)}>{showNewPwd ? '🙈' : '👁️'}</button>
                </div>
              </div>
            )}
            {isChangingPwd && editPassword && (
              <div className="edit-field">
                <label>Conferma nuova password</label>
                <div className="pwd-input-row">
                  <input className="auth-input" type={showConfirmPwd ? 'text' : 'password'} placeholder="Ripeti la password" value={editPasswordConferma} onChange={(e) => setEditPasswordConferma(e.target.value)} autoComplete="new-password" />
                  <button type="button" className="btn-show-pwd" onClick={() => setShowConfirmPwd(v => !v)}>{showConfirmPwd ? '🙈' : '👁️'}</button>
                </div>
              </div>
            )}
          </div>
        )}
        {profileView === 'profilo' && editMode && (
          <div className="edit-actions">
            <button className="btn-red" onClick={handleCancel} disabled={saveLoading}>Annulla</button>
            <button className="btn-green" onClick={handleSave} disabled={saveLoading}>
              {saveLoading ? 'Salvataggio...' : 'Salva modifiche'}
            </button>
          </div>
        )}

        {profileView === 'consiglieri' && !selectedConsigliere && (
          <div className="consiglieri-view">
            <h3 className="consiglieri-title">Palazzina {profile.palazzina}</h3>
            <p className="consiglieri-count">Consiglieri: {consiglieri.length}</p>
            <ul className="consiglieri-list">
              {[...consiglieri]
                .sort((a, b) => (a.id === profile.id ? -1 : b.id === profile.id ? 1 : 0))
                .map((c) => (
                  <li
                    key={c.id}
                    className={`consigliere-item${c.id === profile.id ? ' consigliere-self' : ' consigliere-clickable'}`}
                    onClick={() => c.id !== profile.id && setSelectedConsigliere(c)}
                  >
                    <span className="consigliere-initials" style={{ backgroundColor: c.avatar_color || '#1a3a6b' }}>{c.nome[0]}{c.cognome[0]}</span>
                    <span>{c.nome} {c.cognome}</span>
                    {c.id === profile.id
                      ? <span className="consigliere-tu">Tu</span>
                      : <span className="consigliere-arrow">›</span>
                    }
                  </li>
                ))}
            </ul>
          </div>
        )}

        {profileView === 'consiglieri' && selectedConsigliere && (
          <div className="consiglieri-view">
            <div className="profile-view" style={{ marginTop: 12 }}>
              <div className="profile-avatar" style={{ backgroundColor: selectedConsigliere.avatar_color || '#1a3a6b' }}>
                {selectedConsigliere.nome[0]}{selectedConsigliere.cognome[0]}
              </div>
              <p className="profile-name">{selectedConsigliere.nome} {selectedConsigliere.cognome}</p>
              <p className="profile-palazzina">Palazzina {selectedConsigliere.palazzina}</p>
              {selectedConsigliere.email && (
                <div className="profile-info-row">
                  <span className="profile-info-label">✉️</span>
                  <span className="profile-info-value">{selectedConsigliere.email}</span>
                </div>
              )}
              {selectedConsigliere.telefono && (
                <div className="profile-info-row">
                  <span className="profile-info-label">📞</span>
                  <span className="profile-info-value">{selectedConsigliere.telefono}</span>
                </div>
              )}
            </div>
            <button className="btn-back-consiglieri" onClick={() => setSelectedConsigliere(null)}>‹ Indietro</button>
          </div>
        )}
      </div>
    </div>
  )
}
