import { useState } from 'react'
import type { Note } from '../types'

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

const formatData = (d: string): string => {
  const [yyyy, mm, dd] = d.split('-')
  return `${dd}/${mm}/${yyyy.slice(2)}`
}

export default function ManutenzionCard({
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

