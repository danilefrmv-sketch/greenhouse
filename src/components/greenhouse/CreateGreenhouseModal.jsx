import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Picker from '@emoji-mart/react'
import data from '@emoji-mart/data'
import Drawer from '../ui/Drawer'

const TYPES = [
  { value: 'greenhouse', label: '🏠 Теплица' },
  { value: 'outdoor',    label: '🌿 Уличная грядка' },
]

const DEFAULT = { name: '', description: '', type: 'greenhouse', numBeds: 2 }

const BED_OPTIONS = [
  { n: 1, label: 'грядка' },
  { n: 2, label: 'грядка · проход · грядка' },
  { n: 3, label: 'грядка · проход · грядка · проход · грядка' },
]

function EmojiPickerPortal({ onSelect, onClose }) {
  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()} className="max-w-[min(100vw-2rem,360px)]">
        <Picker
          data={data}
          onEmojiSelect={onSelect}
          locale="ru"
          theme="light"
          previewPosition="none"
          skinTonePosition="none"
          set="native"
        />
      </div>
    </div>,
    document.body
  )
}

export default function CreateGreenhouseModal({ open, onClose, onCreate }) {
  const [form, setForm] = useState(DEFAULT)
  const [showPicker, setShowPicker] = useState(false)
  const inputRef = useRef(null)
  const descRef  = useRef(null)

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const handleEmoji = emoji => {
    const input = inputRef.current
    if (!input) return
    const start = input.selectionStart ?? form.name.length
    const end   = input.selectionEnd   ?? form.name.length
    const newName = form.name.slice(0, start) + emoji.native + form.name.slice(end)
    set('name', newName)
    setShowPicker(false)
    setTimeout(() => {
      input.focus()
      const pos = start + emoji.native.length
      input.setSelectionRange(pos, pos)
    }, 0)
  }

  useEffect(() => {
    if (!open) { setForm(DEFAULT); setShowPicker(false) }
  }, [open])

  const handleSubmit = e => {
    e.preventDefault()
    if (!form.name.trim()) return
    onCreate({ ...form, id: Date.now().toString(), plants: [] })
    onClose()
  }

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title="Новая теплица"
        footer={
          <div className="flex gap-3">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>
              Отмена
            </button>
            <button
              form="create-gh-form"
              type="submit"
              className="btn-primary flex-1"
              disabled={!form.name.trim()}
            >
              Создать
            </button>
          </div>
        }
      >
        <form id="create-gh-form" onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5">

          {/* Название */}
          <div>
            <label className="label">Название</label>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                className="input flex-1"
                placeholder="Например: Помидорная"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), descRef.current?.focus())}
                enterKeyHint="next"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPicker(v => !v)}
                className={`shrink-0 w-11 h-11 flex items-center justify-center rounded-xl border transition-all text-lg
                  ${showPicker
                    ? 'bg-green-50 border-green-300'
                    : 'bg-soil-100 border-soil-200 hover:border-green-300'}`}
              >
                😊
              </button>
            </div>
          </div>

          {/* Описание */}
          <div>
            <label className="label">Описание <span className="text-gray-400 font-normal">(необязательно)</span></label>
            <textarea
              ref={descRef}
              className="input resize-none"
              rows={2}
              placeholder="Что выращиваете, особенности..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
              enterKeyHint="done"
            />
          </div>

          {/* Тип */}
          <div>
            <label className="label">Тип теплицы</label>
            <div className="flex gap-2">
              {TYPES.map(t => (
                <button key={t.value} type="button" onClick={() => set('type', t.value)}
                  className={`flex-1 py-2 px-2 rounded-xl text-sm font-medium border transition-all ${
                    form.type === t.value
                      ? 'bg-green-50 text-gray-900 border-green-400'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-green-300'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Грядки */}
          <div>
            <label className="label">Количество грядок</label>
            <div className="flex gap-2">
              {BED_OPTIONS.map(({ n, label }) => (
                <button key={n} type="button" onClick={() => set('numBeds', n)}
                  className={`flex-1 py-3 px-2 rounded-xl border transition-all ${
                    form.numBeds === n
                      ? 'bg-green-50 text-gray-900 border-green-400'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-green-300'
                  }`}>
                  <div className="text-lg font-semibold">{n}</div>
                  <div className="text-xs mt-0.5 opacity-60 leading-tight">{label}</div>
                </button>
              ))}
            </div>
          </div>

        </form>
      </Drawer>

      {showPicker && <EmojiPickerPortal onSelect={handleEmoji} onClose={() => setShowPicker(false)} />}
    </>
  )
}
