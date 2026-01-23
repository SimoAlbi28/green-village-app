# 📋 Documentazione Progetto - Sistema di Gestione Manutenzioni

**Versione**: 1.0  
**Data**: Gennaio 2026  
**Stack**: React 19.2.0 + TypeScript 5.9.3 + Vite 7.2.4  

---

## 🎯 Cos'è il Progetto?

**Sistema di Gestione Manutenzioni** è un'applicazione web realizzata in **React + TypeScript** per registrare, organizzare e tracciare tutte le operazioni di manutenzione svolte su macchinari e impianti.

### Caratteristiche Principali
- ✅ Registrazione completa di interventi di manutenzione
- ✅ Organizzazione gerarchica per anno e macchinario
- ✅ **Funzionamento offline** grazie a localStorage e Service Worker
- ✅ Scanner QR per identificazione rapida macchinari
- ✅ Ricerca e filtri in tempo reale
- ✅ Copia/trasferimento dati tra periodi
- ✅ Persistenza automatica in localStorage
- ✅ Nessuna dipendenza backend

---

## 🏢 A Chi Serve?

Questo progetto è utile per:

### Industria Manifatturiera
Documentare manutenzioni preventive e correttive su macchinari di produzione, conformità ISO (International Organization for Standardization - Organizzazione Internazionale per la Standardizzazione) e audit di qualità.

### Facility Management
Gestire manutenzione impianti HVAC (Heating, Ventilation, Air Conditioning - Riscaldamento, Ventilazione e Condizionamento dell'aria), ascensori, climatizzazione in edifici multipli (hotel, uffici, ospedali).

### Settore Alimentare e Beverage
Tracciare manutenzioni con conformità HACCP (Hazard Analysis and Critical Control Points - Analisi dei Pericoli e Punti Critici di Controllo) su linee di produzione e confezionamento.

### Settore Sanitario
Registrare calibrazione e manutenzione di attrezzature mediche con documentazione per ispezioni normative.

### Logistica e Trasporti
Gestire manutenzione fleet di veicoli, carrelli elevatori, stoccaggio.

### Manutenzione Impianti
Piccole e medie aziende di idraulica, elettrica, HVAC (Heating, Ventilation, Air Conditioning - Riscaldamento, Ventilazione e Condizionamento dell'aria) che gestiscono interventi presso vari clienti.

### Agricoltura Moderna
Documentare manutenzione su trattori, droni, sensori IoT con tracciabilità.

---

## 🏗️ Architettura e Struttura

### Layout Gerarchico dei Dati

L'applicazione organizza i dati in una **struttura gerarchica ben definita**:

```
Folders (Root)
  └─ Cartella (Per anno - es: 2024)
      ├─ nome: "Manutenzioni"
      ├─ anno: "2024"
      └─ manutenzioni
          └─ Manutenzione (Per macchinario - es: Tornio CNC)
              ├─ nome: "Tornio CNC #1"
              ├─ expanded: boolean (UI state)
              ├─ qrId: "QR-001" (opzionale)
              └─ note (Array)
                  ├─ Note 1: { data: "2024-01-15", desc: "Cambio olio" }
                  ├─ Note 2: { data: "2024-01-10", desc: "Controllo utensili" }
                  └─ ...
```

**Spiegazione dello schema**:
I dati sono organizzati come una piramide gerarchica dove:
- **Folders** è il contenitore principale (radice / root)
- Ogni **Cartella** rappresenta un anno di manutenzioni (es: 2024, 2023)
- Dentro ogni cartella ci sono multiple **Manutenzioni**, ognuna riferita a un macchinario specifico
- Ogni **Manutenzione** contiene un array di **Note**, che sono i singoli interventi effettuati nel tempo
- Questo permette di cercare rapidamente: "Trovami tutte le manutenzioni del 2024 → Trovami il tornio CNC → Mostrami tutti gli interventi effettuati su quel tornio"

### Flusso Dati (Unidirectional - Monodirezionale)

```
┌─────────────────────────────────────────┐
│       App.tsx (Componente Principale)   │
│  - Gestione stato globale (folders)     │
│  - Logica di business                   │
│  - Sync con localStorage                │
└──────────────┬──────────────────────────┘
               │
        ┌──────┴──────┐
        │             │
    HomePage      FolderPage
  (Pagina Home) (Pagina Cartella)
        │             │
        │             ├── ManutenzionCard
    FolderCard        │   (Manutenzione)
  (Card Cartella)     │
                      ├── Search Bar
                      ├── QR Scanner
                      └── Modali
```

**Spiegazione del flusso**:
Il flusso dati è **monodirezionale** (in una sola direzione), come un circuito a senso unico:
- **Dall'alto verso il basso** (Parent → Child): `App.tsx` passa i dati ai componenti figli attraverso **props**. Per esempio, App passa `folders` a HomePage e FolderPage
- **Dal basso verso l'alto** (Child → Parent): Quando l'utente clicca un bottone in HomePage, questo chiama una **callback function** ricevuta come prop da App, che aggiorna lo stato centrale
- **Sincronizzazione**: Quando lo stato cambia in App, un **useEffect** (effetto laterale che esegue codice con effetti collaterali) salva automaticamente i dati in localStorage
- **Vantaggio**: Questo pattern rende il flusso dei dati **prevedibile e facile da tracciare** - sai sempre da dove vengono i dati e dove vanno

**Comunicazione**:
- Parent → Child: via **props** (dati e funzioni)
- Child → Parent: via **callback functions** (notifiche di cambio)
- Persistenza: **useEffect** sincronizza con localStorage

---

## ⚛️ Componenti React

### 1. App.tsx - Componente Radice

**Responsabilità**: Gestione dello stato globale, routing, orchestrazione componenti

**Stato Gestito**:
```typescript
// Dati persistenti
folders: Folders  // Tutte le cartelle e manutenzioni

// Navigazione
page: 'home' | 'folder'
currentAnno: string | null

// Input modali
yearInput: string
folderNameInput: string
nomeInput: string
searchInput: string

// UI state
showNomeModal: boolean
showYearModal: boolean
scannerActive: boolean
noteInModifica: { manutenzioneId: string; noteIndex: number } | null
```

**Spiegazione dello stato**:
- **folders**: Contiene TUTTI i dati dell'app (cartelle, manutenzioni, note). È l'unica fonte di verità
- **page**: Indica quale pagina visualizzare (home o folder) - controlla il routing
- **currentAnno**: Quale anno è attualmente aperto (es: "2024") - usato per sapere quale cartella visualizzare
- **yearInput, folderNameInput, nomeInput, searchInput**: Valori temporanei degli input form - si aggiornano mentre l'utente digita
- **showNomeModal, showYearModal**: Flag booleani che controllano se i modali sono visibili
- **scannerActive**: Se lo scanner QR è acceso o spento
- **noteInModifica**: Traccia quale nota è in modifica (contiene l'ID della manutenzione e l'indice della nota)

**Ref utilizzati**:
```typescript
readerRef            // DOM ref per QR scanner
html5QrCodeRef       // Instance QR scanner
nomeInputRef         // Focus automatico input
manutenzioniListRef  // Scroll position
pageFolderRef        // Scroll page folder
```

**Spiegazione dei Ref**:
- **readerRef**: Riferimento al DIV dove renderizzare il lettore QR. Un ref permette di accedere direttamente al nodo DOM
- **html5QrCodeRef**: Riferimento all'istanza dello scanner QR (la libreria html5-qrcode). Serve per controllare lo scanner (start, stop)
- **nomeInputRef**: Riferimento all'input del nome. Si usa per fare il `focus()` automatico quando si apre il modal
- **manutenzioniListRef** e **pageFolderRef**: Ref per controllare la scrollbar, permettendo di resettare la posizione quando si cambia pagina

**Funzioni Core**:
- `aggiungiCartella()` - Crea nuova cartella anno
- `rinominaCartella(anno)` - Modifica nome cartella
- `eliminaCartella(anno)` - Rimuove cartella
- `copiaCartella(anno)` - Duplica cartella completa
- `aggiungiManutenzione()` - Crea nuovo macchinario
- `aggiungiNota(id, data, desc)` - Registra intervento
- `modificaNota(id, index, data, desc)` - Modifica intervento
- `eliminaNota(id, index)` - Rimuove intervento
- `scansionaQr()` - Avvia scanner QR
- `trovaPerQr(qrId)` - Espande manutenzione scansionata

**Hooks Utilizzati**:
```typescript
useState()      // Gestione stato
useEffect()     // Sincronizzazione localStorage, scroll reset, focus
useRef()        // Ref DOM e instance QR
```

---

### 2. HomePage.tsx - Pagina Iniziale

**Responsabilità**: Visualizzazione e gestione cartelle (anni)

**Props Ricevuti**:
```typescript
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
```

**Funzionalità**:
- Visualizza cartelle ordinate per anno (decrescente)
- Pulsante "➕ Nuova Cartella" apre modal
- Modal chiede: Nome cartella + Anno
- Validazione: Anno deve essere 4 cifre, non duplicato
- FolderCard con azioni: Apri, Rinomina, Elimina, Copia

---

### 3. FolderPage.tsx - Pagina Cartella

**Responsabilità**: Gestione manutenzioni all'interno di una cartella anno

**Layout Pagina**:
```
┌─────────────────────────────────────┐
│         Header (MANUTENZIONI)       │
│         Anno: 2024                  │
├─────────────────────────────────────┤
│ [Home] [Crea] [Avvia] [Chiudi]      │
├─────────────────────────────────────┤
│ [QR Scanner - quando attivo]        │
├─────────────────────────────────────┤
│ 🔎 Cerca: [Input] [Reset]           │
├─────────────────────────────────────┤
│ ⚙️ Registro Manutenzioni ⚙️         │
│                                     │
│ ┌─ Tornio CNC #1 ──┐               │
│ │ 🔽 [Rinomina] [Elimina]         │
│ │ ├─ Data: [] Descrizione: []     │
│ │ │  [Aggiungi Nota]              │
│ │ ├─ Note:                        │
│ │ │  • 15/01/24: Cambio olio      │
│ │ │    [✏️] [🗑️]                  │
│ └─────────────────────────────────┘
│                                     │
│ ┌─ Pressa Idraulica B-500 ──┐      │
│ │ 🔼 [Rinomina] [Elimina]   │      │
│ └──────────────────────────────┘
└─────────────────────────────────────┘
```

**Funzionalità Core**:
- Visualizza manutenzioni ordinate alfabeticamente
- Ricerca in tempo reale (case-insensitive, start-with)
- Scanner QR integrato
- Crea, rinomina, elimina manutenzioni

---

### 4. ManutenzionCard.tsx - Card Manutenzione

**Responsabilità**: Visualizzazione e gestione singola manutenzione con note

**State Locale**:
```typescript
dataInput: string        // Data del form
descInput: string        // Descrizione del form
selectedCheckboxes: Set<number>  // Note selezionate per copia
modalitaCopia: boolean   // Modalità selezione note attiva
```

**Funzionalità**:

#### a) **Espansione/Collasso**
```tsx
<button className="toggle-btn" onClick={onToggle}>
  {data.expanded ? '🔽' : '🔼'}
</button>
```

#### b) **Form Inserimento Note**
```tsx
{data.expanded && (
  <>
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
    />
    <button onClick={handleAddNote}>➕ Aggiungi Nota</button>
  </>
)}
```

#### c) **Visualizzazione Note**
Note ordinate per data **decrescente** (più recente in alto):
```typescript
const notesSorted = [...data.note].sort(
  (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
)
```

**Cosa fa questo codice**: 
- `[...data.note]` - Crea una **copia** dell'array di note (il `...` significa "copia tutto")
- `.sort()` - Ordina l'array
- `new Date(b.data).getTime()` e `new Date(a.data).getTime()` - Convertono le date in millisecondi per poterle confrontare numericamente
- `b.data - a.data` - Se il risultato è **negativo**, b viene prima di a. Se è **positivo**, a viene prima. Quindi le note più recenti (date più grandi) vengono prima
- **Risultato finale**: Le note più recenti appaiono in cima alla lista

#### d) **Modifica Nota**
```typescript
const handleModifyClick = (index: number) => {
  if (noteInModifica === index) {
    // Annulla modifica
    setDataInput('')
    setDescInput('')
    onModifyNote(-1)
  } else {
    // Carica nota per modifica
    const nota = data.note[index]
    setDataInput(nota.data)
    setDescInput(nota.desc)
    onModifyNote(index)
  }
}
```

**Cosa fa questo codice**:
- Controlla se stai già modificando QUESTA NOTA (`noteInModifica === index`)
- Se SÌ: resetta i campi di input (`setDataInput('')` e `setDescInput('')`), e comunica al componente padre che la modifica è annullata (`onModifyNote(-1)`)
- Se NO: estrae la nota dall'array (`const nota = data.note[index]`), carica i suoi dati nei campi di input (`setDataInput` e `setDescInput`), e comunica al padre quale nota si sta modificando (`onModifyNote(index)`)
- **Risultato**: Un click prepara la nota per l'editing; un altro click annulla tutto

#### e) **Copia Note tra Manutenzioni**
```typescript
const handleCopiaClick = () => {
  setModalitaCopia(true)  // Attiva selezione checkbox
}

// Seleziona note con checkbox
{modalitaCopia && (
  <>
    {notesSorted.map((nota, idx) => (
      <label key={idx}>
        <input
          type="checkbox"
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedCheckboxes(prev => new Set(prev).add(idx))
            } else {
              setSelectedCheckboxes(prev => {
                const newSet = new Set(prev)
                newSet.delete(idx)
                return newSet
              })
            }
          }}
        />
        {nota.data} - {nota.desc}
      </label>
    ))}
    <button onClick={() => {
      onCopyNotes(id, Array.from(selectedCheckboxes), data.note)
    }}>
      Incolla in Manutenzione
    </button>
  </>
)}
```

**Cosa fa questo codice**:
1. **`handleCopiaClick`**: Quando clicchi "Copia Note", attiva `setModalitaCopia(true)` che fa comparire le checkbox
2. **Le checkbox**: Quando selezioni una nota, `e.target.checked` diventa `true`
   - Se checkato: `setSelectedCheckboxes(prev => new Set(prev).add(idx))` aggiunge l'indice al Set di note selezionate
   - Se unchecked: `.delete(idx)` rimuove l'indice dal Set
3. **Set** (anziché array): Una struttura dati che tiene traccia automaticamente di quali note hai selezionato, senza duplicati
4. **Bottone "Incolla"**: Quando clicchi, `Array.from(selectedCheckboxes)` converte il Set in array e lo manda al componente padre (`onCopyNotes`)
- **Risultato**: Puoi selezionare più note e copiarle in un'altra manutenzione

#### f) **Gestione Manutenzione**
- Bottone Rinomina
- Bottone Elimina (con conferma)

---

### 5. FolderCard.tsx - Card Cartella

**Responsabilità**: Rappresentazione singola cartella in HomePage

**Visualizza**: Nome cartella, anno, numero manutenzioni, pulsanti azioni

---

### 6. Header.tsx - Intestazione
**Responsabilità**: Banner top dell'app con titolo

---

### 7. Footer.tsx - Piè di Pagina
**Responsabilità**: Informazioni di piè di pagina

---

## 📊 Struttura Dati (types.ts)

### Type System TypeScript

```typescript
// Singola nota/intervento
export type Note = {
  data: string          // Formato ISO: YYYY-MM-DD
  desc: string          // Max 300 caratteri
}

// Singola manutenzione (un macchinario)
export type Manutenzione = {
  nome: string          // Nome del macchinario
  note: Note[]          // Array interventi storici
  expanded: boolean     // Flag UI (card espansa/collassata)
  qrId?: string        // ID QR opzionale per scansione
}

// Cartella raggruppa manutenzioni per anno
export type Cartella = {
  nome: string                        // Nome cartella (es "Manutenzioni")
  anno: string                        // Anno in formato YYYY
  manutenzioni: Record<string, Manutenzione>  // Macchinari con ID univoco
}

// Root: tutte le cartelle
export type Folders = Record<string, Cartella>
```

### Esempio Struttura Dati Reale

```json
{
  "2024": {
    "nome": "Manutenzioni",
    "anno": "2024",
    "manutenzioni": {
      "tornio-cnc-1": {
        "nome": "Tornio CNC #1",
        "qrId": "QR-001",
        "expanded": false,
        "note": [
          {
            "data": "2024-01-15",
            "desc": "Cambio olio motore principale"
          },
          {
            "data": "2024-01-10",
            "desc": "Controllo usura utensili di taglio"
          }
        ]
      },
      "pressa-idraulica-b500": {
        "nome": "Pressa Idraulica B-500",
        "expanded": true,
        "note": [
          {
            "data": "2024-01-20",
            "desc": "Revisione filtri oleoidraulici"
          }
        ]
      }
    }
  },
  "2023": {
    "nome": "Manutenzioni",
    "anno": "2023",
    "manutenzioni": { /* ... */ }
  }
}
```

---

## 🔧 Funzionalità Principali

### 1. Gestione Cartelle (Per Anno)

**Creare Cartella** - Click "➕ Nuova Cartella" → Modal input Nome + Anno → Validazione 4 cifre → Crea in `folders[anno]`

**Aprire Cartella** - Click su FolderCard → `currentAnno = anno` → Naviga FolderPage

**Rinominare Cartella** - Click "Rinomina" → Modal → Aggiorna `cartella.nome`

**Copiare Cartella** - Click "Copia" → Chiede anno destinazione → Copia intero oggetto

**Eliminare Cartella** - Click "Elimina" → Richiede conferma → Rimuove `folders[anno]`

---

### 2. Gestione Manutenzioni

**Creare Manutenzione** - Click "➕ Crea" → Modal nome → Auto-genera ID → Aggiunge in `manutenzioni[id]`

**Aggiungere Nota** - Espandere manutenzione → Form (data + descrizione) → Click "Aggiungi" → Aggiunge in `note[]`

**Visualizzare Note** - Note ordinate per data decrescente, data formattata DD/MM/YY

**Modificare Nota** - Click ✏️ → Carica in form → Modifica → "Salva Modifica"

**Eliminare Nota** - Click 🗑️ → Richiede conferma → Rimuove da array

**Rinominare/Eliminare Manutenzione** - Button dedicati con conferma

---

### 3. Ricerca e Filtri

```typescript
const manutenzioniFiltered = manutenzioni.filter(([_, data]) =>
  data.nome.toLowerCase().startsWith(searchInput.trim().toLowerCase()),
)
```

Filtra **in tempo reale**, case-insensitive, match inizio stringa

---

### 4. Scanner QR

Avvia scanner QR, inquadra codice, se corrisponde espande manutenzione, altrimenti chiede conferma creazione

---

### 5. Copia Note tra Manutenzioni

Seleziona note con checkbox → "Incolla" → Seleziona destinazione → Note copiate

---

## 💾 Persistenza Dati

### localStorage

**Key**: `"folders"`  
**Valore**: JSON stringificato `Folders`  
**Capacità**: ~5-10MB  

```typescript
// Sincronizzazione automatica
useEffect(() => {
  localStorage.setItem('folders', JSON.stringify(folders))
}, [folders])

// Caricamento lazy al mount
const [folders, setFolders] = useState<Folders>(() => {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem('folders') || '{}')
  } catch {
    return {}
  }
})
```

**Cosa fa questo codice**:
1. **Primo blocco (Sincronizzazione)**: 
   - `useEffect(() => { ... }, [folders])` - "Ogni volta che lo stato `folders` cambia, esegui questo effetto"
   - `JSON.stringify(folders)` - Converte l'oggetto JavaScript in testo JSON
   - `localStorage.setItem('folders', ...)` - Salva il testo nel browser, con chiave `"folders"`
   - **Risultato**: I dati vengono automaticamente salvati sul disco rigido del browser ogni volta che cambiano
2. **Secondo blocco (Caricamento)**: Spiegato sopra in "Lazy State Initialization"
- **Flusso completo**: App si apre → Carica dati da localStorage → L'utente fa modifiche → useEffect salva in localStorage → App si chiude. Se l'utente riabre, i dati vengono ricaricaricati

### Service Worker (sw.js)

```typescript
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
  })
}
```

Caching asset, offline support, sincronizzazione online

---

## 🛠️ Stack Tecnologico

### Runtime & Language

| Componente | Versione | Ruolo |
|-----------|----------|-------|
| **React** | 19.2.0 | UI Framework |
| **React DOM** | 19.2.0 | DOM Rendering |
| **TypeScript** | 5.9.3 | Type Safety |

### Build & Development

| Tool | Versione | Ruolo |
|------|----------|-------|
| **Vite** | 7.2.4 | Build tool, dev server con HMR |
| **@vitejs/plugin-react-swc** | 4.2.2 | Fast Refresh con SWC |
| **SWC** | (interno) | JSX + TS transpiler (Rust-based, veloce) |
| **esbuild** | (interno) | Minify + tree-shaking |

### Linting & Quality (Qualità del Codice)

| Tool | Versione | Ruolo |
|------|----------|-------|
| **ESLint** | 9.39.1 | Code quality - Analizzatore statico di qualità del codice |
| **TypeScript-ESLint** | 8.46.4 | TS-specific rules - Regole specifiche per TypeScript |
| **eslint-plugin-react-hooks** | 7.0.1 | Hooks enforcement - Controllo corretto utilizzo dei React Hooks |
| **eslint-plugin-react-refresh** | 0.4.24 | Fast Refresh compatibility - Compatibilità con aggiornamento veloce moduli |

### Libraries Specifiche

**html5-qrcode 2.3.8** - QR code scanning (Scansionamento codici QR) con WebRTC (Web Real-Time Communication - Comunicazione Web in Tempo Reale)

### Package Manager (Gestore di Pacchetti)

**pnpm 8.x** - Alternativa veloce a npm (Node Package Manager - Gestore di Pacchetti di Node) e yarn

### Deployment (Distribuzione)

**Vercel** - Hosting serverless (senza gestione server) con auto-deploy (distribuzione automatica)  
**GitHub Pages** - Alternativa con `gh-pages` (GitHub Pages - Pagine GitHub)

---

## 🎯 Hooks React Utilizzati

### useState()
```typescript
const [folders, setFolders] = useState<Folders>()  // Stato principale
const [page, setPage] = useState<'home' | 'folder'>('home')  // Navigazione
const [searchInput, setSearchInput] = useState('')  // UI input
```

**Cosa fa questo codice**:
- `useState<Folders>()` - Crea uno stato che contiene TUTTE le cartelle e manutenzioni. È la "memoria" dell'app. Quando cambia, React re-renderizza automaticamente la pagina
- `page` - Tiene traccia della pagina corrente ("home" o "folder"). Quando cambia, l'app mostra una pagina diversa
- `searchInput` - Memorizza il testo che l'utente sta digitando nella barra di ricerca. Ogni carattere aggiorna questo stato, che fa re-renderizzare i risultati filtrati
- **Risultato**: L'app reagisce (da cui il nome "React") alle modifiche dello stato, aggiornando la UI automaticamente

### useEffect()
```typescript
// Sync localStorage
useEffect(() => {
  localStorage.setItem('folders', JSON.stringify(folders))
}, [folders])

// Reset scroll quando cambia cartella
useEffect(() => {
  if (currentAnno) window.scrollTo(0, 0)
}, [currentAnno])

// Focus automatico nel modal
useEffect(() => {
  if (showNomeModal && nomeInputRef.current) {
    setTimeout(() => nomeInputRef.current?.focus(), 100)
  }
}, [showNomeModal])
```

**Cosa fa questo codice**:
1. **Primo useEffect** - Ogni volta che `folders` cambia, salva automaticamente in localStorage. Il `[folders]` (dependency array - array di dipendenze) dice "esegui questo effetto ogni volta che folders cambia"
2. **Secondo useEffect** - Quando cambi cartella (`currentAnno` cambia), resetta lo scroll della pagina all'inizio (`window.scrollTo(0, 0)`)
3. **Terzo useEffect** - Quando il modal si apre (`showNomeModal` diventa true), fa il focus automatico sull'input del nome. Il `setTimeout` aggiunge un piccolo ritardo per assicurarsi che il modal sia già reso
- **Risultato**: Gli effetti collaterali (salvare in localStorage, resettare scroll, fare focus) avvengono automaticamente quando lo stato cambia

### useRef()
```typescript
const readerRef = useRef<HTMLDivElement>(null)  // DOM ref QR
const html5QrCodeRef = useRef<any>(null)  // Instance scanner
const nomeInputRef = useRef<HTMLInputElement>(null)  // Focus imperative

// Uso: html5QrCodeRef.current.render() / nomeInputRef.current?.focus()
```

**Cosa fa questo codice**:
- `readerRef = useRef<HTMLDivElement>(null)` - Crea un "collegamento" diretto a un elemento HTML nel DOM. Non lo visualizza ancora (null), ma ti permette di accedervi direttamente in JavaScript
- `html5QrCodeRef` - Memorizza l'istanza dello scanner QR. Serve per controllare lo scanner (avviare, fermare)
- `nomeInputRef` - Memorizza il riferimento all'input del nome. Usato per fare `.focus()` automatico, portando il focus dell'utente su quel campo quando il modal si apre
- **Risultato**: Puoi accedere e controllare gli elementi DOM direttamente, aggirando il sistema di rendering di React (utile per librerie esterne come il QR scanner)

---

## 🚀 Caratteristiche Tecniche Avanzate

**Lazy State Initialization** (Inizializzazione Pigra dello Stato)
```typescript
const [folders, setFolders] = useState<Folders>(() => {
  // Eseguito solo al mount, non ad ogni render
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem('folders') || '{}')
  } catch {
    return {}
  }
})
```

**Cosa fa questo codice**:
- Normalmente, se scritta `useState<Folders>()`, React creerebbe uno state vuoto ogni volta che il componente si renderizza
- Passando una **funzione callback** (dentro le parentesi graffe), React la esegue **SOLO al primo caricamento** (`mount`) del componente
- `if (typeof window === 'undefined')` - Verifica se il codice è eseguito nel browser (window esiste) o lato server
- `JSON.parse(localStorage.getItem('folders') || '{}')` - Legge i dati da localStorage e li converte da JSON a oggetto JavaScript
- Se non c'è nulla in localStorage (`localStorage.getItem()` ritorna null), usa l'oggetto vuoto `{}`
- **Risultato**: I dati vengono caricati da localStorage una sola volta, non ad ogni render. Più efficiente!

### Immutability Pattern (Pattern di Immutabilità)
```typescript
// Spread operator per garantire immutabilità
setFolders(prev => ({
  ...prev,
  [anno]: {
    ...prev[anno],
    manutenzioni: {
      ...prev[anno].manutenzioni,
      [id]: {
        ...prev[anno].manutenzioni[id],
        note: [...prev[anno].manutenzioni[id].note, { data, desc }]
      }
    }
  }
}))
```

**Cosa fa questo codice**:
- L'operatore `...` (spread - "spandi") crea una **copia** di un oggetto anziché modificarlo direttamente
- Livello per livello: Copia l'oggetto principale, poi copia l'anno dentro, poi copia le manutenzioni dentro, poi copia il macchinario dentro, e infine aggiunge la nuova nota all'array
- **Perché è importante**: React controlla se l'oggetto è cambiato confrontando il riferimento in memoria. Se modifichi l'oggetto direttamente, React non lo capisce. Ma se crei una COPIA (nuovo riferimento), React vede che è un oggetto diverso e aggiorna la UI
- È come dire "prendi l'intero albero dei dati, fai fotocopie a ogni livello, modifica solo la foglia che serve, e ritorna l'albero nuovo"
- **Risultato**: React capisce che è avvenuto un cambio e aggiorna l'interfaccia

### Controlled Components (Componenti Controllati)
```tsx
<input
  value={searchInput}
  onChange={(e) => setSearchInput(e.target.value)}
/>
```

**Cosa fa questo codice**:
- `value={searchInput}` - L'input mostra il valore dello state. Non è autonomo
- `onChange={(e) => setSearchInput(e.target.value)}` - Ogni volta che l'utente digita, legge il nuovo valore e lo salva nello state
- Il flusso è: Utente digita → onChange trigger → State aggiorna → Componente re-renderizza → Input mostra il nuovo valore
- **Differenza**: Un input "non controllato" avrebbe il suo valore interno. Un input "controllato" ha il suo valore controllato da React
- **Risultato**: React ha il controllo su cosa l'utente vede e digita, permettendo di fare ricerche real-time, validazione, ecc.

### Conditional Rendering (Renderizzazione Condizionata)
```tsx
{data.expanded && <div>Contenuto</div>}
{showNomeModal && <div className="modal">Modal</div>}
```

**Cosa fa questo codice**:
- `data.expanded &&` - Legge: "Se expanded è true, ALLORA mostra il <div>". Se è false, mostra nulla
- `showNomeModal &&` - Se il modal deve essere mostrato, renderizza il modal HTML
- L'operatore `&&` (AND logico) è come un "se" in JavaScript: se la prima parte è vera, esegui la seconda
- **Alternativa più leggibile**:
  ```tsx
  {data.expanded ? <div>Contenuto</div> : null}
  ```
- **Risultato**: Gli elementi HTML appaiono/scompaiono dinamicamente in base al valore dello state, senza bisogno di `display: none` (nascondimento CSS)

### List Rendering con Keys (Renderizzazione Liste con Chiavi)
```tsx
{manutenzioniFiltered.map(([id, data]) => (
  <ManutenzionCard
    key={id}  // ✅ Key stabile e univoca
    id={id}
    data={data}
  />
))}
```

**Cosa fa questo codice**:
- `.map()` - Converte un array di manutenzioni in un array di componenti JSX
- `[id, data]` - Ogni elemento è una coppia chiave-valore: id (identità unica del macchinario) e data (i dati della manutenzione)
- `key={id}` - La key è **FONDAMENTALE**. React la usa per identificare quale elemento è quale
- **Senza key stabile**: Se l'ordine della lista cambia, React potrebbe confondere gli elementi. Ad esempio, se cancelli il primo macchinario, React potrebbe pensare che il secondo è diventato il primo (e perdere il suo state)
- **Con key={id}**: React sa che ogni elemento ha un'identità unica e stabile. Se l'ordine cambia, gli elementi rimangono associati ai loro dati
- **Risultato**: Le liste si comportano correttamente quando si aggiungono, cancellano o riordinano elementi

---

## 📱 Responsive Design

- **Mobile** (< 768px): Layout stack verticale
- **Tablet** (768px - 1024px): Layout ibrido
- **Desktop** (> 1024px): Layout completo

---

## 🔒 Security (Sicurezza)

- ✅ Dati locali (no cloud - nessun cloud)
- ✅ Nessun tracking (nessun monitoraggio esterno)
- ✅ React auto-escapes HTML (no XSS (Cross-Site Scripting - Scripting tra siti) risk)
- ✅ Input validation (anno format, string length - validazione degli input)
- ✅ HTTPS (HyperText Transfer Protocol Secure - Protocollo di Trasferimento Ipertestuale Sicuro) required per QR scanner

---

## 📈 Performance

**Ottimizzazioni attuali**:
- Lazy localStorage loading
- Sorting nel render, non in state
- Efficient filtering

**Miglioramenti futuri**:
- React.memo per componenti pure (puri - che non cambiano con gli stessi input)
- useCallback per callback stability (stabilità delle funzioni callback - evitare che vengono ricreate inutilmente)
- useMemo per expensive computations (calcoli costosi - evitare di ricalcolare valori che non sono cambiati)

---

## 🔮 Evoluzioni Possibili

### Backend Integration (Firebase/Supabase)
```typescript
const db = getFirestore(app)
useEffect(() => {
  setDoc(doc(db, 'folders', userId), folders)
}, [folders])
```

### State Management Scale-up
- Current: useState in App
- Medium: Context API
- Large: Redux Toolkit / Zustand

### Advanced Features
- Autenticazione e ruoli
- Multi-device sync
- PDF report generation
- Manutenzione preventiva
- Photo/video allegati

---

## 📚 Conclusioni

Questo progetto dimostra:
- ✅ React best practices
- ✅ TypeScript strict mode
- ✅ Modern tooling (Vite)
- ✅ Offline-first architecture
- ✅ Real-world features

L'architettura è **pulita, scalabile e pronta per evoluzioni**.

---

**Documento**: Gennaio 2026  
**Audience**: Programmatori e esperti informatici  
**Livello**: Intermedio-Avanzato
