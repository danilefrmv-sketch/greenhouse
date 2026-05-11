import { useState, useEffect, useRef } from 'react'
import ConfirmModal from '../ui/ConfirmModal'
import Drawer from '../ui/Drawer'

const DIARY_TYPES = [
  { id: 'note',      icon: '📝', label: 'Заметка'   },
  { id: 'growth',    icon: '🌱', label: 'Рост'       },
  { id: 'condition', icon: '❤️', label: 'Состояние'  },
  { id: 'harvest',   icon: '🌾', label: 'Урожай'     },
]
const RECIPE_TYPES   = [{ id: 'recipe',   icon: '📋', label: 'Рецепт'    }]
const PICKLING_TYPES = [{ id: 'pickling', icon: '🏅', label: 'Заготовка' }]

const TABS = [
  { id: 'diary',    label: 'Дневник',   types: DIARY_TYPES    },
  { id: 'recipes',  label: 'Рецепты',   types: RECIPE_TYPES   },
  { id: 'pickling', label: 'Заготовки', types: PICKLING_TYPES },
]

const TYPE_STYLES = {
  note:      { border: 'border-l-gray-300',   bg: 'bg-gray-50',   label: 'text-gray-500'   },
  growth:    { border: 'border-l-green-300',  bg: 'bg-green-50',  label: 'text-green-600'  },
  condition: { border: 'border-l-rose-300',   bg: 'bg-rose-50',   label: 'text-rose-500'   },
  harvest:   { border: 'border-l-amber-300',  bg: 'bg-amber-50',  label: 'text-amber-600'  },
  recipe:    { border: 'border-l-blue-300',   bg: 'bg-blue-50',   label: 'text-blue-500'   },
  pickling:  { border: 'border-l-violet-300', bg: 'bg-violet-50', label: 'text-violet-500' },
}

const ALL_TYPES = [...DIARY_TYPES, ...RECIPE_TYPES, ...PICKLING_TYPES]

const CONDITIONS = [
  { id: 'great', emoji: '🌟', label: 'Отлично'   },
  { id: 'good',  emoji: '✅', label: 'Хорошо'    },
  { id: 'ok',    emoji: '😐', label: 'Нормально' },
  { id: 'bad',   emoji: '⚠️', label: 'Плохо'     },
]

const todayStr = () => new Date().toISOString().split('T')[0]

function formatDate(str) {
  if (!str) return ''
  return new Date(str + 'T12:00:00').toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function loadEntries(plantId) {
  try { return JSON.parse(localStorage.getItem(`diary-${plantId}`)) || [] } catch { return [] }
}
function saveEntries(plantId, entries) {
  localStorage.setItem(`diary-${plantId}`, JSON.stringify(entries))
}

// ─── StarRating ────────────────────────────────────────────────────────
function StarRating({ value = 0, onChange, readonly = false, size = 'md' }) {
  const sz = size === 'sm' ? 'text-base' : 'text-xl'
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n} type="button" disabled={readonly}
          onClick={() => onChange?.(n)}
          className={`${sz} leading-none transition-colors
            ${n <= value ? 'text-amber-400' : 'text-gray-200'}
            ${!readonly ? 'hover:text-amber-300 cursor-pointer' : 'cursor-default'}`}
        >★</button>
      ))}
    </div>
  )
}

// ─── PhotoUpload ───────────────────────────────────────────────────────
function PhotoUpload({ value = [], onChange }) {
  const handleFiles = e => {
    const files = Array.from(e.target.files)
    Promise.all(files.map(f => new Promise(res => {
      const reader = new FileReader()
      reader.onload = ev => res(ev.target.result)
      reader.readAsDataURL(f)
    }))).then(newPhotos => onChange([...value, ...newPhotos]))
    e.target.value = ''
  }
  const remove = idx => onChange(value.filter((_, i) => i !== idx))

  return (
    <div>
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5 mb-2">
          {value.map((src, i) => (
            <div key={i} className="relative aspect-square">
              <img src={src} alt="" className="w-full h-full object-cover rounded-xl" />
              <button
                type="button" onClick={() => remove(i)}
                className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full text-xs leading-none hover:bg-black/70 transition-colors flex items-center justify-center"
              >×</button>
            </div>
          ))}
        </div>
      )}
      <label className="inline-flex items-center gap-1.5 cursor-pointer text-sm text-gray-400 hover:text-green-500 transition-colors border border-dashed border-gray-200 hover:border-green-300 rounded-lg px-3 py-1.5">
        + Добавить фото
        <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
      </label>
    </div>
  )
}

// ─── PlantMenu (three-dot dropdown) ────────────────────────────────────
function PlantMenu({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors font-bold tracking-wider text-sm"
      >···</button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 min-w-[130px] py-1 overflow-hidden">
          <button
            type="button"
            onClick={() => { onEdit(); setOpen(false) }}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >Изменить</button>
          <button
            type="button"
            onClick={() => { onDelete(); setOpen(false) }}
            className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
          >Удалить</button>
        </div>
      )}
    </div>
  )
}

// ─── RatingPrompt ──────────────────────────────────────────────────────
function RatingPrompt({ onSave }) {
  const [rating,  setRating]  = useState(0)
  const [comment, setComment] = useState('')

  return (
    <div className="rounded-2xl border border-gray-200 p-4 flex flex-col gap-3">
      <p className="text-sm font-medium text-gray-700">Как вам этот сорт?</p>
      <StarRating value={rating} onChange={setRating} />
      <textarea
        className="input resize-none text-sm"
        rows={2}
        placeholder="Общее впечатление о сорте..."
        value={comment}
        onChange={e => setComment(e.target.value)}
      />
      <button
        type="button"
        onClick={() => onSave(rating, comment.trim())}
        disabled={rating === 0}
        className="btn-primary text-sm py-2"
      >Сохранить оценку</button>
    </div>
  )
}

// ─── AddEntryForm ──────────────────────────────────────────────────────
function AddEntryForm({ onAdd, onCancel, tabTypes }) {
  const [type,           setType]           = useState(tabTypes[0].id)
  const [date,           setDate]           = useState(todayStr)
  const [text,           setText]           = useState('')
  const [photos,         setPhotos]         = useState([])
  const [condition,      setCondition]      = useState(null)
  const [harvestAmount,  setHarvestAmount]  = useState('')
  const [tasteRating,    setTasteRating]    = useState(0)
  const [picklingRating, setPicklingRating] = useState(0)

  const handleSubmit = e => {
    e.preventDefault()
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2)
    onAdd({
      id, type, date,
      text:           text.trim() || null,
      photos,
      condition:      type === 'condition' ? condition : null,
      harvestAmount:  type === 'harvest'   ? harvestAmount.trim() || null : null,
      tasteRating:    type === 'harvest'   ? tasteRating   : 0,
      picklingRating: type === 'pickling'  ? picklingRating : 0,
    })
  }

  const canSubmit = text.trim()
    || photos.length > 0
    || (type === 'condition' && condition)
    || (type === 'harvest' && harvestAmount.trim())
    || (type === 'pickling' && picklingRating > 0)

  const placeholder = {
    note:      'Что заметили сегодня...',
    growth:    'Опишите как растёт, что изменилось...',
    condition: 'Комментарий к состоянию...',
    harvest:   'Заметки об урожае...',
    recipe:    'Ингредиенты, шаги приготовления...',
    pickling:  'Впечатления — вкус, текстура, аромат...',
  }[type]

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-col gap-3">

      {tabTypes.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {tabTypes.map(t => (
            <button key={t.id} type="button" onClick={() => setType(t.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all
                ${type === t.id
                  ? 'bg-green-50 border-green-400 text-gray-900'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-green-300'}`}
            >{t.icon} {t.label}</button>
          ))}
        </div>
      )}

      <input
        type="date" className="input text-sm" value={date}
        onChange={e => setDate(e.target.value)} max={todayStr()}
        enterKeyHint="next"
      />

      <textarea
        className="input resize-none text-sm" rows={3}
        placeholder={placeholder}
        value={text} onChange={e => setText(e.target.value)}
        enterKeyHint="done"
      />

      {type === 'condition' && (
        <div className="grid grid-cols-4 gap-1.5">
          {CONDITIONS.map(c => (
            <button key={c.id} type="button" onClick={() => setCondition(c.id)}
              className={`py-2 text-xs rounded-xl border transition-all flex flex-col items-center gap-0.5
                ${condition === c.id
                  ? 'bg-green-50 border-green-400 text-gray-900 font-medium'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-green-300'}`}
            >
              <span className="text-base leading-none">{c.emoji}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>
      )}

      {type === 'harvest' && (
        <div className="flex gap-3 items-center">
          <input className="input text-sm flex-1" placeholder="Количество (напр. 2 кг)"
            value={harvestAmount} onChange={e => setHarvestAmount(e.target.value)}
            enterKeyHint="done" />
          <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
            <span className="text-[10px] text-gray-400">Вкус</span>
            <StarRating value={tasteRating} onChange={setTasteRating} />
          </div>
        </div>
      )}

      {type === 'pickling' && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Результат:</span>
          <StarRating value={picklingRating} onChange={setPicklingRating} />
        </div>
      )}

      {(type === 'growth' || type === 'note' || type === 'harvest') && (
        <PhotoUpload value={photos} onChange={setPhotos} />
      )}

      <div className="flex gap-2">
        <button type="button" className="btn-secondary flex-1 text-sm py-2" onClick={onCancel}>Отмена</button>
        <button type="submit" className="btn-primary flex-1 text-sm py-2" disabled={!canSubmit}>Сохранить</button>
      </div>
    </form>
  )
}

// ─── EntryCard ─────────────────────────────────────────────────────────
function EntryCard({ entry, onDelete }) {
  const typeMeta  = ALL_TYPES.find(t => t.id === entry.type) || ALL_TYPES[0]
  const styles    = TYPE_STYLES[entry.type] || TYPE_STYLES.note
  const condition = CONDITIONS.find(c => c.id === entry.condition)

  const photos = entry.photos?.length ? entry.photos : (entry.photo ? [entry.photo] : [])

  return (
    <div className={`border-l-4 ${styles.border} ${styles.bg} rounded-r-2xl p-4 flex flex-col gap-2.5 group`}>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold ${styles.label} flex items-center gap-1`}>
          {typeMeta.icon} {typeMeta.label}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{formatDate(entry.date)}</span>
          <button
            type="button" onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all text-xs"
          >×</button>
        </div>
      </div>

      {photos.length > 0 && (
        <div className={`grid gap-1.5 ${photos.length === 1 ? 'grid-cols-1' : 'grid-cols-3'}`}>
          {photos.map((src, i) => (
            <div key={i} className="aspect-square">
              <img src={src} alt="" className="w-full h-full object-cover rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {entry.text && (
        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{entry.text}</p>
      )}

      {condition && <span className="text-sm">{condition.emoji} {condition.label}</span>}

      {entry.type === 'harvest' && (entry.harvestAmount || entry.tasteRating > 0) && (
        <div className="flex items-center gap-4 flex-wrap">
          {entry.harvestAmount && (
            <span className="text-sm font-medium text-amber-700">🌾 {entry.harvestAmount}</span>
          )}
          {entry.tasteRating > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">Вкус:</span>
              <StarRating value={entry.tasteRating} readonly />
            </div>
          )}
        </div>
      )}

      {entry.type === 'pickling' && entry.picklingRating > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Результат:</span>
          <StarRating value={entry.picklingRating} readonly />
        </div>
      )}
    </div>
  )
}

// ─── EditPlantForm ─────────────────────────────────────────────────────
function EditPlantForm({ plant, onSave, onCancel }) {
  const [plantName, setPlantName] = useState(plant.plantName || '')
  const [plantedAt, setPlantedAt] = useState(plant.plantedAt || todayStr())
  const [comment,   setComment]   = useState(plant.comment   || '')
  const dateRef    = useRef(null)
  const commentRef = useRef(null)

  const handleSubmit = e => {
    e.preventDefault()
    if (!plantName.trim()) return
    onSave({ plantName: plantName.trim(), plantedAt, comment: comment.trim() || null })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full">
      <div className="flex gap-2">
        <input
          className="input text-sm flex-1"
          placeholder="Сорт / Название"
          value={plantName}
          onChange={e => setPlantName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), dateRef.current?.focus())}
          enterKeyHint="next"
        />
        <input
          ref={dateRef}
          type="date" className="input text-sm w-36"
          value={plantedAt}
          onChange={e => { setPlantedAt(e.target.value); commentRef.current?.focus() }}
          max={todayStr()}
          enterKeyHint="next"
        />
      </div>
      <textarea
        ref={commentRef}
        className="input resize-none text-sm" rows={2}
        placeholder="Комментарий (необязательно)"
        value={comment}
        onChange={e => setComment(e.target.value)}
        enterKeyHint="done"
      />
      <div className="flex gap-2">
        <button type="button" className="btn-secondary flex-1 text-sm py-2" onClick={onCancel}>Отмена</button>
        <button type="submit" className="btn-primary flex-1 text-sm py-2" disabled={!plantName.trim()}>Сохранить</button>
      </div>
    </form>
  )
}

// ─── PlantDiaryModal ───────────────────────────────────────────────────
export default function PlantDiaryModal({ open, onClose, plant, onRemove, onUpdate }) {
  const [entries,        setEntries]        = useState([])
  const [adding,         setAdding]         = useState(false)
  const [activeTab,      setActiveTab]      = useState('diary')
  const [editing,        setEditing]        = useState(false)
  const [harvestConfirm, setHarvestConfirm] = useState(false)
  const [deleteEntry,    setDeleteEntry]    = useState(null)

  useEffect(() => {
    if (open && plant?.id) {
      setEntries(loadEntries(plant.id))
      setAdding(false)
      setEditing(false)
      setActiveTab('diary')
    }
  }, [open, plant?.id])

  if (!plant) return null

  const tab = TABS.find(t => t.id === activeTab) || TABS[0]

  const handleAdd = entry => {
    const updated = [...entries, entry].sort((a, b) => a.date.localeCompare(b.date))
    setEntries(updated)
    saveEntries(plant.id, updated)
    setAdding(false)
  }

  const handleDeleteEntry = entry => {
    const updated = entries.filter(e => e.id !== entry.id)
    setEntries(updated)
    saveEntries(plant.id, updated)
    setDeleteEntry(null)
  }

  const handleHarvest = () => { onRemove(plant); onClose() }

  const handleUpdate = updates => {
    onUpdate?.({ ...plant, ...updates })
    setEditing(false)
  }

  const handleRatingSave = (rating, ratingComment) => {
    onUpdate?.({ ...plant, rating, ratingComment })
  }

  const displayName = plant.plantName && plant.plantName !== plant.plantType
    ? plant.plantName : null

  const tabEntries = [...entries]
    .filter(e => tab.types.some(t => t.id === e.type))
    .reverse()

  const showRatingPrompt = !plant.rating || plant.rating === 0

  // ── Кастомный header: эмодзи + инфо о растении + меню ───────────────
  const customHeader = (
    <div className="flex items-start gap-4 px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
      <span className="text-4xl leading-none mt-0.5 shrink-0">{plant.emoji ?? '🌱'}</span>

      {editing ? (
        <EditPlantForm plant={plant} onSave={handleUpdate} onCancel={() => setEditing(false)} />
      ) : (
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              {displayName ?? plant.plantType}
            </h2>
            {plant.rating > 0 && (
              <StarRating value={plant.rating} readonly size="sm" />
            )}
          </div>
          {displayName && <p className="text-sm text-gray-400">{plant.plantType}</p>}
          {plant.ratingComment && (
            <p className="text-xs text-gray-400 mt-0.5 italic">«{plant.ratingComment}»</p>
          )}
          {plant.plantedAt && (
            <span className="text-xs text-gray-400 mt-1 block">Посажено {formatDate(plant.plantedAt)}</span>
          )}
          {plant.comment && (
            <p className="text-xs text-gray-400 mt-1 italic">«{plant.comment}»</p>
          )}
        </div>
      )}

      <div className="flex items-center gap-1 shrink-0">
        {!editing && (
          <PlantMenu
            onEdit={() => setEditing(true)}
            onDelete={() => setHarvestConfirm(true)}
          />
        )}
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >✕</button>
      </div>
    </div>
  )

  // ── Subheader: вкладки ───────────────────────────────────────────────
  const subheader = (
    <div className="flex border-b border-gray-100 shrink-0 px-6">
      {TABS.map(t => (
        <button key={t.id} type="button"
          onClick={() => { setActiveTab(t.id); setAdding(false) }}
          className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors -mb-px ${
            activeTab === t.id
              ? 'border-green-500 text-green-600'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >{t.label}</button>
      ))}
    </div>
  )

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        customHeader={customHeader}
        subheader={subheader}
        width={490}
      >
        <div className="px-6 py-5 flex flex-col gap-3">

          {activeTab === 'diary' && showRatingPrompt && !adding && (
            <RatingPrompt onSave={handleRatingSave} />
          )}

          {adding
            ? <AddEntryForm onAdd={handleAdd} onCancel={() => setAdding(false)} tabTypes={tab.types} />
            : (
              <button
                type="button" onClick={() => setAdding(true)}
                className="w-full py-2.5 rounded-xl border border-dashed border-green-300 text-green-500 text-sm font-medium hover:bg-green-50 transition-colors"
              >+ Добавить запись</button>
            )
          }

          {tabEntries.length === 0 && !adding && (
            <div className="text-center py-10 text-gray-400 select-none">
              <p className="text-4xl mb-3">{tab.id === 'diary' ? '📖' : tab.id === 'recipes' ? '📋' : '🏅'}</p>
              <p className="text-sm font-medium">
                {tab.id === 'diary' ? 'Дневник пока пустой' : tab.id === 'recipes' ? 'Рецептов пока нет' : 'Заготовок пока нет'}
              </p>
              <p className="text-xs mt-1 opacity-70">
                {tab.id === 'diary' ? 'Записывайте рост, урожай и наблюдения' : tab.id === 'recipes' ? 'Сохраняйте любимые рецепты' : 'Фиксируйте результаты засолки'}
              </p>
            </div>
          )}

          {tabEntries.map(entry => (
            <EntryCard key={entry.id} entry={entry} onDelete={() => setDeleteEntry(entry)} />
          ))}
        </div>
      </Drawer>

      <ConfirmModal
        open={harvestConfirm}
        onClose={() => setHarvestConfirm(false)}
        onConfirm={handleHarvest}
        title="Убрать растение?"
        message="Растение будет перемещено в архив. Дневник и все записи сохранятся."
        confirmLabel="Убрать"
      />

      <ConfirmModal
        open={!!deleteEntry}
        onClose={() => setDeleteEntry(null)}
        onConfirm={() => handleDeleteEntry(deleteEntry)}
        title="Удалить запись?"
        message="Запись будет удалена без возможности восстановления."
        confirmLabel="Удалить"
      />
    </>
  )
}
