/**
 * App Components Structure
 * 
 * Questo file documenta la struttura gerarchica dei componenti dell'app.
 * 
 * COMPONENTS TREE:
 * ├── Header.tsx
 * │   └── Intestazione (breadcrumb opzionale) con titolo principale
 * │
 * ├── Footer.tsx
 * │   └── Link GitHub e info generali
 * │
 * ├── FolderCard.tsx
 * │   └── Card per singola cartella/anno (homepage)
 * │
 * ├── HomePage.tsx
 * │   ├── Header
 * │   ├── Button "Nuova Cartella"
 * │   ├── List di FolderCard
 * │   └── Modal per aggiungere nuova cartella
 * │
 * ├── FolderPage.tsx
 * │   ├── Header con anno
 * │   ├── Buttons (Home, Create, Scan)
 * │   ├── Scanner QR
 * │   ├── Search Box
 * │   ├── List di ManutenzionCard
 * │   └── Modal per aggiungere nuova manutenzione
 * │
 * └── ManutenzionCard.tsx
 *     ├── Accordion (expanded/collapsed)
 *     ├── Form inserimento note
 *     ├── Lista note
 *     ├── Buttons modifica/elimina/copia
 *     └── Functionality di selezione note per copia
 * 
 * STATE MANAGEMENT:
 * - Tutti gli stati principali rimangono in App.tsx
 * - I componenti ricevono props per state e callback per state updates
 * - La logica di business (folders, manutenzioni, note) rimane centralizzata
 * 
 * LOGICA MANTENUTA:
 * - Scansione QR con Html5Qrcode
 * - LocalStorage per persistenza dati
 * - Validazioni input
 * - Ordinamento date/nomi
 * - Copia negli appunti
 */

export {}
