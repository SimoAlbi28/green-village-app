type FolderCardProps = {
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
  return (
    <div className="folder" onClick={onOpen}>
      <h2>{nome}</h2>
      <div className="year">{anno}</div>
      <img src={imageSrc} alt="Icona cartella" className="folder-icon" />

      <div
        className="btns"
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <button
          title="Rinomina"
          className="btn-rename"
          onClick={onRename}
        >
          ✏️
        </button>
        <button
          title="Elimina"
          className="btn-delete"
          onClick={onDelete}
        >
          🗑️
        </button>
        <button
          title="Copia tutto"
          className="btn-copy"
          onClick={onCopy}
        >
          📋
        </button>
      </div>
    </div>
  )
}
