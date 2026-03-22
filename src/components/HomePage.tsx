import type { Folders, UserProfile } from '../types'
import FolderCard from './FolderCard'
import Header from './Header'

interface HomePageProps {
  folders: Folders
  yearInput: string
  folderNameInput: string
  showYearModal: boolean
  profile: UserProfile
  onAddFolder: () => void
  onSetYearInput: (value: string) => void
  onSetFolderNameInput: (value: string) => void
  onSetShowYearModal: (show: boolean) => void
  onOpenFolder: (anno: string) => void
  onRenameFolder: (anno: string) => void
  onDeleteFolder: (anno: string) => void
  onCopyFolder: (anno: string) => void
}

export default function HomePage({
  folders,
  yearInput,
  folderNameInput,
  showYearModal,
  profile,
  onAddFolder,
  onSetYearInput,
  onSetFolderNameInput,
  onSetShowYearModal,
  onOpenFolder,
  onRenameFolder,
  onDeleteFolder,
  onCopyFolder,
}: HomePageProps) {
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i)

  const cartelleOrdinate = Object.entries(folders).sort((a, b) =>
    parseInt(b[1].anno) - parseInt(a[1].anno)
  )

  return (
    <div className="page-home">
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
