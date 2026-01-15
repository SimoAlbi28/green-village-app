import { useEffect, useRef, useState } from 'react'
import './App.css'
import FolderCard from './components/FolderCard'
import { Html5Qrcode } from 'html5-qrcode'

// ===== TYPES =====
type Note = {
  data: string
  desc: string
}

type Manutenzione = {
  nome: string
  note: Note[]
  expanded: boolean
}

type Cartella = {
  nome: string
  anno: string
  manutenzioni: Record<string, Manutenzione>
}

type Folders = Record<string, Cartella>

// ===== UTILITY FUNCTIONS =====
const formatData = (d: string): string => {
  const [yyyy, mm, dd] = d.split('-')
  return `${dd}/${mm}/${yyyy.slice(2)}`
}

// ===== APP COMPONENT =====
export default function App() {
  const [folders, setFolders] = useState<Folders>(() => {
    if (typeof window === 'undefined') return {}
    try {
      return JSON.parse(localStorage.getItem('folders') || '{}')
    } catch {
      return {}
    }
  })

  const [page, setPage] = useState<'home' | 'folder'>('home')
  const [currentAnno, setCurrentAnno] = useState<string | null>(null)
  const [yearInput, setYearInput] = useState('')
  const [folderNameInput, setFolderNameInput] = useState('Manutenzioni')
  const [searchInput, setSearchInput] = useState('')
  const [nomeInput, setNomeInput] = useState('')
  const [showNomeModal, setShowNomeModal] = useState(false)
  const [showYearModal, setShowYearModal] = useState(false)
  const [scannerActive, setScannerActive] = useState(false)
  const [noteInModifica, setNoteInModifica] = useState<{
    manutenzioneId: string
    noteIndex: number
  } | null>(null)

  const readerRef = useRef<HTMLDivElement>(null)
  const html5QrCodeRef = useRef<any>(null)
  const nomeInputRef = useRef<HTMLInputElement>(null)
  const manutenzioniListRef = useRef<HTMLDivElement>(null)
  const pageFolderRef = useRef<HTMLDivElement>(null)

  // Salva folders nel localStorage
  useEffect(() => {
    localStorage.setItem('folders', JSON.stringify(folders))
  }, [folders])

  // Resetta scroll della pagina quando si entra in una cartella
  useEffect(() => {
    if (currentAnno) {
      if (manutenzioniListRef.current) {
        manutenzioniListRef.current.scrollTop = 0
      }
      if (pageFolderRef.current) {
        pageFolderRef.current.scrollTop = 0
      }
      // Resetta anche il body e html
      window.scrollTo(0, 0)
    }
  }, [currentAnno])

  // Focus automatico quando si apre il modal manutenzione
  useEffect(() => {
    if (showNomeModal && nomeInputRef.current) {
      setTimeout(() => {
        nomeInputRef.current?.focus()
      }, 100)
    }
  }, [showNomeModal])

  // ===== HOME FUNCTIONS =====
  const ordinaCartelle = () => {
    return Object.entries(folders).sort((a, b) => {
      const annoA = parseInt(a[0])
      const annoB = parseInt(b[0])
      return annoB - annoA
    })
  }

  const aggiungiCartella = () => {
    const anno = yearInput.trim()
    const nome = folderNameInput.trim()
    
    if (!nome) {
      alert('Inserisci un nome valido.')
      return
    }
    
    if (!/^\d{4}$/.test(anno)) {
      alert('Anno non valido. Usa 4 cifre, es: 2023')
      return
    }

    if (folders.hasOwnProperty(anno)) {
      alert('Esiste già una cartella con questo anno.')
      return
    }

    setFolders((prev) => ({
      ...prev,
      [anno]: { nome, anno, manutenzioni: {} },
    }))
    setYearInput('')
    setFolderNameInput('Manutenzioni')
    setShowYearModal(false)
  }

  const rinominaCartella = (anno: string) => {
    const nuovoNome = prompt('Nuovo nome cartella:', folders[anno].nome)?.trim()
    if (!nuovoNome) return

    if (
      Object.entries(folders).some(
        ([key, f]) => f.nome === nuovoNome && key !== anno,
      )
    ) {
      alert('Nome già esistente.')
      return
    }

    setFolders((prev) => ({
      ...prev,
      [anno]: { ...prev[anno], nome: nuovoNome },
    }))
  }

  const eliminaCartella = (anno: string) => {
    if (
      confirm(`Sei sicuro di eliminare la cartella "${folders[anno].nome}"?`)
    ) {
      setFolders((prev) => {
        const newFolders = { ...prev }
        delete newFolders[anno]
        return newFolders
      })
    }
  }

  const copiaTuttoCartella = async (anno: string) => {
    const cartella = folders[anno]
    let testo = `Cartella: ${cartella.nome} ${cartella.anno}\n`
    testo += `Lista Manutenzioni:\n`

    const manutenzioni = cartella.manutenzioni || {}

    if (Object.keys(manutenzioni).length === 0) {
      testo += '(Cartella vuota !)\n'
    } else {
      // Ordina manutenzioni alfabeticamente
      const manutenzioniOrdinate = Object.entries(manutenzioni).sort((a, b) =>
        a[1].nome.localeCompare(b[1].nome)
      )

      manutenzioniOrdinate.forEach(([_, manutenzione], index) => {
        if (index > 0) testo += '\n'
        testo += `- ${manutenzione.nome}:\n`
        
        if (manutenzione.note && manutenzione.note.length) {
          testo += `  - Note:\n`
          
          // Ordina note per data più recente
          const noteOrdinate = [...manutenzione.note].sort(
            (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
          )
          
          noteOrdinate.forEach((n) => {
            testo += `    - ${formatData(n.data)}: ${n.desc}\n`
          })
        }
      })
    }

    try {
      await navigator.clipboard.writeText(testo)
      alert('📋 Contenuto copiato negli appunti!')
    } catch {
      alert('Errore durante la copia negli appunti.')
    }
  }

  // ===== FOLDER FUNCTIONS =====
  const apriCartella = (anno: string) => {
    // Collassa tutte le manutenzioni
    setFolders((prev) => ({
      ...prev,
      [anno]: {
        ...prev[anno],
        manutenzioni: Object.entries(prev[anno].manutenzioni).reduce(
          (acc, [id, manutenzione]) => ({
            ...acc,
            [id]: { ...manutenzione, expanded: false },
          }),
          {}
        ),
      },
    }))
    setCurrentAnno(anno)
    setPage('folder')
  }

  const tornaHome = () => {
    setPage('home')
    setCurrentAnno(null)
    setSearchInput('')
    setScannerActive(false)
  }

  const aggiungiManutenzione = () => {
    if (!currentAnno) return
    const nome = nomeInput.trim().toUpperCase()
    if (!nome) {
      alert('Inserisci un nome valido.')
      return
    }

    const manutenzioniAttuali = folders[currentAnno].manutenzioni
    if (Object.values(manutenzioniAttuali).some((m) => m.nome === nome)) {
      alert('Nome già esistente.')
      return
    }

    const id = Date.now().toString()
    setFolders((prev) => ({
      ...prev,
      [currentAnno]: {
        ...prev[currentAnno],
        manutenzioni: {
          ...prev[currentAnno].manutenzioni,
          [id]: { nome, note: [], expanded: true },
        },
      },
    }))
    setNomeInput('')
    setShowNomeModal(false)
  }

  const rinominaManutenzione = (id: string) => {
    if (!currentAnno) return
    const manutenzione = folders[currentAnno].manutenzioni[id]
    const nuovoNome = prompt('Nuovo nome:', manutenzione.nome)?.trim().toUpperCase()
    if (!nuovoNome) return

    const esisteGia = Object.values(folders[currentAnno].manutenzioni).some(
      (m) => m.nome === nuovoNome && m !== manutenzione,
    )
    if (esisteGia) {
      alert('⚠️ Nome già esistente.')
      return
    }

    setFolders((prev) => ({
      ...prev,
      [currentAnno]: {
        ...prev[currentAnno],
        manutenzioni: {
          ...prev[currentAnno].manutenzioni,
          [id]: { ...manutenzione, nome: nuovoNome },
        },
      },
    }))
  }

  const eliminaManutenzione = (id: string) => {
    if (!currentAnno) return
    const nome = folders[currentAnno].manutenzioni[id].nome
    if (confirm(`Sei sicuro di voler eliminare "${nome}"?`)) {
      setFolders((prev) => ({
        ...prev,
        [currentAnno]: {
          ...prev[currentAnno],
          manutenzioni: Object.fromEntries(
            Object.entries(prev[currentAnno].manutenzioni).filter(
              ([key]) => key !== id,
            ),
          ),
        },
      }))
    }
  }

  const toggleDettagli = (id: string) => {
    if (!currentAnno) return
    setFolders((prev) => ({
      ...prev,
      [currentAnno]: {
        ...prev[currentAnno],
        manutenzioni: {
          ...prev[currentAnno].manutenzioni,
          [id]: {
            ...prev[currentAnno].manutenzioni[id],
            expanded: !prev[currentAnno].manutenzioni[id].expanded,
          },
        },
      },
    }))
  }

  const aggiungiNota = (id: string, data: string, desc: string) => {
    if (!currentAnno) return
    if (!data) {
      alert('Inserisci una data valida.')
      return
    }
    if (!desc.trim()) {
      alert('Inserisci una descrizione.')
      return
    }

    setFolders((prev) => ({
      ...prev,
      [currentAnno]: {
        ...prev[currentAnno],
        manutenzioni: {
          ...prev[currentAnno].manutenzioni,
          [id]: {
            ...prev[currentAnno].manutenzioni[id],
            note:
              noteInModifica && noteInModifica.manutenzioneId === id
                ? prev[currentAnno].manutenzioni[id].note.map((n, idx) =>
                    idx === noteInModifica.noteIndex ? { data, desc } : n,
                  )
                : [
                    ...prev[currentAnno].manutenzioni[id].note,
                    { data, desc },
                  ],
          },
        },
      },
    }))
    setNoteInModifica(null)
  }

  const eliminaNota = (id: string, index: number) => {
    if (!currentAnno) return
    if (confirm('Sei sicuro di voler eliminare questa nota?')) {
      setFolders((prev) => ({
        ...prev,
        [currentAnno]: {
          ...prev[currentAnno],
          manutenzioni: {
            ...prev[currentAnno].manutenzioni,
            [id]: {
              ...prev[currentAnno].manutenzioni[id],
              note: prev[currentAnno].manutenzioni[id].note.filter(
                (_, idx) => idx !== index,
              ),
            },
          },
        },
      }))
    }
  }

  const copiaNote = async (
    id: string,
    selectedIndexes: number[],
    allNotes: Note[],
  ) => {
    if (!currentAnno) return
    const nome = folders[currentAnno].manutenzioni[id].nome

    if (selectedIndexes.length === 0) {
      alert('Seleziona almeno una nota da copiare.')
      return
    }

    const testo =
      `${nome.toUpperCase()}\n\n` +
      selectedIndexes
        .map((i) => {
          const n = allNotes[i]
          return `- [${formatData(n.data)}]: ${n.desc};`
        })
        .join('\n')

    try {
      await navigator.clipboard.writeText(testo)
      alert('✅ Note copiate!')
    } catch {
      alert('Errore nella copia degli appunti.')
    }
  }

  const avviaScanner = async () => {
    setScannerActive(true)
    console.log('Scanner avviato, ricerca fotocamere...')

    try {
      const html5QrCode = new Html5Qrcode('reader')
      html5QrCodeRef.current = html5QrCode

      Html5Qrcode.getCameras()
        .then((cameras: any[]) => {
          console.log('Fotocamere trovate:', cameras)
          if (cameras && cameras.length) {
            // Priorità: fotocamera posteriore
            const backCam = cameras.find(
              (cam) =>
                cam.label.toLowerCase().includes('back') ||
                cam.label.toLowerCase().includes('post') ||
                cam.label.toLowerCase().includes('rear') ||
                cam.label.toLowerCase().includes('fotocamera posteriore'),
            )

            const cameraId = backCam ? backCam.id : cameras[0].id
            console.log('Fotocamera selezionata:', cameraId, backCam?.label || cameras[0].label)

            html5QrCode
              .start(
                cameraId,
                { fps: 10, qrbox: 250 },
                (qrCodeMessage: string) => {
                  console.log('QR Code scansionato:', qrCodeMessage)
                  gestioneScan(qrCodeMessage)
                },
                () => {},
              )
              .catch((err: any) => {
                console.error('Errore avvio scansione:', err)
                alert(`Errore avvio scansione: ${err}`)
                setScannerActive(false)
              })
          } else {
            console.log('Nessuna fotocamera trovata')
            alert('Nessuna fotocamera trovata.')
            setScannerActive(false)
          }
        })
        .catch((err: any) => {
          console.error('Errore fotocamera:', err)
          alert(`Errore fotocamera: ${err}`)
          setScannerActive(false)
        })
    } catch (err) {
      console.error('Errore caricamento scanner:', err)
      alert('Errore nel caricamento dello scanner QR.')
      setScannerActive(false)
    }
  }

  const fermaScanner = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current
        .stop()
        .then(() => {
          html5QrCodeRef.current.clear()
          html5QrCodeRef.current = null
          setScannerActive(false)
        })
        .catch(() => {
          setScannerActive(false)
        })
    }
  }

  const gestioneScan = (text: string) => {
    if (!currentAnno) return
    const nome = text.trim().toUpperCase()
    if (!nome) return

    const manutenzioniAttuali = folders[currentAnno].manutenzioni
    if (Object.values(manutenzioniAttuali).some((m) => m.nome === nome)) {
      alert(`Manutenzione "${nome}" già presente.`)
      return
    }

    const id = Date.now().toString()
    setFolders((prev) => ({
      ...prev,
      [currentAnno]: {
        ...prev[currentAnno],
        manutenzioni: {
          ...prev[currentAnno].manutenzioni,
          [id]: { nome, note: [], expanded: false },
        },
      },
    }))
  }

  // ===== RENDER HOME =====
  const renderHome = () => {
    const cartelleOrdinate = ordinaCartelle()

    return (
      <div className="page-home">
        <h1>
          HOME PAGE
          <br />
          MANUTENZIONI
        </h1>

        <button id="btn-add-folder" onClick={() => setShowYearModal(true)}>
          ➕ Nuova Cartella
        </button>

        <div id="folders-list" className={cartelleOrdinate.length === 1 ? 'single-folder' : ''}>
          {cartelleOrdinate.map(([anno, cartella]) => (
            <FolderCard
              key={anno}
              nome={cartella.nome}
              anno={cartella.anno}
              onOpen={() => apriCartella(anno)}
              onRename={() => rinominaCartella(anno)}
              onDelete={() => eliminaCartella(anno)}
              onCopy={() => copiaTuttoCartella(anno)}
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
                onChange={(e) => setFolderNameInput(e.target.value)}
                placeholder="Es. Manutenzioni"
              />
              <label htmlFor="yearInput">Anno:</label>
              <input
                type="text"
                id="yearInput"
                value={yearInput}
                onChange={(e) => setYearInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') aggiungiCartella()
                }}
                placeholder="Es. 2023"
                maxLength={4}
                inputMode="numeric"
                autoFocus
              />
              <div className="modal-buttons">
                <button className="btn-green" onClick={aggiungiCartella}>
                  Conferma
                </button>
                <button
                  className="btn-red"
                  onClick={() => {
                    setShowYearModal(false)
                    setYearInput('')
                    setFolderNameInput('Manutenzioni')
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

  // ===== RENDER FOLDER =====
  const renderFolder = () => {
    if (!currentAnno || !folders[currentAnno]) return null

    const cartella = folders[currentAnno]
    const manutenzioni = Object.entries(cartella.manutenzioni).sort((a, b) =>
      a[1].nome.localeCompare(b[1].nome),
    )

    const manutenzioniFiltered = manutenzioni.filter(([_, data]) =>
      data.nome.toLowerCase().startsWith(searchInput.trim().toLowerCase()),
    )

    return (
      <div className="page-folder" ref={pageFolderRef}>
        <header id="tit1">
          <div className="title-top">MANUTENZIONI</div>
          <div style={{ fontSize: '1.2rem', color: 'white', marginTop: '5px' }}>
            Anno: {cartella.anno}
          </div>
        </header>

        <div id="buttons-container">
          <div className="row-btns">
            <button id="btn-home" onClick={tornaHome}>
              🏠 Home
            </button>
            <button id="create-manutenzione" onClick={() => setShowNomeModal(true)}>
              ➕ Crea
            </button>
            <button
              id="start-scan"
              onClick={avviaScanner}
              disabled={scannerActive}
            >
              📷 Avvia
            </button>
            <button
              id="stop-scan"
              onClick={fermaScanner}
              disabled={!scannerActive}
            >
              Chiudi 📷
            </button>
          </div>
        </div>

        <div id="reader" ref={readerRef} style={{ display: scannerActive ? 'block' : 'none' }}></div>

        <div id="search-box">
          <label htmlFor="search-input">🔎 Cerca:</label>
          <input
            id="search-input"
            type="text"
            placeholder="Manutenzione..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            autoComplete="off"
          />
          <button
            id="show-all-btn"
            onClick={() => setSearchInput('')}
            className="btn-blue"
          >
            Reset
          </button>
        </div>

        <h2>⚙️ Registro Manutenzioni ⚙️</h2>
        <div id="manutenzioni-list" ref={manutenzioniListRef}>
          {manutenzioniFiltered.map(([id, data]) => (
            <ManutenzionCard
              key={id}
              id={id}
              data={data}
              onToggle={() => toggleDettagli(id)}
              onAddNote={aggiungiNota}
              onDeleteNote={eliminaNota}
              onModifyNote={(noteIndex) => setNoteInModifica({ manutenzioneId: id, noteIndex })}
              onCopyNotes={copiaNote}
              onRename={() => rinominaManutenzione(id)}
              onDelete={() => eliminaManutenzione(id)}
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
                onChange={(e) => setNomeInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') aggiungiManutenzione()
                }}
                autoComplete="off"
              />
              <div className="modal-buttons">
                <button className="btn-green" onClick={aggiungiManutenzione}>
                  Conferma
                </button>
                <button
                  className="btn-red"
                  onClick={() => {
                    setShowNomeModal(false)
                    setNomeInput('')
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

  return (
    <div className="app-shell">
      {page === 'home' ? renderHome() : renderFolder()}
      <footer className="app-footer">
        <a
          href="https://github.com/SimoAlbi28"
          target="_blank"
          rel="noreferrer noopener"
        >
          GitHub: SimoAlbi28
        </a>
      </footer>
    </div>
  )
}

// ===== MANUTENZIONE CARD COMPONENT =====
interface ManutenzionCardProps {
  id: string
  data: any
  onToggle: () => void
  onAddNote: (id: string, data: string, desc: string) => void
  onDeleteNote: (id: string, index: number) => void
  onModifyNote: (index: number) => void
  onCopyNotes: (id: string, selectedIndexes: number[], notes: Note[]) => void
  onRename: () => void
  onDelete: () => void
  noteInModifica: number | null
}

function ManutenzionCard({
  id,
  data,
  onToggle,
  onAddNote,
  onDeleteNote,
  onModifyNote,
  onCopyNotes,
  onRename,
  onDelete,
  noteInModifica,
}: ManutenzionCardProps) {
  const [dataInput, setDataInput] = useState('')
  const [descInput, setDescInput] = useState('')
  const [selectedCheckboxes, setSelectedCheckboxes] = useState<Set<number>>(
    new Set(),
  )
  const [modalitaCopia, setModalitaCopia] = useState(false)

  const notesSorted = [...data.note].sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime(),
  )

  const handleModifyClick = (index: number) => {
    if (noteInModifica === index) {
      setDataInput('')
      setDescInput('')
      onModifyNote(-1)
    } else {
      const nota = data.note[index]
      setDataInput(nota.data)
      setDescInput(nota.desc)
      onModifyNote(index)
    }
  }

  const handleAddNote = () => {
    onAddNote(id, dataInput, descInput)
    setDataInput('')
    setDescInput('')
  }

  const handleCopiaClick = () => {
    setModalitaCopia(true)
  }

  const handleIndietro = () => {
    setModalitaCopia(false)
    setSelectedCheckboxes(new Set())
  }

  return (
    <div className="manutenzione">
      <h3>{data.nome}</h3>
      <div className="nome-e-btn">
        <button className="toggle-btn" onClick={onToggle}>
          {data.expanded ? '🔽' : '🔼'}
        </button>
      </div>

      {data.expanded && (
        <>
          <div className="line-separator"></div>

          <h4 className="titolo-note">Inserimento Note</h4>
          <div className="note-form">
            <label>Data:</label>
            <input
              type="date"
              value={dataInput}
              onChange={(e) => setDataInput(e.target.value)}
            />
            <label>Descrizione (max 300):</label>
            <textarea
              value={descInput}
              onChange={(e) => setDescInput(e.target.value)}
              maxLength={300}
              rows={4}
              className="note-textarea"
            ></textarea>
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <button className="btn-green" onClick={handleAddNote}>
                Conferma
              </button>
            </div>
          </div>

          <div className="line-separator"></div>

          {data.note && data.note.length > 0 && (
            <>
              <h4 className="titolo-note">Note</h4>
              <ul className="note-list">
                {notesSorted.map((nota) => {
                  const originalIndex = data.note.indexOf(nota)
                  const isChecked = selectedCheckboxes.has(originalIndex)

                  return (
                    <li key={originalIndex} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                      <input
                        type="checkbox"
                        className="checkbox-copia-note"
                        checked={isChecked}
                        onChange={(e) => {
                          const newSet = new Set(selectedCheckboxes)
                          if (e.target.checked) {
                            newSet.add(originalIndex)
                          } else {
                            newSet.delete(originalIndex)
                          }
                          setSelectedCheckboxes(newSet)
                        }}
                        style={{ display: modalitaCopia ? 'inline-block' : 'none' }}
                      />
                      <div style={{ flex: 1 }}>
                        <span className="nota-data">{formatData(nota.data)}</span>
                        <br />
                        <span className="nota-desc">{nota.desc}</span>
                      </div>
                      <div
                        className="btns-note"
                        style={{ display: modalitaCopia ? 'none' : 'flex' }}
                      >
                        <button
                          className="btn-blue btn-modifica"
                          onClick={() => handleModifyClick(originalIndex)}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-red btn-elimina"
                          onClick={() => onDeleteNote(id, originalIndex)}
                        >
                          🗑️
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>

              {!modalitaCopia ? (
                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                  <button className="btn-copia-note" onClick={handleCopiaClick}>
                    📋 Copia
                  </button>
                </div>
              ) : (
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    className="btn-seleziona-tutte"
                    onClick={() => {
                      const allIndexes = new Set<number>(
                        data.note.map((_: Note, i: number) => i),
                      )
                      setSelectedCheckboxes(allIndexes)
                    }}
                  >
                    ✔️ Tutte
                  </button>
                  <button
                    className="btn-deseleziona-tutte"
                    onClick={() => setSelectedCheckboxes(new Set())}
                  >
                    ❌ Tutte
                  </button>
                  <button
                    className="btn-indietro"
                    onClick={handleIndietro}
                  >
                    🔙 Indietro
                  </button>
                  <button
                    className="btn-copia-selezionate"
                    onClick={() => {
                      onCopyNotes(id, Array.from(selectedCheckboxes), notesSorted)
                      handleIndietro()
                    }}
                  >
                    📋 Copia
                  </button>
                </div>
              )}

              <div className="line-separator"></div>
            </>
          )}

          <div className="btns-manutenzione">
            <div className="nome-e-btn">
              <button className="btn-blue btn-rinomina" onClick={onRename}>
                ✏️ Rinomina
              </button>
              <button className="btn-orange btn-chiudi" onClick={onToggle}>
                ❌ Chiudi
              </button>
              <button
                className="btn-red btn-elimina-manutenzione"
                onClick={onDelete}
              >
                🗑️ Elimina
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
