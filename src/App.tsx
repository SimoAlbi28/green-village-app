import { useEffect, useRef, useState } from 'react'
import './App.css'
import { Html5Qrcode } from 'html5-qrcode'
import type { Folders, Note, UserProfile } from './types'
import HomePage from './components/HomePage'
import FolderPage from './components/FolderPage'
import Navbar from './components/Navbar'
import ProfileModal from './components/ProfileModal'
import { supabase } from './lib/supabase'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import VerifyPage from './pages/VerifyPage'

// ===== UTILITY FUNCTIONS =====
const formatData = (d: string): string => {
  const [yyyy, mm, dd] = d.split('-')
  return `${dd}/${mm}/${yyyy.slice(2)}`
}

// ===== APP COMPONENT =====
export default function App() {
  const [folders, setFolders] = useState<Folders>({})
  const [loading, setLoading] = useState(true)

  // Auth state
  const [authPage, setAuthPage] = useState<'login' | 'register' | 'verify'>('login')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  const [page, setPage] = useState<'home' | 'folder'>('home')
  const [currentAnno, setCurrentAnno] = useState<string | null>(null)
  const [yearInput, setYearInput] = useState('')
  const [folderNameInput, setFolderNameInput] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [nomeInput, setNomeInput] = useState('')
  const [pendingQrId, setPendingQrId] = useState<string | null>(null)
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

  const [userEmail, setUserEmail] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)

  // Auth: controlla sessione al mount e ascolta cambiamenti
  useEffect(() => {
    const loadProfile = async (userId: string) => {
      const { data: authData } = await supabase.auth.getUser()
      const email = authData.user?.email ?? ''
      if (email) setUserEmail(email)
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
      if (data) {
        setProfile(data)
        // Sincronizza email nel profilo se mancante
        if (email && !data.email) {
          supabase.from('profiles').update({ email }).eq('id', userId).then()
        }
      }
      setAuthLoading(false)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setAuthLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setProfile(null)
        setFolders({})
        setLoading(true)
        setAuthLoading(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  // Carica consiglieri della stessa palazzina
  const [consiglieri, setConsiglieri] = useState<UserProfile[]>([])
  useEffect(() => {
    if (!profile) return
    supabase
      .from('profiles')
      .select('*')
      .eq('palazzina', profile.palazzina)
      .then(({ data }) => {
        if (data) setConsiglieri(data)
      })
  }, [profile])

  // Carica folders da Supabase quando il profilo è disponibile
  useEffect(() => {
    if (!profile) return
    supabase
      .from('building_data')
      .select('value')
      .eq('palazzina', profile.palazzina)
      .eq('key', 'folders')
      .single()
      .then(({ data }) => {
        if (data?.value && Object.keys(data.value).length > 0) {
          setFolders(data.value)
        } else {
          try {
            const local = JSON.parse(localStorage.getItem(`folders_${profile.palazzina}`) || '{}')
            setFolders(local)
          } catch {}
        }
        setLoading(false)
      })
  }, [profile])

  // Salva folders su Supabase (e localStorage come cache)
  useEffect(() => {
    if (loading || !profile) return
    localStorage.setItem(`folders_${profile.palazzina}`, JSON.stringify(folders))
    supabase
      .from('building_data')
      .upsert({ palazzina: profile.palazzina, key: 'folders', value: folders })
      .then()
  }, [folders, loading, profile])

  // Scroll in cima ad ogni cambio pagina
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    if (manutenzioniListRef.current) manutenzioniListRef.current.scrollTop = 0
    if (pageFolderRef.current) pageFolderRef.current.scrollTop = 0
  }, [page])

  // Focus automatico quando si apre il modal manutenzione
  useEffect(() => {
    if (showNomeModal && nomeInputRef.current) {
      setTimeout(() => {
        nomeInputRef.current?.focus()
      }, 100)
    }
  }, [showNomeModal])

  // ===== HOME FUNCTIONS =====
  const aggiungiCartella = () => {
    const anno = yearInput.trim()
    const nome = folderNameInput.trim()
    
    if (!nome) {
      alert('Inserisci un nome valido.')
      return
    }
    
    if (Object.values(folders).some((f) => f.anno === anno && f.nome === nome)) {
      alert('Esiste già una cartella con lo stesso anno e nome.')
      return
    }

    const id = Date.now().toString()
    setFolders((prev) => ({
      ...prev,
      [id]: { nome, anno, manutenzioni: {} },
    }))
    setYearInput('')
    setFolderNameInput('')
    setShowYearModal(false)
  }

  const rinominaCartella = (anno: string) => {
    const nuovoNome = prompt('Nuovo nome cartella:', folders[anno].nome)?.trim()
    if (!nuovoNome) return

    if (nuovoNome.length > 15) {
      alert('Il nome non può superare 15 caratteri.')
      return
    }

    if (
      Object.entries(folders).some(
        ([key, f]) => f.nome === nuovoNome && f.anno === folders[anno].anno && key !== anno,
      )
    ) {
      alert('Esiste già una cartella con lo stesso anno e nome.')
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
          [id]: { nome, note: [], expanded: true, qrId: pendingQrId || undefined },
        },
      },
    }))
    setNomeInput('')
    setPendingQrId(null)
    setShowNomeModal(false)
  }

  const rinominaManutenzione = (id: string) => {
    if (!currentAnno) return
    const manutenzione = folders[currentAnno].manutenzioni[id]
    const nuovoNome = prompt('Nuovo nome:', manutenzione.nome)?.trim().toUpperCase()
    if (!nuovoNome) return

    if (nuovoNome.length > 20) {
      alert('Il nome non può superare 20 caratteri.')
      return
    }

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
    const raw = text.trim()
    if (!raw) return

    if (!currentAnno) {
      fermaScanner()
      alert('Apri prima una cartella su cui creare la manutenzione.')
      return
    }

    // Ferma lo scanner per evitare letture multiple mentre gestiamo il risultato
    fermaScanner()

    const nome = raw.toUpperCase()
    const manutenzioniAttuali = folders[currentAnno].manutenzioni

    // 1) Match per qrId già salvato
    const byQr = Object.entries(manutenzioniAttuali).find(
      ([_, m]) => m.qrId && m.qrId === raw,
    )

    if (byQr) {
      const [idMatch] = byQr
      setFolders((prev) => ({
        ...prev,
        [currentAnno]: {
          ...prev[currentAnno],
          manutenzioni: Object.fromEntries(
            Object.entries(prev[currentAnno].manutenzioni).map(([id, manut]) => [
              id,
              { ...manut, expanded: id === idMatch },
            ]),
          ),
        },
      }))
      setPage('folder')
      setSearchInput('')
      return
    }

    // 2) Match per nome (compatibilità con vecchi dati senza qrId)
    const byName = Object.entries(manutenzioniAttuali).find(
      ([_, m]) => m.nome === nome,
    )

    if (byName) {
      const [idMatch] = byName
      setFolders((prev) => ({
        ...prev,
        [currentAnno]: {
          ...prev[currentAnno],
          manutenzioni: Object.fromEntries(
            Object.entries(prev[currentAnno].manutenzioni).map(([id, manut]) => [
              id,
              {
                ...manut,
                expanded: id === idMatch,
                qrId: id === idMatch ? raw : manut.qrId, // auto-collega il QR scansionato
              },
            ]),
          ),
        },
      }))
      setPage('folder')
      setSearchInput('')
      return
    }

    // 3) QR nuovo nella cartella corrente: salva il raw come qrId pending, modal vuoto per il nome
    setPendingQrId(raw)
    setNomeInput('')
    setShowNomeModal(true)
  }

  // ===== RENDER HOME =====
  const renderHome = () => {
    return (
      <HomePage
        folders={folders}
        yearInput={yearInput}
        folderNameInput={folderNameInput}
        showYearModal={showYearModal}
        profile={profile!}
        onAddFolder={aggiungiCartella}
        onSetYearInput={setYearInput}
        onSetFolderNameInput={setFolderNameInput}
        onSetShowYearModal={setShowYearModal}
        onOpenFolder={apriCartella}
        onRenameFolder={rinominaCartella}
        onDeleteFolder={eliminaCartella}
        onCopyFolder={copiaTuttoCartella}
      />
    )
  }

  // ===== RENDER FOLDER =====
  const renderFolder = () => {
    if (!currentAnno || !folders[currentAnno]) return null

    const cartella = folders[currentAnno]

    return (
      <FolderPage
        cartella={cartella}
        searchInput={searchInput}
        scannerActive={scannerActive}
        showNomeModal={showNomeModal}
        nomeInput={nomeInput}
        noteInModifica={noteInModifica}
        onSetSearchInput={setSearchInput}
        onToggleDettagli={toggleDettagli}
        onAddNote={aggiungiNota}
        onDeleteNote={eliminaNota}
        onModifyNote={(manutenzioneId, noteIndex) => {
          if (noteIndex === -1) {
            setNoteInModifica(null)
          } else {
            setNoteInModifica({ manutenzioneId, noteIndex })
          }
        }}
        onCopyNotes={copiaNote}
        onRenameManutenzione={rinominaManutenzione}
        onDeleteManutenzione={eliminaManutenzione}
        onSetNomeInput={setNomeInput}
        onSetShowNomeModal={setShowNomeModal}
        onAddManutenzione={aggiungiManutenzione}
        onStartScan={avviaScanner}
        onStopScan={fermaScanner}
        nomeInputRef={nomeInputRef}
        manutenzioniListRef={manutenzioniListRef}
        pageFolderRef={pageFolderRef}
        readerRef={readerRef}
      />
    )
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setFolders({})
    setLoading(true)
    setProfileOpen(false)
    setAuthPage('login')
  }

  const handleUpdateProfile = async (updates: { nome: string; cognome: string; telefono?: string; oldPassword?: string; newPassword?: string; avatar_color?: string }): Promise<{ error?: string } | void> => {
    if (!profile) return
    if (updates.newPassword && updates.oldPassword) {
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email: userEmail, password: updates.oldPassword })
      if (signInErr) return { error: 'Password attuale non corretta.' }
      const { error: pwdErr } = await supabase.auth.updateUser({ password: updates.newPassword })
      if (pwdErr) return { error: 'Errore nel cambio password: ' + pwdErr.message }
    }
    const { error: updateErr } = await supabase.from('profiles').update({
      nome: updates.nome,
      cognome: updates.cognome,
      telefono: updates.telefono || null,
    }).eq('id', profile.id)
    if (updateErr) return { error: 'Errore nel salvataggio: ' + updateErr.message }

    // Salva avatar_color separatamente (richiede colonna avatar_color nella tabella profiles)
    if (updates.avatar_color !== undefined) {
      await supabase.from('profiles').update({ avatar_color: updates.avatar_color || null }).eq('id', profile.id)
    }
    setProfile(prev => prev ? { ...prev, nome: updates.nome, cognome: updates.cognome, telefono: updates.telefono, avatar_color: updates.avatar_color } : null)
    setConsiglieri(prev => prev.map(c => c.id === profile.id ? { ...c, nome: updates.nome, cognome: updates.cognome, telefono: updates.telefono, avatar_color: updates.avatar_color } : c))
  }

  if (authLoading) {
    return <div className="auth-loading">Caricamento...</div>
  }

  if (!profile) {
    if (authPage === 'register') {
      return <RegisterPage onGoToLogin={() => setAuthPage('login')} onGoToVerify={() => setAuthPage('verify')} />
    }
    if (authPage === 'verify') {
      return <VerifyPage onGoToLogin={() => setAuthPage('login')} />
    }
    return <LoginPage onGoToRegister={() => setAuthPage('register')} onGoToVerify={() => setAuthPage('verify')} />
  }

  const initials = profile ? `${profile.nome[0] ?? ''}${profile.cognome[0] ?? ''}`.toUpperCase() : ''

  return (
    <div className="app-shell">
      <Navbar
        initials={initials}
        avatarColor={profile?.avatar_color}
        userName={profile ? `${profile.nome} ${profile.cognome}` : undefined}
        onHomeClick={tornaHome}
        onProfileOpen={() => setProfileOpen(true)}
      />
      {profileOpen && (
        <ProfileModal
          profile={profile!}
          userEmail={userEmail}
          consiglieri={consiglieri}
          onClose={() => setProfileOpen(false)}
          onLogout={handleLogout}
          onUpdateProfile={handleUpdateProfile}
        />
      )}
      {page === 'home' ? renderHome() : renderFolder()}
    </div>
  )
}