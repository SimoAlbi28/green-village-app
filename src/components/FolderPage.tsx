import type { Cartella, Note } from '../types'
import ManutenzionCard from './ManutenzionCard'

interface FolderPageProps {
  cartella: Cartella
  searchInput: string
  scannerActive: boolean
  showNomeModal: boolean
  nomeInput: string
  noteInModifica: { manutenzioneId: string; noteIndex: number } | null
  onSetSearchInput: (value: string) => void
  onToggleDettagli: (id: string) => void
  onAddNote: (id: string, data: string, desc: string) => void
  onDeleteNote: (id: string, index: number) => void
  onModifyNote: (manutenzioneId: string, noteIndex: number) => void
  onCopyNotes: (id: string, selectedIndexes: number[], notes: Note[]) => void
  onRenameManutenzione: (id: string) => void
  onDeleteManutenzione: (id: string) => void
  onSetNomeInput: (value: string) => void
  onSetShowNomeModal: (show: boolean) => void
  onAddManutenzione: () => void
  onStartScan: () => void
  onStopScan: () => void
  nomeInputRef: React.RefObject<HTMLInputElement | null>
  manutenzioniListRef: React.RefObject<HTMLDivElement | null>
  pageFolderRef: React.RefObject<HTMLDivElement | null>
  readerRef: React.RefObject<HTMLDivElement | null>
}

export default function FolderPage({
  cartella,
  searchInput,
  scannerActive,
  showNomeModal,
  nomeInput,
  noteInModifica,
  onSetSearchInput,
  onToggleDettagli,
  onAddNote,
  onDeleteNote,
  onModifyNote,
  onCopyNotes,
  onRenameManutenzione,
  onDeleteManutenzione,
  onSetNomeInput,
  onSetShowNomeModal,
  onAddManutenzione,
  onStartScan,
  onStopScan,
  nomeInputRef,
  manutenzioniListRef,
  pageFolderRef,
  readerRef,
}: FolderPageProps) {
  const manutenzioni = Object.entries(cartella.manutenzioni).sort((a, b) =>
    a[1].nome.localeCompare(b[1].nome),
  )

  const manutenzioniFiltered = manutenzioni.filter(([_, data]) =>
    data.nome.toLowerCase().startsWith(searchInput.trim().toLowerCase()),
  )

  return (
    <div className="page-folder" ref={pageFolderRef}>
      <header id="tit1">
        <div className="title-top">{cartella.nome.toUpperCase()}</div>
        <div style={{ fontSize: '1.2rem', color: 'white', marginTop: '5px' }}>
          Anno: {cartella.anno}
        </div>
      </header>

      <div id="buttons-container">
        <div className="row-btns">
          <button id="create-manutenzione" onClick={() => onSetShowNomeModal(true)}>
            ➕ Aggiungi
          </button>
          <button
            id="start-scan"
            onClick={onStartScan}
            disabled={scannerActive}
            style={{ display: 'none' }}
          >
            📷 Avvia
          </button>
          <button
            id="stop-scan"
            onClick={onStopScan}
            disabled={!scannerActive}
            style={{ display: 'none' }}
          >
            Chiudi 📷
          </button>
        </div>
      </div>

      <hr className="section-divider" />

      <div id="reader" ref={readerRef} style={{ display: scannerActive ? 'block' : 'none' }}></div>

      <div id="search-box">
        <label htmlFor="search-input">🔎 Cerca:</label>
        <input
          id="search-input"
          type="text"
          placeholder="Attività..."
          value={searchInput}
          onChange={(e) => onSetSearchInput(e.target.value)}
          autoComplete="off"
        />
        <button
          id="show-all-btn"
          onClick={() => onSetSearchInput('')}
          className="btn-blue"
        >
          Reset
        </button>
      </div>

      <h2>⚙️ Registro Attività ⚙️</h2>
      <div id="manutenzioni-list" ref={manutenzioniListRef}>
        {manutenzioniFiltered.map(([id, data]) => (
          <ManutenzionCard
            key={id}
            id={id}
            data={data}
            onToggle={() => onToggleDettagli(id)}
            onAddNote={onAddNote}
            onDeleteNote={onDeleteNote}
            onModifyNote={(noteIndex) => onModifyNote(id, noteIndex)}
            onCopyNotes={onCopyNotes}
            onRename={() => onRenameManutenzione(id)}
            onDelete={() => onDeleteManutenzione(id)}
            noteInModifica={
              noteInModifica?.manutenzioneId === id
                ? noteInModifica.noteIndex
                : null
            }
          />
        ))}
      </div>

      {showNomeModal && (
        <div id="nomeModal" className="modal">
          <div className="modal-content">
            <label htmlFor="nomeInput">Nome:</label>
            <input
              type="text"
              id="nomeInput"
              ref={nomeInputRef}
              value={nomeInput}
              onChange={(e) => onSetNomeInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') onAddManutenzione()
              }}
              autoComplete="off"
              maxLength={20}
            />
            <div className="modal-buttons">
              <button className="btn-green" onClick={onAddManutenzione}>
                Conferma
              </button>
              <button
                className="btn-red"
                onClick={() => {
                  onSetShowNomeModal(false)
                  onSetNomeInput('')
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
