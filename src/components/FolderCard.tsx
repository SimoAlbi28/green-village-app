interface FolderCardProps {
  nome: string
  anno: string
  imageSrc?: string
  onOpen: () => void
  onRename: () => void
  onDelete: () => void
  onCopy: () => void
}

export default function FolderCard({
  nome,
  anno,
  imageSrc = '/folder-icon.jpg',
  onOpen,
  onRename,
  onDelete,
  onCopy,
}: FolderCardProps) {
  const displayName = nome.length > 15 ? `${nome.slice(0, 15)}…` : nome

  return (
    <div className="folder" onClick={onOpen}>
      <h2 title={nome}>{displayName}</h2>
      <div className="year">{anno}</div>
      <img src={imageSrc} alt="Icona cartella" className="folder-icon" />

      <div
        className="btns"
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <button
          type="button"
          title="Rinomina"
          className="btn-rename"
          onClick={(e) => {
            e.stopPropagation()
            onRename()
          }}
        >
          ✏️
        </button>
        <button
          type="button"
          title="Elimina"
          className="btn-delete"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          🗑️
        </button>
        <button
          type="button"
          title="Copia tutto"
          className="btn-copy"
          onClick={(e) => {
            e.stopPropagation()
            onCopy()
          }}
        >
          📋
        </button>
      </div>
    </div>
  )
}
