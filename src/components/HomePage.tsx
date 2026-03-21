import { useState } from 'react'
import type { Folders, UserProfile } from '../types'
import FolderCard from './FolderCard'
import Header from './Header'

interface HomePageProps {
  folders: Folders
  yearInput: string
  folderNameInput: string
  showYearModal: boolean
  profile: UserProfile
  userEmail: string
  consiglieri: UserProfile[]
  onAddFolder: () => void
  onSetYearInput: (value: string) => void
  onSetFolderNameInput: (value: string) => void
  onSetShowYearModal: (show: boolean) => void
  onOpenFolder: (anno: string) => void
  onRenameFolder: (anno: string) => void
  onDeleteFolder: (anno: string) => void
  onCopyFolder: (anno: string) => void
  onLogout: () => void
  onUpdateProfile: (updates: { nome: string; cognome: string; telefono?: string; oldPassword?: string; newPassword?: string }) => Promise<{ error?: string } | void>
}

export default function HomePage({
  folders,
  yearInput,
  folderNameInput,
  showYearModal,
  profile,
  userEmail,
  consiglieri,
  onAddFolder,
  onSetYearInput,
  onSetFolderNameInput,
  onSetShowYearModal,
  onOpenFolder,
  onRenameFolder,
  onDeleteFolder,
  onCopyFolder,
  onLogout,
  onUpdateProfile,
}: HomePageProps) {
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i)

  const [profileOpen, setProfileOpen] = useState(false)
  const [profileView, setProfileView] = useState<'profilo' | 'consiglieri'>('profilo')

  // Edit mode state
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

  const initials = `${profile.nome[0] ?? ''}${profile.cognome[0] ?? ''}`.toUpperCase()

  const hasChanges = () =>
    editNome !== profile.nome ||
    editCognome !== profile.cognome ||
    editTelefono !== (profile.telefono ?? '') ||
    editOldPassword !== '' ||
    editPassword !== ''

  const enterEditMode = () => {
    setEditNome(profile.nome)
    setEditCognome(profile.cognome)
    setEditTelefono(profile.telefono ?? '')
    setEditOldPassword('')
    setEditPassword('')
    setEditPasswordConferma('')
    setShowOldPwd(false)
    setShowNewPwd(false)
    setShowConfirmPwd(false)
    setSaveError('')
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
    if (editPassword && !editOldPassword) {
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
      oldPassword: editOldPassword || undefined,
      newPassword: editPassword || undefined,
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
    setProfileOpen(false)
  }

  const cartelleOrdinate = Object.entries(folders).sort((a, b) =>
    parseInt(b[1].anno) - parseInt(a[1].anno)
  )

  return (
    <div className="page-home">
      <div className="logout-bar">
        <button className="btn-logout" onClick={onLogout}>🚪 Logout</button>
        <button className="btn-profile" onClick={() => { setProfileOpen(true); setProfileView('profilo'); setEditMode(false) }}>
          {initials}
        </button>
      </div>

      <Header title={`GREEN VILLAGE PALAZZINA ${profile.palazzina}`} />

      <div className="home-topbar">
        <button id="btn-add-folder" onClick={() => { onSetYearInput(String(currentYear)); onSetShowYearModal(true) }}>
          ➕ Nuova Cartella
        </button>
      </div>

      <div id="folders-list" className={cartelleOrdinate.length === 1 ? 'single-folder' : ''}>
        {cartelleOrdinate.map(([anno, cartella]) => (
          <FolderCard
            key={anno}
            nome={cartella.nome}
            anno={cartella.anno}
            onOpen={() => onOpenFolder(anno)}
            onRename={() => onRenameFolder(anno)}
            onDelete={() => onDeleteFolder(anno)}
            onCopy={() => onCopyFolder(anno)}
          />
        ))}
      </div>

      {/* Profile modal */}
      {profileOpen && (
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
                  <div className="profile-avatar">{initials}</div>
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
                <button className="btn-logout profile-logout-btn" onClick={onLogout}>🚪 Logout</button>
              </div>
            )}

            {profileView === 'profilo' && editMode && (
              <div className="profile-edit-view">
                {saveError && <p className="auth-error" style={{ marginBottom: 8 }}>{saveError}</p>}
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
                  <label>Password attuale <span style={{ fontWeight: 400, fontSize: 12, color: '#888' }}>(solo se vuoi cambiarla)</span></label>
                  <div className="pwd-input-row">
                    <input className="auth-input" type={showOldPwd ? 'text' : 'password'} placeholder="••••••" value={editOldPassword} onChange={(e) => setEditOldPassword(e.target.value)} autoComplete="current-password" />
                    <button type="button" className="btn-show-pwd" onClick={() => setShowOldPwd(v => !v)}>{showOldPwd ? '🙈' : '👁️'}</button>
                  </div>
                </div>
                {editOldPassword && (
                  <div className="edit-field">
                    <label>Nuova password</label>
                    <div className="pwd-input-row">
                      <input className="auth-input" type={showNewPwd ? 'text' : 'password'} placeholder="Min. 6 caratteri" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} autoComplete="new-password" />
                      <button type="button" className="btn-show-pwd" onClick={() => setShowNewPwd(v => !v)}>{showNewPwd ? '🙈' : '👁️'}</button>
                    </div>
                  </div>
                )}
                {editOldPassword && editPassword && (
                  <div className="edit-field">
                    <label>Conferma nuova password</label>
                    <div className="pwd-input-row">
                      <input className="auth-input" type={showConfirmPwd ? 'text' : 'password'} placeholder="Ripeti la password" value={editPasswordConferma} onChange={(e) => setEditPasswordConferma(e.target.value)} autoComplete="new-password" />
                      <button type="button" className="btn-show-pwd" onClick={() => setShowConfirmPwd(v => !v)}>{showConfirmPwd ? '🙈' : '👁️'}</button>
                    </div>
                  </div>
                )}
                <div className="edit-actions">
                  <button className="btn-red" onClick={handleCancel} disabled={saveLoading}>Annulla</button>
                  <button className="btn-green" onClick={handleSave} disabled={saveLoading}>
                    {saveLoading ? 'Salvataggio...' : 'Salva modifiche'}
                  </button>
                </div>
              </div>
            )}

            {profileView === 'consiglieri' && (
              <div className="consiglieri-view">
                <h3 className="consiglieri-title">Palazzina {profile.palazzina}</h3>
                <ul className="consiglieri-list">
                  {consiglieri.map((c) => (
                    <li key={c.id} className="consigliere-item">
                      <span className="consigliere-initials">{c.nome[0]}{c.cognome[0]}</span>
                      <span>{c.nome} {c.cognome}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {showYearModal && (
        <div id="yearModal" className="modal">
          <div className="modal-content">
            <label htmlFor="folderNameInput">Nome:</label>
            <input
              type="text"
              id="folderNameInput"
              value={folderNameInput}
              onChange={(e) => onSetFolderNameInput(e.target.value)}
              placeholder="Es. Manutenzioni"
              maxLength={15}
              autoFocus
            />
            <label htmlFor="yearInput">Anno:</label>
            <select
              id="yearInput"
              value={yearInput}
              onChange={(e) => onSetYearInput(e.target.value)}
            >
              {years.map((y) => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
            </select>
            <div className="modal-buttons">
              <button className="btn-green" onClick={onAddFolder}>Conferma</button>
              <button className="btn-red" onClick={() => { onSetShowYearModal(false); onSetYearInput(''); onSetFolderNameInput('') }}>
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
