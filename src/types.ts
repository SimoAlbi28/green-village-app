export type Note = {
  data: string
  desc: string
}

export type Manutenzione = {
  nome: string
  note: Note[]
  expanded: boolean
  qrId?: string
}

export type Cartella = {
  nome: string
  anno: string
  manutenzioni: Record<string, Manutenzione>
}

export type Folders = Record<string, Cartella>

export type UserProfile = {
  id: string
  nome: string
  cognome: string
  palazzina: string
  telefono?: string
  email?: string
  avatar_color?: string
}
