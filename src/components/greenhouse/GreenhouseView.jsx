import { useState, useRef, useCallback, useEffect } from 'react'
import PlantCell from './PlantCell'
import { useIsMobile } from '../../hooks/useIsMobile'

const CELL     = 68    // px ячейки
const GAP      = 8     // px gap между ячейками
const BED_PAD  = 12    // px padding внутри грядки
const PATH_W   = 48    // px дорожка между грядками
const SIDE_PAD = 32    // px отступ грядок от стенок теплицы
const ARCH_H   = 48    // px высота арочного торца
const HANDLE   = 5     // px толщина ручки
const HANDLE_L = 36    // px длина ручки

const MIN_ROWS = 1
const MAX_ROWS = 14
const MIN_COLS = 1
const MAX_COLS = 4

function bedPx(count) { return count * CELL + (count - 1) * GAP }

// ─── ResizeHandle ──────────────────────────────────────────────────────
function ResizeHandle({ position, onDragStart }) {
  const isH = position === 'top' || position === 'bottom'
  const pos = {
    top:    'cursor-ns-resize left-1/2 -translate-x-1/2 -top-[3px]',
    bottom: 'cursor-ns-resize left-1/2 -translate-x-1/2 -bottom-[3px]',
    right:  'cursor-ew-resize top-1/2  -translate-y-1/2 -right-[3px]',
  }[position]

  return (
    <div
      onMouseDown={onDragStart}
      className={`absolute z-10 rounded-full bg-gray-300 hover:bg-green-400 transition-colors duration-150 ${pos}`}
      style={isH
        ? { width: HANDLE_L, height: HANDLE }
        : { width: HANDLE,   height: HANDLE_L }
      }
    />
  )
}

// ─── useDragResize ─────────────────────────────────────────────────────
function useDragResize(current, min, max, step, direction, onChange, onBlocked) {
  const startRef = useRef(0)
  const startVal = useRef(current)

  const onMouseDown = e => {
    e.preventDefault()
    startRef.current  = direction === 'rows' ? e.clientY : e.clientX
    startVal.current  = current

    const onMove = e => {
      const delta = direction === 'rows'
        ? e.clientY - startRef.current
        : e.clientX - startRef.current
      const diff = Math.round(delta / step)
      const raw  = startVal.current + diff
      const next = Math.min(max, Math.max(min, raw))
      if (raw < min) onBlocked?.()
      onChange(next)
    }

    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return onMouseDown
}

// ─── BlockedHint ──────────────────────────────────────────────────────
function BlockedHint({ visible }) {
  return (
    <div
      className="pointer-events-none absolute left-1/2 -translate-x-1/2 -bottom-10 z-30 whitespace-nowrap"
      style={{
        transition: 'opacity 180ms ease, transform 180ms ease',
        opacity: visible ? 1 : 0,
        transform: visible
          ? 'translateX(-50%) translateY(0)'
          : 'translateX(-50%) translateY(-4px)',
      }}
    >
      <div className="bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg">
        Перенесите растения в свободные ячейки
      </div>
    </div>
  )
}

// ─── Bed ──────────────────────────────────────────────────────────────
function Bed({
  bedIndex, rows, cols, plants, onCellClick,
  onRowsChange, onColsChange, onShiftRows,
  dragSource, dragTarget,
  onDragStart, onDragOver, onDrop, onDragLeave, onDragEnd,
}) {
  const getPlant = (row, col) =>
    plants.find(p => p.bedIndex === bedIndex && p.row === row && p.col === col) ?? null

  const key = (row, col) => `${bedIndex}-${row}-${col}`
  const srcKey = dragSource ? key(dragSource.row, dragSource.col) : null
  const tgtKey = dragTarget ? key(dragTarget.row, dragTarget.col) : null

  // ── Plant-aware resize constraints ──────────────────────────────────
  const bedPlants = plants.filter(p => p.bedIndex === bedIndex)

  const maxOccupiedRow = bedPlants.length > 0 ? Math.max(...bedPlants.map(p => p.row)) : -1
  const maxOccupiedCol = bedPlants.length > 0 ? Math.max(...bedPlants.map(p => p.col)) : -1
  const minOccupiedRow = bedPlants.length > 0 ? Math.min(...bedPlants.map(p => p.row)) : rows

  // bottom handle: can't shrink past the last occupied row
  const effectiveMinRows    = Math.max(MIN_ROWS, maxOccupiedRow + 1)
  // right handle: can't shrink past the last occupied col
  const effectiveMinCols    = Math.max(MIN_COLS, maxOccupiedCol + 1)
  // top handle: can't shrink if it would shift any plant to row < 0
  // effectiveMinRows_top = rows - minOccupiedRow (invariant during drag)
  const effectiveMinRowsTop = Math.max(MIN_ROWS, rows - minOccupiedRow)

  // ── Blocked hint ─────────────────────────────────────────────────────
  const [hintVisible, setHintVisible] = useState(false)
  const hintTimerRef = useRef(null)
  const showHint = () => {
    setHintVisible(true)
    clearTimeout(hintTimerRef.current)
    hintTimerRef.current = setTimeout(() => setHintVisible(false), 2000)
  }

  // ── Stale-closure-safe top handle ───────────────────────────────────
  const prevRowsRef = useRef(rows)
  prevRowsRef.current = rows

  const handleTopRowsChange = newRows => {
    const delta = newRows - prevRowsRef.current
    if (delta === 0) return
    prevRowsRef.current = newRows
    onRowsChange(newRows)
    onShiftRows?.(delta)
  }

  const dragRowsBottom = useDragResize(
    rows, effectiveMinRows, MAX_ROWS, CELL + GAP, 'rows',
    onRowsChange,
    effectiveMinRows > MIN_ROWS ? showHint : undefined,
  )
  const dragRowsTop = useDragResize(
    rows, effectiveMinRowsTop, MAX_ROWS, -(CELL + GAP), 'rows',
    handleTopRowsChange,
    effectiveMinRowsTop > MIN_ROWS ? showHint : undefined,
  )
  const dragCols = useDragResize(
    cols, effectiveMinCols, MAX_COLS, CELL + GAP, 'cols',
    onColsChange,
    effectiveMinCols > MIN_COLS ? showHint : undefined,
  )

  const w = bedPx(cols) + BED_PAD * 2
  const h = bedPx(rows) + BED_PAD * 2

  return (
    <div className="relative flex-shrink-0" style={{ width: w, height: h }}>
      <div
        className="w-full h-full bg-green-50 border border-green-200 rounded-2xl overflow-hidden"
        style={{ padding: BED_PAD }}
      >
        <div className="flex flex-col" style={{ gap: GAP }}>
          {Array.from({ length: rows }, (_, row) => (
            <div key={row} className="flex flex-shrink-0" style={{ gap: GAP }}>
              {Array.from({ length: cols }, (_, col) => {
                const plant = getPlant(row, col)
                const cellKey = key(row, col)
                const isSource = srcKey === cellKey && dragSource?.bedIndex === bedIndex
                const isTarget = tgtKey === cellKey && dragTarget?.bedIndex === bedIndex
                const targetType = isTarget ? (plant ? 'swap' : 'empty') : null
                return (
                  <div key={col} style={{ width: CELL, height: CELL, flexShrink: 0 }}>
                    <PlantCell
                      plant={plant}
                      isDragSource={isSource}
                      isDragTarget={isTarget}
                      dragTargetType={targetType}
                      onClick={() => !dragSource && onCellClick?.({ bedIndex, row, col })}
                      onDragStart={() => onDragStart({ bedIndex, row, col })}
                      onDragOver={() => onDragOver({ bedIndex, row, col })}
                      onDrop={() => onDrop({ bedIndex, row, col })}
                      onDragLeave={onDragLeave}
                      onDragEnd={onDragEnd}
                    />
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <ResizeHandle position="top"    onDragStart={dragRowsTop} />
      <ResizeHandle position="bottom" onDragStart={dragRowsBottom} />
      <ResizeHandle position="right"  onDragStart={dragCols} />

      <BlockedHint visible={hintVisible} />
    </div>
  )
}

// ─── MobileBed ────────────────────────────────────────────────────────
const CELL_M = 64
const GAP_M  = 6

function StepButton({ onClick, disabled, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-sm
        text-gray-500 disabled:opacity-30 hover:border-green-300 hover:text-green-600
        active:scale-90 transition-all"
    >
      {children}
    </button>
  )
}

// Пикер стороны: два варианта, активный подсвечен
function SidePicker({ a, b, value, onChange }) {
  return (
    <div className="flex rounded-lg overflow-hidden border border-gray-200 text-xs shrink-0">
      <button
        type="button"
        onClick={() => onChange(a.value)}
        className={`w-7 h-7 flex items-center justify-center transition-colors ${
          value === a.value ? 'bg-green-500 text-white' : 'text-gray-400 hover:bg-gray-50'
        }`}
      >{a.label}</button>
      <button
        type="button"
        onClick={() => onChange(b.value)}
        className={`w-7 h-7 flex items-center justify-center border-l border-gray-200 transition-colors ${
          value === b.value ? 'bg-green-500 text-white' : 'text-gray-400 hover:bg-gray-50'
        }`}
      >{b.label}</button>
    </div>
  )
}

// Только сетка ячеек, без контролов — контролы рендерятся снаружи слайдера
function MobileBed({ bedIndex, rows, cols, plants, onCellClick, dragSource, dragTarget, onTouchCellStart }) {
  const getPlant = (row, col) =>
    plants.find(p => p.bedIndex === bedIndex && p.row === row && p.col === col) ?? null

  return (
    <div className="bg-green-50 border border-green-200 rounded-2xl overflow-hidden" style={{ padding: BED_PAD }}>
      <div className="flex flex-col items-center" style={{ gap: GAP_M }}>
        {Array.from({ length: rows }, (_, row) => (
          <div key={row} className="flex justify-center" style={{ gap: GAP_M }}>
            {Array.from({ length: cols }, (_, col) => {
              const plant   = getPlant(row, col)
              const isSrc   = dragSource?.bedIndex === bedIndex && dragSource?.row === row && dragSource?.col === col
              const isTgt   = dragTarget?.bedIndex === bedIndex && dragTarget?.row === row && dragTarget?.col === col
              const tgtType = isTgt ? (plant ? 'swap' : 'empty') : null
              return (
                <div
                  key={col}
                  data-bed={bedIndex} data-row={row} data-col={col}
                  style={{ width: CELL_M, height: CELL_M, flexShrink: 0 }}
                >
                  <PlantCell
                    plant={plant}
                    isDragSource={isSrc}
                    isDragTarget={isTgt}
                    dragTargetType={tgtType}
                    onClick={() => !dragSource && onCellClick?.({ bedIndex, row, col })}
                    onTouchStart={e => onTouchCellStart?.(e, { bedIndex, row, col }, plant)}
                  />
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// Контролы изменения размера — вынесены за слайдер, всегда доступны при скролле
function BedSizeControls({ rows, cols, plants, bedIndex, rowSide, colSide, onRowSideChange, onColSideChange, onRowsChange, onColsChange, onShiftRows, onShiftCols }) {
  const bedPlants      = plants.filter(p => p.bedIndex === bedIndex)
  const maxOccupiedRow = bedPlants.length > 0 ? Math.max(...bedPlants.map(p => p.row)) : -1
  const maxOccupiedCol = bedPlants.length > 0 ? Math.max(...bedPlants.map(p => p.col)) : -1
  const minOccupiedRow = bedPlants.length > 0 ? Math.min(...bedPlants.map(p => p.row)) : rows
  const minOccupiedCol = bedPlants.length > 0 ? Math.min(...bedPlants.map(p => p.col)) : cols

  const canAddRow    = rows < MAX_ROWS
  const canRemoveRow = rowSide === 'bottom'
    ? rows > MIN_ROWS && rows > maxOccupiedRow + 1
    : rows > MIN_ROWS && minOccupiedRow > 0

  const canAddCol    = cols < MAX_COLS
  const canRemoveCol = colSide === 'right'
    ? cols > MIN_COLS && cols > maxOccupiedCol + 1
    : cols > MIN_COLS && minOccupiedCol > 0

  const handleAddRow    = () => { onRowsChange(rows + 1); if (rowSide === 'top') onShiftRows?.(1) }
  const handleRemoveRow = () => { onRowsChange(rows - 1); if (rowSide === 'top') onShiftRows?.(-1) }
  const handleAddCol    = () => { onColsChange(cols + 1); if (colSide === 'left') onShiftCols?.(1) }
  const handleRemoveCol = () => { onColsChange(cols - 1); if (colSide === 'left') onShiftCols?.(-1) }

  return (
    <div className="flex flex-col gap-2 mt-3 px-1" style={{ touchAction: 'auto' }}>
      {/* Строки */}
      <div className="flex items-center gap-2">
        <SidePicker
          a={{ value: 'top',    label: '↑' }}
          b={{ value: 'bottom', label: '↓' }}
          value={rowSide}
          onChange={onRowSideChange}
        />
        <span className="text-xs text-gray-400 w-14">Строк</span>
        <StepButton onClick={handleRemoveRow} disabled={!canRemoveRow}>−</StepButton>
        <span className="text-sm font-semibold text-gray-700 w-5 text-center">{rows}</span>
        <StepButton onClick={handleAddRow} disabled={!canAddRow}>+</StepButton>
      </div>
      {/* Столбцы */}
      <div className="flex items-center gap-2">
        <SidePicker
          a={{ value: 'left',  label: '←' }}
          b={{ value: 'right', label: '→' }}
          value={colSide}
          onChange={onColSideChange}
        />
        <span className="text-xs text-gray-400 w-14">Столбцов</span>
        <StepButton onClick={handleRemoveCol} disabled={!canRemoveCol}>−</StepButton>
        <span className="text-sm font-semibold text-gray-700 w-5 text-center">{cols}</span>
        <StepButton onClick={handleAddCol} disabled={!canAddCol}>+</StepButton>
      </div>
    </div>
  )
}

// ─── GreenhouseView ───────────────────────────────────────────────────
export default function GreenhouseView({ greenhouse, onCellClick, onPlantMove, onShiftRows, onShiftCols, onBedLayoutsChange }) {
  const { numBeds, plants = [] } = greenhouse
  const isMobile = useIsMobile()

  const [bedStates, setBedStates] = useState(() => {
    // Восстанавливаем сохранённые размеры грядок, иначе — дефолт
    const saved = greenhouse.bedLayouts
    return Array.from({ length: numBeds }, (_, i) =>
      saved?.[i] ?? { rows: greenhouse.numRows ?? 6, cols: 2 }
    )
  })

  const [activeBed,   setActiveBed]   = useState(0)
  const activeBedRef  = useRef(0)
  const swipeRef      = useRef({ dragging: false, startX: 0, offset: 0 })
  const [swipeOffset, setSwipeOffset] = useState(0)   // только для анимации
  const edgeTimerRef  = useRef(null)
  const [edgeZone,    setEdgeZone]    = useState(null) // 'left'|'right'|null

  const EDGE_W       = 56   // px зона края
  const EDGE_DELAY   = 650  // ms до смены грядки
  const SWIPE_THR    = 50   // px порог свайпа

  const switchBed = useCallback((next) => {
    activeBedRef.current = next
    setActiveBed(next)
  }, [])

  const [dragSource, setDragSource] = useState(null)
  const [dragTarget, setDragTarget] = useState(null)

  const updateBed = (bedIndex, field, value) =>
    setBedStates(prev => {
      const next = prev.map((s, i) => i === bedIndex ? { ...s, [field]: value } : s)
      onBedLayoutsChange?.(next)
      return next
    })

  const handleDragStart = (cell) => setDragSource(cell)
  const handleDragOver  = (cell) => {
    if (!dragSource) return
    const isSelf = cell.bedIndex === dragSource.bedIndex && cell.row === dragSource.row && cell.col === dragSource.col
    if (!isSelf) setDragTarget(cell)
  }
  const handleDrop = (cell) => {
    if (!dragSource) return
    const isSelf = cell.bedIndex === dragSource.bedIndex && cell.row === dragSource.row && cell.col === dragSource.col
    if (!isSelf) onPlantMove?.(dragSource, cell)
    setDragSource(null); setDragTarget(null)
  }
  const handleDragLeave = () => setDragTarget(null)
  const handleDragEnd   = () => { setDragSource(null); setDragTarget(null) }

  // ── Стороны для контролов размера (вынесены из MobileBed) ────────────
  const [rowSide, setRowSide] = useState('bottom')
  const [colSide, setColSide] = useState('right')

  // ── Touch drag state ──────────────────────────────────────────────
  const touchDragRef   = useRef({ active: false, source: null, target: null, x: 0, y: 0, plant: null })
  const [touchDrag, setTouchDrag] = useState(touchDragRef.current)
  const longPressTimer = useRef(null)
  const prevTargetEl   = useRef(null)   // DOM-элемент подсвеченной ячейки-цели

  // Refs для пропов — нужны внутри нативных обработчиков (stable closure)
  const numBedsRef      = useRef(numBeds)
  const onPlantMoveRef  = useRef(onPlantMove)
  const plantsRef       = useRef(plants)
  const onCellClickRef  = useRef(onCellClick)
  useEffect(() => { numBedsRef.current     = numBeds     }, [numBeds])
  useEffect(() => { onPlantMoveRef.current = onPlantMove }, [onPlantMove])
  useEffect(() => { plantsRef.current      = plants       }, [plants])
  useEffect(() => { onCellClickRef.current = onCellClick  }, [onCellClick])

  // Для ручной обработки тапов (e.preventDefault на touchstart убивает синтетические клики)
  const touchStartCellRef = useRef(null)
  const touchStartTimeRef = useRef(0)

  // Заглушка — long-press теперь полностью в нативном обработчике
  const handleTouchCellStart = useCallback(() => {}, [])

  // ── Все нативные touch-обработчики в одном эффекте (нет stale closures) ──
  const sliderContainerRef = useRef(null)

  useEffect(() => {
    const el = sliderContainerRef.current
    if (!el) return

    // Поиск ячейки под пальцем — два метода для надёжности
    const findCell = (x, y) => {
      const stack = document.elementsFromPoint?.(x, y) ?? []
      for (const node of stack) {
        if (node.dataset?.bed !== undefined) return node
        const p = node.closest?.('[data-bed]')
        if (p) return p
      }
      for (const c of document.querySelectorAll('[data-bed]')) {
        const r = c.getBoundingClientRect()
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return c
      }
      return null
    }

    const onStart = (e) => {
      // Кнопки (степперы ±) пропускаем — они должны работать как обычные клики.
      // Наш preventDefault убил бы синтетические onClick на них.
      if (e.target.closest('button')) return

      // preventDefault здесь — ключ к работе на MIUI Chrome:
      // без него браузер перехватывает long-press (показывает своё меню)
      // и бросает touchcancel до того, как наш таймер срабатывает.
      // Синтетические onClick после этого не стреляют — обрабатываем тапы вручную в onEnd.
      e.preventDefault()

      const t = e.touches[0]
      touchStartTimeRef.current = Date.now()
      touchStartCellRef.current = null
      swipeRef.current = { dragging: true, startX: t.clientX, startY: t.clientY, offset: 0, moved: false }
      setSwipeOffset(0)

      // Long-press нативно — не зависим от React synthetic events
      const cellEl = findCell(t.clientX, t.clientY)
      if (cellEl) {
        const bed = +cellEl.dataset.bed
        const row = +cellEl.dataset.row
        const col = +cellEl.dataset.col
        touchStartCellRef.current = { bedIndex: bed, row, col }
        const plant = plantsRef.current.find(
          p => p.bedIndex === bed && p.row === row && p.col === col
        )
        if (plant) {
          clearTimeout(longPressTimer.current)
          longPressTimer.current = setTimeout(() => {
            navigator.vibrate?.(60)
            const next = { active: true, source: { bedIndex: bed, row, col }, target: null, x: t.clientX, y: t.clientY, plant }
            touchDragRef.current = next
            setTouchDrag({ ...next })
          }, 450)
        }
      }
    }

    const onMove = (e) => {
      e.preventDefault()
      const t = e.touches[0]

      if (touchDragRef.current.active) {
        // ── Режим переноса ────────────────────────────────────
        const cellEl = findCell(t.clientX, t.clientY)

        // ── Прямое DOM-выделение цели (не ждём React-рендера) ──
        if (prevTargetEl.current && prevTargetEl.current !== cellEl) {
          const inner = prevTargetEl.current.firstElementChild
          if (inner) { inner.style.outline = ''; inner.style.background = '' }
          prevTargetEl.current = null
        }
        if (cellEl) {
          const bed = +cellEl.dataset.bed, row = +cellEl.dataset.row, col = +cellEl.dataset.col
          const src = touchDragRef.current.source
          const isSelf = src && src.bedIndex === bed && src.row === row && src.col === col
          if (!isSelf) {
            const hasPlant = !!plantsRef.current.find(p => p.bedIndex === bed && p.row === row && p.col === col)
            const inner = cellEl.firstElementChild
            if (inner) {
              inner.style.outline = hasPlant ? '2px solid #f59e0b' : '2px solid #22c55e'
              inner.style.background = hasPlant ? '#fffbeb' : '#dcfce7'
            }
            prevTargetEl.current = cellEl
          }
        }

        const target = cellEl
          ? { bedIndex: +cellEl.dataset.bed, row: +cellEl.dataset.row, col: +cellEl.dataset.col }
          : touchDragRef.current.target
        touchDragRef.current = { ...touchDragRef.current, x: t.clientX, y: t.clientY, target }
        setTouchDrag({ ...touchDragRef.current })

        // Детекция края для смены грядки
        const ab = activeBedRef.current
        const nb = numBedsRef.current
        const atLeft  = t.clientX < EDGE_W && ab > 0
        const atRight = t.clientX > window.innerWidth - EDGE_W && ab < nb - 1
        if (atLeft) {
          setEdgeZone('left')
          if (!edgeTimerRef.current) edgeTimerRef.current = setTimeout(() => {
            if (prevTargetEl.current) {
              const inner = prevTargetEl.current.firstElementChild
              if (inner) { inner.style.outline = ''; inner.style.background = '' }
              prevTargetEl.current = null
            }
            const next = activeBedRef.current - 1
            activeBedRef.current = next; setActiveBed(next)
            touchDragRef.current = { ...touchDragRef.current, target: null }
            setTouchDrag({ ...touchDragRef.current })
            edgeTimerRef.current = null; setEdgeZone(null)
          }, EDGE_DELAY)
        } else if (atRight) {
          setEdgeZone('right')
          if (!edgeTimerRef.current) edgeTimerRef.current = setTimeout(() => {
            if (prevTargetEl.current) {
              const inner = prevTargetEl.current.firstElementChild
              if (inner) { inner.style.outline = ''; inner.style.background = '' }
              prevTargetEl.current = null
            }
            const next = activeBedRef.current + 1
            activeBedRef.current = next; setActiveBed(next)
            touchDragRef.current = { ...touchDragRef.current, target: null }
            setTouchDrag({ ...touchDragRef.current })
            edgeTimerRef.current = null; setEdgeZone(null)
          }, EDGE_DELAY)
        } else {
          clearTimeout(edgeTimerRef.current); edgeTimerRef.current = null; setEdgeZone(null)
        }
        return
      }

      // ── Режим свайпа ──────────────────────────────────────
      if (!swipeRef.current.dragging) return
      const dx = t.clientX - swipeRef.current.startX
      const dy = t.clientY - swipeRef.current.startY
      if (Math.sqrt(dx * dx + dy * dy) > 10) {
        clearTimeout(longPressTimer.current)
        swipeRef.current.moved = true
      }
      if (!swipeRef.current.moved) return
      swipeRef.current.offset = dx
      setSwipeOffset(dx)
    }

    const onEnd = () => {
      clearTimeout(longPressTimer.current)
      clearTimeout(edgeTimerRef.current)
      edgeTimerRef.current = null; setEdgeZone(null)

      // Снять DOM-подсветку цели
      if (prevTargetEl.current) {
        const inner = prevTargetEl.current.firstElementChild
        if (inner) { inner.style.outline = ''; inner.style.background = '' }
        prevTargetEl.current = null
      }

      const drag = touchDragRef.current
      if (drag.active) {
        if (drag.source && drag.target) {
          const { source: s, target: tg } = drag
          const isSelf = s.bedIndex === tg.bedIndex && s.row === tg.row && s.col === tg.col
          if (!isSelf) onPlantMoveRef.current?.(s, tg)
        }
        const reset = { active: false, source: null, target: null, x: 0, y: 0, plant: null }
        touchDragRef.current = reset; setTouchDrag({ ...reset })
      } else {
        const { offset, moved } = swipeRef.current
        const elapsed = Date.now() - touchStartTimeRef.current
        // Тап: палец почти не двигался и отпустили быстро → эмулируем клик
        if (!moved && elapsed < 350 && touchStartCellRef.current) {
          onCellClickRef.current?.(touchStartCellRef.current)
        } else {
          // Свайп для смены грядки
          const ab = activeBedRef.current, nb = numBedsRef.current
          if (offset < -SWIPE_THR && ab < nb - 1) { activeBedRef.current = ab + 1; setActiveBed(ab + 1) }
          else if (offset > SWIPE_THR && ab > 0)  { activeBedRef.current = ab - 1; setActiveBed(ab - 1) }
        }
      }
      touchStartCellRef.current = null
      swipeRef.current = { dragging: false, startX: 0, startY: 0, offset: 0, moved: false }
      setSwipeOffset(0)
    }

    el.addEventListener('touchstart',  onStart, { passive: false })
    el.addEventListener('touchmove',   onMove,  { passive: false })
    el.addEventListener('touchend',    onEnd,   { passive: true  })
    el.addEventListener('touchcancel', onEnd,   { passive: true  })
    return () => {
      el.removeEventListener('touchstart',  onStart)
      el.removeEventListener('touchmove',   onMove)
      el.removeEventListener('touchend',    onEnd)
      el.removeEventListener('touchcancel', onEnd)
    }
  }, []) // Все переменные доступны через стабильные refs

  // ── Мобильный вид: горизонтальный слайдер ────────────────────────
  if (isMobile) {
    return (
      <div className="select-none pb-6">

        {/* Индикатор грядок (точки или pills) */}
        {numBeds > 1 && (
          <div className="flex mb-4 bg-gray-100 rounded-2xl p-1 gap-1">
            {bedStates.map((_, i) => (
              <button
                key={i}
                type="button"
                onTouchEnd={e => { e.stopPropagation(); switchBed(i) }}
                onClick={() => switchBed(i)}
                className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                  activeBed === i
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500'
                }`}
              >
                Грядка {String.fromCharCode(65 + i)}
              </button>
            ))}
          </div>
        )}

        {/* Слайдер грядок */}
        <div
          ref={sliderContainerRef}
          className="overflow-hidden"
          style={{ touchAction: 'none' }}
          onContextMenu={e => e.preventDefault()}
        >
          <div
            className="flex"
            style={{
              transform: `translateX(calc(-${activeBed * 100}% + ${touchDrag.active ? 0 : swipeOffset}px))`,
              transition: swipeRef.current.dragging ? 'none' : 'transform 320ms cubic-bezier(0.25, 1, 0.5, 1)',
              willChange: 'transform',
            }}
          >
            {bedStates.map((state, i) => (
              <div key={i} className="w-full shrink-0">
                <MobileBed
                  bedIndex={i}
                  rows={state.rows}
                  cols={state.cols}
                  plants={plants}
                  onCellClick={onCellClick}
                  dragSource={touchDrag.active ? touchDrag.source : null}
                  dragTarget={touchDrag.active ? touchDrag.target : null}
                  onTouchCellStart={handleTouchCellStart}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Ghost при drag */}
        {touchDrag.active && touchDrag.plant && (
          <div
            className="fixed z-[100] pointer-events-none flex items-center justify-center bg-white rounded-2xl shadow-2xl border-2 border-green-400"
            style={{
              width: CELL_M, height: CELL_M,
              left: touchDrag.x - CELL_M / 2,
              top:  touchDrag.y - CELL_M / 2,
              opacity: 0.9,
            }}
          >
            <span className="text-3xl leading-none">{touchDrag.plant.emoji ?? '🌱'}</span>
          </div>
        )}

        {/* Edge-зоны: стрелки при поднесении к краю во время drag */}
        {touchDrag.active && numBeds > 1 && (
          <>
            {activeBed > 0 && (
              <div
                className="fixed top-0 bottom-0 left-0 z-[99] pointer-events-none flex items-center justify-start"
                style={{
                  width: EDGE_W * 2.5,
                  background: 'linear-gradient(to right, rgba(34,197,94,0.35), transparent)',
                  opacity: edgeZone === 'left' ? 1 : 0,
                  transition: 'opacity 150ms ease',
                }}
              >
                <span className="ml-2 text-3xl drop-shadow">◀</span>
              </div>
            )}
            {activeBed < numBeds - 1 && (
              <div
                className="fixed top-0 bottom-0 right-0 z-[99] pointer-events-none flex items-center justify-end"
                style={{
                  width: EDGE_W * 2.5,
                  background: 'linear-gradient(to left, rgba(34,197,94,0.35), transparent)',
                  opacity: edgeZone === 'right' ? 1 : 0,
                  transition: 'opacity 150ms ease',
                }}
              >
                <span className="mr-2 text-3xl drop-shadow">▶</span>
              </div>
            )}
          </>
        )}

        {/* Контролы размера — вне слайдера, скроллируются со страницей */}
        {!touchDrag.active && (
          <BedSizeControls
            bedIndex={activeBed}
            rows={bedStates[activeBed].rows}
            cols={bedStates[activeBed].cols}
            plants={plants}
            rowSide={rowSide}
            colSide={colSide}
            onRowSideChange={setRowSide}
            onColSideChange={setColSide}
            onRowsChange={v => updateBed(activeBed, 'rows', v)}
            onColsChange={v => updateBed(activeBed, 'cols', v)}
            onShiftRows={delta => onShiftRows?.(activeBed, delta)}
            onShiftCols={delta => onShiftCols?.(activeBed, delta)}
          />
        )}

        {!touchDrag.active && (
          <p className="text-center text-sm text-gray-400 mt-3">
            {numBeds > 1 ? 'Свайп для смены грядки · удержание для переноса растения' : 'Удерживайте ячейку чтобы переместить растение'}
          </p>
        )}
      </div>
    )
  }

  // ── Десктопный вид: грядки рядом в теплице ────────────────────────
  const maxH = Math.max(...bedStates.map(s => bedPx(s.rows) + BED_PAD * 2))
  const totalW =
    bedStates.reduce((acc, s) => acc + bedPx(s.cols) + BED_PAD * 2, 0)
    + (numBeds - 1) * PATH_W
    + SIDE_PAD * 2

  return (
    <div className="flex justify-center w-full select-none">
      <div style={{ width: totalW + 12 }}>

        <div
          className="bg-white border border-b-0 border-gray-200 shadow-sm mx-[6px]"
          style={{ height: ARCH_H, borderRadius: '50% 50% 0 0 / 100% 100% 0 0' }}
        />

        <div
          className="bg-white border-x border-gray-200 mx-[6px] flex items-center justify-center"
          style={{ height: maxH + 40, paddingLeft: SIDE_PAD, paddingRight: SIDE_PAD }}
        >
          <div className="flex items-end" style={{ gap: PATH_W }}>
            {bedStates.map((state, bedIndex) => (
              <div key={bedIndex} className="flex flex-col items-center gap-2">
                <span className="text-xs font-semibold tracking-widest uppercase text-gray-400">
                  Грядка {String.fromCharCode(65 + bedIndex)}
                </span>
                <Bed
                  bedIndex={bedIndex}
                  rows={state.rows}
                  cols={state.cols}
                  plants={plants}
                  onCellClick={onCellClick}
                  onRowsChange={v => updateBed(bedIndex, 'rows', v)}
                  onColsChange={v => updateBed(bedIndex, 'cols', v)}
                  onShiftRows={delta => onShiftRows?.(bedIndex, delta)}
                  dragSource={dragSource?.bedIndex === bedIndex ? dragSource : null}
                  dragTarget={dragTarget?.bedIndex === bedIndex ? dragTarget : null}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onDragLeave={handleDragLeave}
                  onDragEnd={handleDragEnd}
                />
              </div>
            ))}
          </div>
        </div>

        <div
          className="bg-white border border-t-0 border-gray-200 shadow-sm mx-[6px]"
          style={{ height: ARCH_H, borderRadius: '0 0 50% 50% / 0 0 100% 100%' }}
        />

        <p className="text-center text-xs text-gray-400 mt-3">
          Потяните за ручки на рамке грядки чтобы изменить размер
        </p>

      </div>
    </div>
  )
}
