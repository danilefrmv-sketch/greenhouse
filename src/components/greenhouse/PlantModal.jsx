import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import Drawer from '../ui/Drawer'

const DEFAULT_TYPES = [
  'Томат', 'Огурец', 'Перец', 'Морковь', 'Лук', 'Чеснок',
  'Баклажан', 'Кабачок', 'Тыква', 'Свекла', 'Картофель', 'Клубника',
  'Салат', 'Укроп', 'Петрушка', 'Базилик', 'Редис', 'Горох', 'Фасоль',
]

const DEFAULT_EMOJI = {
  'Томат': '🍅', 'Огурец': '🥒', 'Перец': '🌶️', 'Морковь': '🥕',
  'Лук': '🧅', 'Чеснок': '🧄', 'Баклажан': '🍆', 'Кабачок': '🥬',
  'Тыква': '🎃', 'Свекла': '🫐', 'Картофель': '🥔', 'Клубника': '🍓',
  'Салат': '🥗', 'Укроп': '🌿', 'Петрушка': '🌿', 'Базилик': '🌿',
  'Редис': '🫒', 'Горох': '🟢', 'Фасоль': '🫘',
}

const todayStr = () => new Date().toISOString().split('T')[0]

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback } catch { return fallback }
}

function getAllActivePlants() {
  const plants = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('gh-plants-')) {
      try {
        const arr = JSON.parse(localStorage.getItem(key)) || []
        plants.push(...arr.filter(p => !p.harvested))
      } catch {}
    }
  }
  return plants
}

// ─── TrashButton ──────────────────────────────────────────────────────
function TrashButton({ onClick }) {
  return (
    <button
      type="button"
      onMouseDown={e => e.preventDefault()}
      onClick={onClick}
      className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0
        w-7 h-7 flex items-center justify-center rounded-lg text-gray-300
        hover:text-red-400 hover:bg-red-50"
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path d="M3 5h10M6 5V3h4v2M6.5 8v4M9.5 8v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <rect x="2.5" y="5" width="11" height="9" rx="2" stroke="currentColor" strokeWidth="1.4"/>
      </svg>
    </button>
  )
}

// ─── Combobox ─────────────────────────────────────────────────────────
function Combobox({ label, value, onChange, options, placeholder, disabled, required, onDeleteOption, inputRef, onNext, enterKeyHint = 'next' }) {
  const [open, setOpen]   = useState(false)
  const [input, setInput] = useState(value || '')
  const ref               = useRef(null)

  useEffect(() => { setInput(value || '') }, [value])

  useEffect(() => {
    if (!open) return
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const filtered   = options.filter(o => o.toLowerCase().includes(input.toLowerCase()))
  const hasExact   = options.some(o => o.toLowerCase() === input.trim().toLowerCase())
  const showCreate = input.trim() && !hasExact

  const select = val => { setInput(val); onChange(val); setOpen(false); onNext?.() }

  const handleKey = e => {
    if ((e.key === 'Enter' || e.key === 'Tab') && input.trim()) {
      e.preventDefault()
      select(input.trim())
    }
  }

  return (
    <div ref={ref} className="relative">
      <label className="label">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        ref={inputRef}
        className={`input ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        placeholder={placeholder}
        value={input}
        onChange={e => { setInput(e.target.value); onChange(e.target.value); setOpen(true) }}
        onFocus={() => !disabled && setOpen(true)}
        onKeyDown={handleKey}
        enterKeyHint={enterKeyHint}
        disabled={disabled}
        autoComplete="off"
      />
      {open && !disabled && (filtered.length > 0 || showCreate) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-44 overflow-y-auto">
          {filtered.map(opt => (
            <div key={opt} className="group flex items-center pr-1">
              <button type="button"
                className={`flex-1 text-left px-4 py-2.5 text-sm transition-colors min-w-0 truncate
                  ${opt === value ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                onMouseDown={e => e.preventDefault()}
                onClick={() => select(opt)}
              >{opt}</button>
              {onDeleteOption && (
                <TrashButton onClick={e => {
                  e.stopPropagation()
                  setOpen(false)
                  onDeleteOption(opt)
                }} />
              )}
            </div>
          ))}
          {showCreate && (
            <button type="button"
              className="w-full text-left px-4 py-2.5 text-sm text-green-600 font-medium hover:bg-green-50 border-t border-gray-100"
              onMouseDown={e => e.preventDefault()}
              onClick={() => select(input.trim())}
            >+ Создать «{input.trim()}»</button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── TypeCombobox ─────────────────────────────────────────────────────
function TypeCombobox({ value, onChange, options, onDeleteOption, inputRef, onNext }) {
  const [open, setOpen]   = useState(false)
  const [input, setInput] = useState(value || '')
  const ref               = useRef(null)

  useEffect(() => { setInput(value || '') }, [value])

  useEffect(() => {
    if (!open) return
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const filtered   = options.filter(o => o.toLowerCase().includes(input.toLowerCase()))
  const hasExact   = options.some(o => o.toLowerCase() === input.trim().toLowerCase())
  const showCreate = input.trim() && !hasExact

  const select = val => { setInput(val); onChange(val); setOpen(false); onNext?.() }

  const handleKey = e => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      if (input.trim()) { e.preventDefault(); select(input.trim()) }
    }
  }

  return (
    <div ref={ref} className="relative">
      <input
        ref={inputRef}
        className="input"
        placeholder="Например: Томат"
        value={input}
        onChange={e => { setInput(e.target.value); onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKey}
        enterKeyHint="next"
        autoComplete="off"
      />
      {open && (filtered.length > 0 || showCreate) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-44 overflow-y-auto">
          {filtered.map(opt => (
            <div key={opt} className="group flex items-center pr-1">
              <button type="button"
                className={`flex-1 text-left px-4 py-2.5 text-sm transition-colors min-w-0 truncate
                  ${opt === value ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                onMouseDown={e => e.preventDefault()}
                onClick={() => select(opt)}
              >{opt}</button>
              {onDeleteOption && (
                <TrashButton onClick={e => {
                  e.stopPropagation()
                  setOpen(false)
                  onDeleteOption(opt)
                }} />
              )}
            </div>
          ))}
          {showCreate && (
            <button type="button"
              className="w-full text-left px-4 py-2.5 text-sm text-green-600 font-medium hover:bg-green-50 border-t border-gray-100"
              onMouseDown={e => e.preventDefault()}
              onClick={() => select(input.trim())}
            >+ Создать «{input.trim()}»</button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── EmojiPickerPortal ───────────────────────────────────────────────
// Центрирован на десктопе, всплывает снизу на мобильном
function EmojiPickerPortal({ onSelect, onClose }) {
  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()} className="max-w-[min(100vw-2rem,360px)]">
        <Picker
          data={data}
          onEmojiSelect={emoji => { onSelect(emoji.native); onClose() }}
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

// ─── DeleteModal ──────────────────────────────────────────────────────
function DeleteModal({ modal, onConfirm, onClose }) {
  if (!modal) return null
  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4"
        onClick={e => e.stopPropagation()}>

        {modal.mode === 'blocked' ? (
          <>
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">⚠️</span>
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">Невозможно удалить</h3>
                <p className="text-sm text-gray-500">{modal.message}</p>
              </div>
            </div>
            <button onClick={onClose} className="btn-primary w-full">Понятно</button>
          </>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">🗑️</span>
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">Удалить «{modal.value}»?</h3>
                <p className="text-sm text-gray-500">{modal.message}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="btn-secondary flex-1">Отмена</button>
              <button onClick={onConfirm}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors">
                Удалить
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}

// ─── PlantModal ───────────────────────────────────────────────────────
export default function PlantModal({ open, onClose, onPlant, cell }) {
  const [types,      setTypes]      = useState(() => load('plant-types', DEFAULT_TYPES))
  const [varieties,  setVarieties]  = useState(() => load('plant-varieties', {}))
  const [typeEmojis, setTypeEmojis] = useState(() => load('plant-type-emojis', {}))

  const [plantType,    setPlantType]    = useState('')
  const [plantName,    setPlantName]    = useState('')
  const [plantedAt,    setPlantedAt]    = useState(todayStr())
  const [comment,      setComment]      = useState('')
  const [emojiOpen,    setEmojiOpen]    = useState(false)
  const [pendingEmoji, setPendingEmoji] = useState(null)
  const [deleteModal,  setDeleteModal]  = useState(null)

  // Refs для цепочки фокуса
  const typeInputRef    = useRef(null)
  const varietyInputRef = useRef(null)
  const dateInputRef    = useRef(null)
  const commentRef      = useRef(null)

  // Reset on close
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setPlantType(''); setPlantName(''); setPlantedAt(todayStr())
        setComment(''); setEmojiOpen(false); setPendingEmoji(null)
      }, 380)
      return () => clearTimeout(t)
    }
  }, [open])

  const currentType  = plantType.trim()
  const currentEmoji = currentType
    ? (typeEmojis[currentType] || DEFAULT_EMOJI[currentType] || '🌱')
    : (pendingEmoji || '🌱')

  const plantTypeRef   = useRef(plantType)
  const typeEmojisRef  = useRef(typeEmojis)
  const setPendingRef  = useRef(setPendingEmoji)
  plantTypeRef.current  = plantType
  typeEmojisRef.current = typeEmojis

  const stableEmojiSelect = useRef(emoji => {
    const type = plantTypeRef.current.trim()
    if (type) {
      const next = { ...typeEmojisRef.current, [type]: emoji }
      setTypeEmojis(next)
      localStorage.setItem('plant-type-emojis', JSON.stringify(next))
    } else {
      setPendingRef.current(emoji)
    }
  }).current

  const pendingEmojiRef = useRef(pendingEmoji)
  pendingEmojiRef.current = pendingEmoji

  const handleTypeChange = val => {
    setPlantType(val)
    setPlantName('')
    const type = val.trim()
    if (type && pendingEmojiRef.current) {
      const next = { ...typeEmojisRef.current, [type]: pendingEmojiRef.current }
      setTypeEmojis(next)
      localStorage.setItem('plant-type-emojis', JSON.stringify(next))
      setPendingEmoji(null)
    }
  }

  // ── Удаление типа ─────────────────────────────────────────────────
  const handleDeleteType = type => {
    const active = getAllActivePlants()
    const inUse  = active.some(p => p.plantType?.toLowerCase() === type.toLowerCase())
    if (inUse) {
      setDeleteModal({
        mode: 'blocked',
        message: `Тип «${type}» используется в активных посадках. Сначала уберите или переместите все растения этого типа.`,
      })
    } else {
      setDeleteModal({
        mode: 'confirm',
        key: 'type',
        value: type,
        message: 'Это также удалит все сохранённые сорта этого типа. Действие необратимо.',
      })
    }
  }

  const handleDeleteVariety = name => {
    const active = getAllActivePlants()
    const inUse  = active.some(
      p => p.plantType?.toLowerCase() === currentType.toLowerCase() &&
           p.plantName?.toLowerCase() === name.toLowerCase()
    )
    if (inUse) {
      setDeleteModal({
        mode: 'blocked',
        message: `Сорт «${name}» используется в активных посадках. Сначала уберите эти растения.`,
      })
    } else {
      setDeleteModal({
        mode: 'confirm',
        key: 'variety',
        value: name,
        typeName: currentType,
        message: `Сорт будет удалён из списка для типа «${currentType}».`,
      })
    }
  }

  const handleConfirmDelete = () => {
    const { key, value, typeName } = deleteModal
    if (key === 'type') {
      const nextTypes = types.filter(t => t.toLowerCase() !== value.toLowerCase())
      setTypes(nextTypes)
      localStorage.setItem('plant-types', JSON.stringify(nextTypes))

      const nextVarieties = { ...varieties }
      delete nextVarieties[value]
      setVarieties(nextVarieties)
      localStorage.setItem('plant-varieties', JSON.stringify(nextVarieties))

      const nextEmojis = { ...typeEmojis }
      delete nextEmojis[value]
      setTypeEmojis(nextEmojis)
      localStorage.setItem('plant-type-emojis', JSON.stringify(nextEmojis))

      if (plantType === value) { setPlantType(''); setPlantName('') }
    } else if (key === 'variety') {
      const existing = varieties[typeName] || []
      const nextList = existing.filter(v => v.toLowerCase() !== value.toLowerCase())
      const nextVarieties = { ...varieties, [typeName]: nextList }
      setVarieties(nextVarieties)
      localStorage.setItem('plant-varieties', JSON.stringify(nextVarieties))
      if (plantName === value) setPlantName('')
    }
    setDeleteModal(null)
  }

  const handleSubmit = e => {
    e.preventDefault()
    const type = plantType.trim()
    const name = plantName.trim()
    if (!type || !name || !plantedAt) return

    let nextTypes = types
    if (!types.map(t => t.toLowerCase()).includes(type.toLowerCase())) {
      nextTypes = [...types, type]
      setTypes(nextTypes)
      localStorage.setItem('plant-types', JSON.stringify(nextTypes))
    }

    let nextVarieties = varieties
    const existing = varieties[type] || []
    if (!existing.map(v => v.toLowerCase()).includes(name.toLowerCase())) {
      nextVarieties = { ...varieties, [type]: [...existing, name] }
      setVarieties(nextVarieties)
      localStorage.setItem('plant-varieties', JSON.stringify(nextVarieties))
    }

    const emoji = typeEmojis[type] || DEFAULT_EMOJI[type] || pendingEmojiRef.current || '🌱'
    onPlant({ ...cell, plantType: type, plantName: name, emoji, plantedAt, comment: comment.trim() || null })
    onClose()
  }

  const canSubmit = plantType.trim() && plantName.trim() && plantedAt

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title="Посадить растение"
        footer={
          <div className="flex gap-3">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Отмена</button>
            <button form="plant-form" type="submit" className="btn-primary flex-1" disabled={!canSubmit}>
              Посадить
            </button>
          </div>
        }
      >
        <form id="plant-form" onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5">

          {/* Тип растения + эмодзи */}
          <div>
            <label className="label">
              Тип растения<span className="text-red-400 ml-0.5">*</span>
            </label>
            <div className="flex gap-2 items-end">
              <button
                type="button"
                onClick={() => setEmojiOpen(true)}
                title="Изменить эмодзи"
                className={`w-11 h-11 shrink-0 flex items-center justify-center text-2xl rounded-xl border bg-white transition-colors
                  ${currentType || pendingEmoji
                    ? 'border-gray-200 hover:border-green-300'
                    : 'border-dashed border-gray-200'}`}
              >
                {currentEmoji}
              </button>
              <div className="flex-1">
                <TypeCombobox
                  value={plantType}
                  onChange={handleTypeChange}
                  options={types}
                  onDeleteOption={handleDeleteType}
                  inputRef={typeInputRef}
                  onNext={() => varietyInputRef.current?.focus()}
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1.5 ml-0.5">
              {pendingEmoji && !currentType
                ? 'Эмодзи применится после выбора типа'
                : 'Нажмите на эмодзи чтобы изменить'}
            </p>
          </div>

          <Combobox
            label="Сорт / Название" required
            value={plantName} onChange={setPlantName}
            options={varieties[currentType] || []}
            placeholder={currentType ? 'Например: Черри' : 'Сначала выберите тип'}
            disabled={!currentType}
            onDeleteOption={currentType ? handleDeleteVariety : undefined}
            inputRef={varietyInputRef}
            onNext={() => dateInputRef.current?.focus()}
          />

          <div>
            <label className="label">Дата посадки<span className="text-red-400 ml-0.5">*</span></label>
            <input
              ref={dateInputRef}
              type="date"
              className="input"
              value={plantedAt}
              onChange={e => { setPlantedAt(e.target.value); commentRef.current?.focus() }}
              max={todayStr()}
              enterKeyHint="next"
            />
          </div>

          <div>
            <label className="label">
              Комментарий <span className="text-gray-400 font-normal">(необязательно)</span>
            </label>
            <textarea
              ref={commentRef}
              className="input resize-none"
              rows={3}
              placeholder="Особенности, ожидания..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              enterKeyHint="done"
            />
          </div>

        </form>
      </Drawer>

      {emojiOpen && (
        <EmojiPickerPortal
          onSelect={stableEmojiSelect}
          onClose={() => setEmojiOpen(false)}
        />
      )}

      <DeleteModal
        modal={deleteModal}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteModal(null)}
      />
    </>
  )
}
