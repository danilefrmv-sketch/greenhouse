import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Drawer from '../ui/Drawer'

const TYPES = [
  { value: 'greenhouse', label: '🏠 Теплица' },
  { value: 'outdoor',    label: '🌿 Уличная грядка' },
]

function DeleteConfirm({ onConfirm, onClose }) {
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0">⚠️</span>
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Удалить теплицу?</h3>
            <p className="text-sm text-gray-500">
              Все данные о посадках и дневники растений будут безвозвратно удалены.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Отмена</button>
          <button onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors">
            Удалить
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function DotsMenu({ onDeleteClick }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="3"  cy="8" r="1.2" fill="currentColor"/>
          <circle cx="8"  cy="8" r="1.2" fill="currentColor"/>
          <circle cx="13" cy="8" r="1.2" fill="currentColor"/>
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-10 py-1 min-w-[160px]">
          <button type="button"
            onClick={() => { setOpen(false); onDeleteClick() }}
            className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
            Удалить теплицу
          </button>
        </div>
      )}
    </div>
  )
}

export default function GreenhouseSettingsModal({ open, onClose, greenhouse, onSave, onDelete }) {
  const [name,          setName]          = useState('')
  const [description,   setDescription]   = useState('')
  const [type,          setType]          = useState('polycarbonate')
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (open && greenhouse) {
      setName(greenhouse.name || '')
      setDescription(greenhouse.description || '')
      setType(greenhouse.type || 'polycarbonate')
    }
  }, [open, greenhouse])

  const handleSubmit = e => {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ name: name.trim(), description: description.trim(), type })
    onClose()
  }

  const handleConfirmDelete = () => {
    setConfirmDelete(false)
    onClose()
    onDelete()
  }

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title="Настройки теплицы"
        headerRight={<DotsMenu onDeleteClick={() => setConfirmDelete(true)} />}
        footer={
          <div className="flex gap-3">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Отмена</button>
            <button
              form="settings-form"
              type="submit"
              className="btn-primary flex-1"
              disabled={!name.trim()}
            >
              Сохранить
            </button>
          </div>
        }
      >
        <form id="settings-form" onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5">
          <div>
            <label className="label">Название<span className="text-red-400 ml-0.5">*</span></label>
            <input
              className="input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Название теплицы"
              autoFocus
            />
          </div>

          <div>
            <label className="label">Описание <span className="text-gray-400 font-normal">(необязательно)</span></label>
            <textarea
              className="input resize-none"
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Что выращиваете, особенности..."
            />
          </div>

          <div>
            <label className="label">Тип теплицы</label>
            <div className="flex gap-2 flex-wrap">
              {TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium border transition-all duration-150 ${
                    type === t.value
                      ? 'bg-green-50 text-gray-900 border-green-400'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-green-300'
                  }`}
                >{t.label}</button>
              ))}
            </div>
          </div>
        </form>
      </Drawer>

      {confirmDelete && (
        <DeleteConfirm onConfirm={handleConfirmDelete} onClose={() => setConfirmDelete(false)} />
      )}
    </>
  )
}
