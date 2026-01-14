import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

type Note = {
  id: string
  date: string
  text: string
  createdAt: number
}

type Maintenance = {
  id: string
  name: string
  createdAt: number
  qrCode?: string
  notes: Note[]
}

type Folder = {
  id: string
  name: string
  createdAt: number
  maintenances: Maintenance[]
}

type NoteDraft = {
  text: string
  date: string
}

const STORAGE_KEY = 'maintenance-folders-v1'

const nowDateTimeLocal = () => {
  const iso = new Date().toISOString()
  return iso.slice(0, 16)
}

const formatDate = (value: string) => {
  if (!value) return 'Data non indicata'
  const dt = new Date(value)
  return new Intl.DateTimeFormat('it-IT', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(dt)
}

const generateId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2, 10)
}

const parseStored = (): Folder[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (err) {
    console.error('Errore lettura localStorage', err)
    return []
  }
}

const storeData = (folders: Folder[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(folders))
  } catch (err) {
    console.error('Errore salvataggio localStorage', err)
  }
}

const buildFolderExport = (folder: Folder) => {
  const lines: string[] = []
  lines.push(`Anno: ${folder.name}`)
  lines.push('')
  const maints = [...folder.maintenances].sort((a, b) => a.createdAt - b.createdAt)
  maints.forEach((m, idx) => {
    lines.push(`${idx + 1}. ${m.name}${m.qrCode ? ` (QR: ${m.qrCode})` : ''}`)
    const notes = [...m.notes].sort((a, b) => a.createdAt - b.createdAt)
    if (notes.length === 0) {
      lines.push('   - Nessuna nota')
    } else {
      notes.forEach((n) => {
        lines.push(`   - ${formatDate(n.date)}: ${n.text}`)
      })
    }
    lines.push('')
  })
  return lines.join('\n')
}

const copyToClipboard = async (text: string) => {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.warn('Clipboard API non disponibile, fallback')
    const area = document.createElement('textarea')
    area.value = text
    document.body.appendChild(area)
    area.select()
    document.execCommand('copy')
    document.body.removeChild(area)
    return true
  }
}

function App() {
  const [folders, setFolders] = useState<Folder[]>(() => parseStored())
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [yearInput, setYearInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [newMaintenanceName, setNewMaintenanceName] = useState('')
  const [expandedMaintenanceIds, setExpandedMaintenanceIds] = useState<string[]>([])
  const [noteDrafts, setNoteDrafts] = useState<Record<string, NoteDraft>>({})
  const [highlightedMaintenance, setHighlightedMaintenance] = useState<string | null>(null)
  const [pendingQrCode, setPendingQrCode] = useState<string | null>(null)
  const [manualScanCode, setManualScanCode] = useState('')
  const [scannerActive, setScannerActive] = useState(false)
  const [scannerMessage, setScannerMessage] = useState('')
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanFrameRef = useRef<number | null>(null)

  const selectedFolder = useMemo(
    () => folders.find((f) => f.id === selectedFolderId) ?? null,
    [folders, selectedFolderId],
  )

  const sortedFolders = useMemo(() => {
    return [...folders].sort((a, b) => {
      const byYear = Number(b.name) - Number(a.name)
      if (byYear !== 0 && !Number.isNaN(byYear)) return byYear
      return b.createdAt - a.createdAt
    })
  }, [folders])

  const visibleMaintenances = useMemo(() => {
    if (!selectedFolder) return []
    const filtered = selectedFolder.maintenances.filter((m) =>
      m.name.toLowerCase().includes(searchTerm.trim().toLowerCase()),
    )
    return filtered.sort((a, b) => a.name.localeCompare(b.name, 'it', { sensitivity: 'base' }))
  }, [selectedFolder, searchTerm])

  useEffect(() => {
    storeData(folders)
  }, [folders])

  useEffect(() => {
    return () => {
      stopScanner()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateFolder = (folderId: string, updater: (folder: Folder) => Folder) => {
    setFolders((prev) => prev.map((f) => (f.id === folderId ? updater(f) : f)))
  }

  const addFolder = () => {
    const trimmed = yearInput.trim()
    if (!/^\d{4}$/.test(trimmed)) {
      setScannerMessage('Inserisci un anno a 4 cifre')
      return
    }
    const exists = folders.some((f) => f.name === trimmed)
    const folder: Folder = {
      id: generateId(),
      name: trimmed,
      createdAt: Date.now(),
      maintenances: [],
    }
    setFolders((prev) => [folder, ...prev])
    setYearInput('')
    if (exists) {
      setScannerMessage('Esiste già una cartella con questo anno, ne è stata aggiunta un\'altra')
    } else {
      setScannerMessage('')
    }
  }

  const renameFolder = (id: string) => {
    const current = folders.find((f) => f.id === id)
    const next = prompt('Nuovo nome (anno a 4 cifre):', current?.name ?? '')
    if (!next) return
    if (!/^\d{4}$/.test(next.trim())) {
      alert('Inserisci un anno valido a 4 cifre')
      return
    }
    setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, name: next.trim() } : f)))
  }

  const deleteFolder = (id: string) => {
    const folder = folders.find((f) => f.id === id)
    if (!folder) return
    const ok = confirm(`Eliminare la cartella ${folder.name}?`)
    if (!ok) return
    setFolders((prev) => prev.filter((f) => f.id !== id))
    if (selectedFolderId === id) setSelectedFolderId(null)
  }

  const copyFolder = async (folder: Folder) => {
    const text = buildFolderExport(folder)
    await copyToClipboard(text)
    setScannerMessage('Cartella copiata negli appunti')
  }

  const addMaintenance = () => {
    if (!selectedFolder) return
    const trimmed = newMaintenanceName.trim()
    if (!trimmed) return
    const maintenance: Maintenance = {
      id: generateId(),
      name: trimmed,
      createdAt: Date.now(),
      notes: [],
    }
    updateFolder(selectedFolder.id, (folder) => ({
      ...folder,
      maintenances: [...folder.maintenances, maintenance],
    }))
    setNewMaintenanceName('')
    setExpandedMaintenanceIds((prev) => [...prev, maintenance.id])
  }

  const renameMaintenance = (maintenanceId: string) => {
    if (!selectedFolder) return
    const maintenance = selectedFolder.maintenances.find((m) => m.id === maintenanceId)
    const next = prompt('Nuovo nome manutenzione:', maintenance?.name ?? '')
    if (!next) return
    updateFolder(selectedFolder.id, (folder) => ({
      ...folder,
      maintenances: folder.maintenances.map((m) =>
        m.id === maintenanceId ? { ...m, name: next.trim() } : m,
      ),
    }))
  }

  const deleteMaintenance = (maintenanceId: string) => {
    if (!selectedFolder) return
    const maintenance = selectedFolder.maintenances.find((m) => m.id === maintenanceId)
    const ok = confirm(`Eliminare la manutenzione ${maintenance?.name ?? ''}?`)
    if (!ok) return
    updateFolder(selectedFolder.id, (folder) => ({
      ...folder,
      maintenances: folder.maintenances.filter((m) => m.id !== maintenanceId),
    }))
    setExpandedMaintenanceIds((prev) => prev.filter((id) => id !== maintenanceId))
  }

  const toggleMaintenance = (id: string) => {
    setExpandedMaintenanceIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    )
  }

  const updateNoteDraft = (maintenanceId: string, data: Partial<NoteDraft>) => {
    setNoteDrafts((prev) => ({
      ...prev,
      [maintenanceId]: {
        text: data.text ?? prev[maintenanceId]?.text ?? '',
        date: data.date ?? prev[maintenanceId]?.date ?? nowDateTimeLocal(),
      },
    }))
  }

  const addNote = (maintenanceId: string) => {
    if (!selectedFolder) return
    const draft = noteDrafts[maintenanceId] ?? { text: '', date: nowDateTimeLocal() }
    if (!draft.text.trim()) return
    const note: Note = {
      id: generateId(),
      date: draft.date || new Date().toISOString(),
      text: draft.text.trim(),
      createdAt: Date.now(),
    }
    updateFolder(selectedFolder.id, (folder) => ({
      ...folder,
      maintenances: folder.maintenances.map((m) =>
        m.id === maintenanceId ? { ...m, notes: [note, ...m.notes] } : m,
      ),
    }))
    updateNoteDraft(maintenanceId, { text: '', date: nowDateTimeLocal() })
  }

  const editNote = (maintenanceId: string, noteId: string) => {
    if (!selectedFolder) return
    const maintenance = selectedFolder.maintenances.find((m) => m.id === maintenanceId)
    const note = maintenance?.notes.find((n) => n.id === noteId)
    if (!note) return
    const text = prompt('Aggiorna nota:', note.text)
    if (text === null) return
    updateFolder(selectedFolder.id, (folder) => ({
      ...folder,
      maintenances: folder.maintenances.map((m) =>
        m.id === maintenanceId
          ? {
              ...m,
              notes: m.notes.map((n) => (n.id === noteId ? { ...n, text } : n)),
            }
          : m,
      ),
    }))
  }

  const deleteNote = (maintenanceId: string, noteId: string) => {
    if (!selectedFolder) return
    updateFolder(selectedFolder.id, (folder) => ({
      ...folder,
      maintenances: folder.maintenances.map((m) =>
        m.id === maintenanceId ? { ...m, notes: m.notes.filter((n) => n.id !== noteId) } : m,
      ),
    }))
  }

  const copyNote = async (note: Note) => {
    await copyToClipboard(`${formatDate(note.date)} - ${note.text}`)
    setScannerMessage('Nota copiata')
  }

  const copyMaintenanceNotes = async (maintenance: Maintenance) => {
    if (maintenance.notes.length === 0) return
    const text = maintenance.notes
      .slice()
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((n) => `${formatDate(n.date)}: ${n.text}`)
      .join('\n')
    await copyToClipboard(text)
    setScannerMessage('Note della manutenzione copiate')
  }

  const setQrCode = (maintenanceId: string, code: string) => {
    if (!selectedFolder) return
    updateFolder(selectedFolder.id, (folder) => ({
      ...folder,
      maintenances: folder.maintenances.map((m) =>
        m.id === maintenanceId ? { ...m, qrCode: code.trim() } : m,
      ),
    }))
  }

  const clearQrCode = (maintenanceId: string) => {
    if (!selectedFolder) return
    updateFolder(selectedFolder.id, (folder) => ({
      ...folder,
      maintenances: folder.maintenances.map((m) =>
        m.id === maintenanceId ? { ...m, qrCode: undefined } : m,
      ),
    }))
  }

  const handleScanResult = (code: string) => {
    if (!selectedFolder) return
    const trimmed = code.trim()
    if (!trimmed) return
    const maintenance = selectedFolder.maintenances.find((m) => m.qrCode === trimmed)
    if (maintenance) {
      setExpandedMaintenanceIds((prev) => (prev.includes(maintenance.id) ? prev : [...prev, maintenance.id]))
      setHighlightedMaintenance(maintenance.id)
      setSearchTerm(maintenance.name)
      setScannerMessage(`QR trovato: ${maintenance.name}`)
      setTimeout(() => setHighlightedMaintenance(null), 1500)
    } else {
      setPendingQrCode(trimmed)
      setScannerMessage('QR non associato, scegli a quale manutenzione collegarlo')
    }
  }

  const assignPendingQrToExisting = (maintenanceId: string) => {
    if (!pendingQrCode) return
    setQrCode(maintenanceId, pendingQrCode)
    setPendingQrCode(null)
    setScannerMessage('QR associato')
  }

  const createMaintenanceFromPending = (name: string) => {
    if (!pendingQrCode || !selectedFolder) return
    const maintenance: Maintenance = {
      id: generateId(),
      name: name.trim(),
      createdAt: Date.now(),
      qrCode: pendingQrCode,
      notes: [],
    }
    updateFolder(selectedFolder.id, (folder) => ({
      ...folder,
      maintenances: [...folder.maintenances, maintenance],
    }))
    setPendingQrCode(null)
    setNewMaintenanceName('')
    setScannerMessage('Nuova manutenzione creata e collegata')
  }

  const startScanner = async () => {
    setScannerMessage('')
    setScannerActive(true)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setScannerMessage('Fotocamera non disponibile, usa inserimento manuale')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      tryBarcodeDetect()
    } catch (err) {
      console.error(err)
      setScannerMessage('Accesso alla fotocamera negato, usa il codice manuale')
    }
  }

  const tryBarcodeDetect = () => {
    const BarcodeDetectorCtor = (window as unknown as { BarcodeDetector?: any }).BarcodeDetector
    if (!BarcodeDetectorCtor || !videoRef.current) return
    const detector = new BarcodeDetectorCtor({ formats: ['qr_code'] })

    const scan = async () => {
      if (!videoRef.current) return
      try {
        const barcodes = await detector.detect(videoRef.current)
        if (barcodes.length > 0) {
          stopScanner()
          handleScanResult(barcodes[0].rawValue)
          return
        }
      } catch (err) {
        console.debug('Barcode detect error', err)
      }
      scanFrameRef.current = requestAnimationFrame(scan)
    }
    scanFrameRef.current = requestAnimationFrame(scan)
  }

  const stopScanner = () => {
    setScannerActive(false)
    if (scanFrameRef.current) cancelAnimationFrame(scanFrameRef.current)
    scanFrameRef.current = null
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.srcObject = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }

  const handleManualScan = () => {
    handleScanResult(manualScanCode)
    setManualScanCode('')
  }

  const showHome = () => {
    setSelectedFolderId(null)
    setSearchTerm('')
    setScannerMessage('')
    stopScanner()
  }

  const printQr = (code: string, maintenanceName: string) => {
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(code)}`
    const html = `<!doctype html><html><head><title>QR ${maintenanceName}</title></head><body style="display:flex;flex-direction:column;gap:12px;align-items:center;justify-content:center;font-family:Arial;">` +
      `<h2>${maintenanceName}</h2><img src="${url}" alt="QR"><p>${code}</p></body></html>`
    const popup = window.open('', '_blank', 'width=400,height=520')
    if (popup) {
      popup.document.write(html)
      popup.document.close()
    }
  }

  const renderHome = () => (
    <div className="panel">
      <header className="header">
        <div>
          <p className="eyebrow">Registro Manutenzioni</p>
          <h1>Cartelle per anno</h1>
          <p className="subtitle">Crea una cartella per ogni anno e mantieni le manutenzioni separate.</p>
        </div>
      </header>

      <div className="card shadow">
        <div className="row">
          <input
            className="input"
            placeholder="Inserisci anno (es. 2026)"
            value={yearInput}
            onChange={(e) => setYearInput(e.target.value)}
            maxLength={4}
            inputMode="numeric"
          />
          <button className="btn primary" onClick={addFolder}>
            Crea cartella
          </button>
        </div>
        {scannerMessage && <p className="hint">{scannerMessage}</p>}
      </div>

      <div className="grid">
        {sortedFolders.map((folder) => (
          <article key={folder.id} className="folder-card shadow">
            <div className="folder-head">
              <div>
                <p className="eyebrow">Anno</p>
                <h2>{folder.name}</h2>
                <p className="muted">{folder.maintenances.length} manutenzioni</p>
              </div>
              <div className="folder-actions">
                <button className="icon-btn" title="Rinomina" onClick={() => renameFolder(folder.id)}>
                  ✏️
                </button>
                <button className="icon-btn" title="Elimina" onClick={() => deleteFolder(folder.id)}>
                  🗑️
                </button>
                <button className="icon-btn" title="Copia cartella" onClick={() => copyFolder(folder)}>
                  📋
                </button>
              </div>
            </div>
            <div className="folder-footer">
              <button className="btn ghost" onClick={() => setSelectedFolderId(folder.id)}>
                Apri cartella
              </button>
            </div>
          </article>
        ))}
        {sortedFolders.length === 0 && <p className="muted">Nessuna cartella, crea il primo anno.</p>}
      </div>
    </div>
  )

  const renderScanner = () => (
    <div className="scanner">
      <div className="scanner-row">
        <button className={scannerActive ? 'btn ghost' : 'btn secondary'} onClick={scannerActive ? stopScanner : startScanner}>
          {scannerActive ? 'Chiudi scanner' : 'Avvia scanner'}
        </button>
        <div className="manual-row">
          <input
            className="input"
            placeholder="Inserisci codice QR"
            value={manualScanCode}
            onChange={(e) => setManualScanCode(e.target.value)}
          />
          <button className="btn" onClick={handleManualScan}>
            Vai / Abbina
          </button>
        </div>
      </div>
      {scannerActive && (
        <div className="video-box">
          <video ref={videoRef} className="video" muted playsInline />
          <p className="muted">Inquadra il QR con la fotocamera posteriore</p>
        </div>
      )}
      {scannerMessage && <p className="hint">{scannerMessage}</p>}
      {pendingQrCode && (
        <div className="card shadow small-gap">
          <div className="row space">
            <div>
              <p className="eyebrow">QR rilevato</p>
              <strong>{pendingQrCode}</strong>
            </div>
            <button className="btn ghost" onClick={() => setPendingQrCode(null)}>
              Annulla
            </button>
          </div>
          <div className="stack">
            <p className="muted">Collega a una manutenzione esistente</p>
            <div className="chip-row">
              {selectedFolder?.maintenances.map((m) => (
                <button key={m.id} className="chip" onClick={() => assignPendingQrToExisting(m.id)}>
                  {m.name}
                </button>
              ))}
              {selectedFolder?.maintenances.length === 0 && <span className="muted">Nessuna manutenzione</span>}
            </div>
            <p className="muted">Oppure crea e collega</p>
            <div className="row">
              <input
                className="input"
                placeholder="Nome manutenzione"
                value={newMaintenanceName}
                onChange={(e) => setNewMaintenanceName(e.target.value)}
              />
              <button className="btn primary" onClick={() => newMaintenanceName.trim() && createMaintenanceFromPending(newMaintenanceName)}>
                Crea & collega
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderMaintenanceList = () => (
    <div className="stack">
      <div className="card shadow">
        <div className="row space">
          <div className="row flex-1">
            <input
              className="input"
              placeholder="Cerca manutenzione"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="btn ghost" onClick={() => setSearchTerm('')}>
              Mostra tutti
            </button>
          </div>
          <div className="row">
            <input
              className="input"
              placeholder="Nuova manutenzione"
              value={newMaintenanceName}
              onChange={(e) => setNewMaintenanceName(e.target.value)}
            />
            <button className="btn primary" onClick={addMaintenance}>
              Crea
            </button>
          </div>
        </div>
      </div>

      <div className="stack">
        {visibleMaintenances.map((m) => {
          const draft = noteDrafts[m.id] ?? { text: '', date: nowDateTimeLocal() }
          return (
            <article
              key={m.id}
              className={`maintenance-card shadow ${highlightedMaintenance === m.id ? 'highlight' : ''}`}
            >
              <div className="card-head">
                <div>
                  <h3>{m.name}</h3>
                  <div className="tag-row">
                    <span className="tag">Note: {m.notes.length}</span>
                    {m.qrCode && <span className="tag">QR: {m.qrCode}</span>}
                  </div>
                </div>
                <div className="actions">
                  <button className="icon-btn" title="Rinomina" onClick={() => renameMaintenance(m.id)}>
                    ✏️
                  </button>
                  <button className="icon-btn" title="Elimina" onClick={() => deleteMaintenance(m.id)}>
                    🗑️
                  </button>
                  <button className="icon-btn" title="Apri/chiudi" onClick={() => toggleMaintenance(m.id)}>
                    {expandedMaintenanceIds.includes(m.id) ? '➖' : '➕'}
                  </button>
                </div>
              </div>

              {expandedMaintenanceIds.includes(m.id) && (
                <div className="card-body">
                  <div className="qr-row">
                    <input
                      className="input"
                      placeholder="Codice QR"
                      defaultValue={m.qrCode ?? ''}
                      onBlur={(e) => setQrCode(m.id, e.target.value)}
                    />
                    <button className="btn secondary" onClick={() => setQrCode(m.id, m.qrCode ?? '')}>
                      Salva QR
                    </button>
                    {m.qrCode && (
                      <>
                        <button className="btn ghost" onClick={() => clearQrCode(m.id)}>
                          Rimuovi QR
                        </button>
                        <button className="btn" onClick={() => printQr(m.qrCode ?? '', m.name)}>
                          Stampa QR
                        </button>
                      </>
                    )}
                  </div>

                  <div className="note-form">
                    <input
                      type="datetime-local"
                      className="input"
                      value={draft.date}
                      onChange={(e) => updateNoteDraft(m.id, { date: e.target.value })}
                    />
                    <textarea
                      className="input"
                      placeholder="Aggiungi nota (data + descrizione)"
                      value={draft.text}
                      onChange={(e) => updateNoteDraft(m.id, { text: e.target.value })}
                      rows={2}
                    />
                    <button className="btn primary" onClick={() => addNote(m.id)}>
                      Salva nota
                    </button>
                    {m.notes.length > 0 && (
                      <button className="btn ghost" onClick={() => copyMaintenanceNotes(m)}>
                        Copia tutte le note
                      </button>
                    )}
                  </div>

                  <div className="notes">
                    {m.notes
                      .slice()
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((n) => (
                        <div key={n.id} className="note">
                          <div>
                            <p className="eyebrow">{formatDate(n.date)}</p>
                            <p>{n.text}</p>
                          </div>
                          <div className="note-actions">
                            <button className="icon-btn" title="Modifica" onClick={() => editNote(m.id, n.id)}>
                              ✏️
                            </button>
                            <button className="icon-btn" title="Elimina" onClick={() => deleteNote(m.id, n.id)}>
                              🗑️
                            </button>
                            <button className="icon-btn" title="Copia" onClick={() => copyNote(n)}>
                              📋
                            </button>
                          </div>
                        </div>
                      ))}
                    {m.notes.length === 0 && <p className="muted">Nessuna nota</p>}
                  </div>
                </div>
              )}
            </article>
          )
        })}
        {visibleMaintenances.length === 0 && <p className="muted">Nessuna manutenzione trovata</p>}
      </div>
    </div>
  )

  if (!selectedFolder) {
    return <div className="app">{renderHome()}</div>
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <p className="eyebrow">Anno {selectedFolder.name}</p>
          <h1>Registro manutenzioni</h1>
        </div>
        <div className="row">
          <button className="btn ghost" onClick={showHome}>
            Home
          </button>
        </div>
      </header>

      {renderScanner()}

      {renderMaintenanceList()}
    </div>
  )
}

export default App
