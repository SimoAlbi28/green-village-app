import type { Folders } from '../types'
import FolderCard from './FolderCard'
import Header from './Header'

interface HomePageProps {
  folders: Folders
  yearInput: string
  folderNameInput: string
  showYearModal: boolean
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
  onAddFolder,
  onSetYearInput,
  onSetFolderNameInput,
  onSetShowYearModal,
  onOpenFolder,
  onRenameFolder,
  onDeleteFolder,
  onCopyFolder,
}: HomePageProps) {
  const ordinaCartelle = () => {
    return Object.entries(folders).sort((a, b) => {
      const annoA = parseInt(a[0])
      const annoB = parseInt(b[0])
      return annoB - annoA
    })
  }

  const cartelleOrdinate = ordinaCartelle()

  return (
    <div className="page-home">
      <Header />

      <button id="btn-add-folder" onClick={() => onSetShowYearModal(true)}>
        ➕ Nuova Cartella
      </button>

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
            />
            <label htmlFor="yearInput">Anno:</label>
            <input
              type="text"
              id="yearInput"
              value={yearInput}
              onChange={(e) => onSetYearInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') onAddFolder()
              }}
              placeholder="Es. 2023"
              maxLength={4}
              inputMode="numeric"
              autoFocus
            />
            <div className="modal-buttons">
              <button className="btn-green" onClick={onAddFolder}>
                Conferma
              </button>
              <button
                className="btn-red"
                onClick={() => {
                  onSetShowYearModal(false)
                  onSetYearInput('')
                  onSetFolderNameInput('Manutenzioni')
                }}
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
