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

function MobileBed({ bedIndex, rows, cols, plants, onCellClick, onRowsChange, onColsChange, dragSource, dragTarget, onTouchCellStart }) {
  const getPlant = (row, col) =>
    plants.find(p => p.bedIndex === bedIndex && p.row === row && p.col === col) ?? null

  const bedPlants      = plants.filter(p => p.bedIndex === bedIndex)
  const maxOccupiedRow = bedPlants.length > 0 ? Math.max(...bedPlants.map(p => p.row)) : -1
  const maxOccupiedCol = bedPlants.length > 0 ? Math.max(...bedPlants.map(p => p.col)) : -1
  const effectiveMinRows = Math.max(MIN_ROWS, maxOccupiedRow + 1)
  const effectiveMinCols = Math.max(MIN_COLS, maxOccupiedCol + 1)

  return (
    <div>
      <div className="bg-green-50 border border-green-200 rounded-2xl overflow-hidden" style={{ padding: BED_PAD }}>
        <div className="flex flex-col items-center" style={{ gap: GAP_M }}>
          {Array.from({ length: rows }, (_, row) => (
            <div key={row} className="flex justify-center" style={{ gap: GAP_M }}>
              {Array.from({ length: cols }, (_, col) => {
                const plant    = getPlant(row, col)
                const isSrc    = dragSource?.bedIndex === bedIndex && dragSource?.row === row && dragSource?.col === col
                const isTgt    = dragTarget?.bedIndex === bedIndex && dragTarget?.row === row && dragTarget?.col === col
                const tgtType  = isTgt ? (plant ? 'swap' : 'empty') : null
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

      {/* Resize steppers */}
      <div
        className="flex items-center justify-between mt-2.5 px-0.5"
        onTouchStart={e => e.stopPropagation()}
        style={{ touchAction: 'auto' }}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">Строк</span>
          <StepButton
            onClick={() => onRowsChange(Math.max(effectiveMinRows, rows - 1))}
            disabled={rows <= effectiveMinRows}
          >−</StepButton>
          <span className="text-sm font-semibold text-gray-600 w-4 text-center">{rows}</span>
          <StepButton
            onClick={() => onRowsChange(Math.min(MAX_ROWS, rows + 1))}
            disabled={rows >= MAX_ROWS}
          >+</StepButton>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">Столбцов</span>
          <StepButton
            onClick={() => onColsChange(Math.max(effectiveMinCols, cols - 1))}
            disabled={cols <= effectiveMinCols}
          >−</StepButton>
          <span className="text-sm font-semibold text-gray-600 w-5 text-center">{cols}</span>
          <StepButton
            onClick={() => onColsChange(Math.min(MAX_COLS, cols + 1))}
            disabled={cols >= MAX_COLS}
          >+</StepButton>
        </div>
      </div>
    </div>
  )
}

// ─── GreenhouseView ───────────────────────────────────────────────────
export default function GreenhouseView({ greenhouse, onCellClick, onPlantMove, onShiftRows }) {
  const { numBeds, plants = [] } = greenhouse
  const isMobile = useIsMobile()

  const [bedStates, setBedStates] = useState(
    Array.from({ length: numBeds }, () => ({
      rows: greenhouse.numRows ?? 6,
      cols: 2,
    }))
  )

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
    setBedStates(prev => prev.map((s, i) => i === bedIndex ? { ...s, [field]: value } : s))

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

  // ── Touch drag state ──────────────────────────────────────────────
  const [touchDrag, setTouchDrag] = useState({ active: false, source: null, target: null, x: 0, y: 0, plant: null })
  const touchDragRef   = useRef(touchDrag)
  const longPressTimer = useRef(null)

  // Синхронизируем ref для чтения в коллбэках без stale closure
  useEffect(() => { touchDragRef.current = touchDrag }, [touchDrag])

  const handleTouchCellStart = useCallback((e, cell, plant) => {
    if (!plant) return
    const touch = e.touches[0]
    clearTimeout(longPressTimer.current)
    longPressTimer.current = setTimeout(() => {
      navigator.vibrate?.(60)
      setTouchDrag({ active: true, source: cell, target: null, x: touch.clientX, y: touch.clientY, plant })
    }, 450)
    // Фиксируем старт свайпа (если long-press не сработает — будет свайп)
    swipeRef.current = { dragging: true, startX: touch.clientX, offset: 0 }
    setSwipeOffset(0)
  }, [])

  const handleContainerTouchStart = useCallback(e => {
    const touch = e.touches[0]
    swipeRef.current = { dragging: true, startX: touch.clientX, offset: 0 }
    setSwipeOffset(0)
  }, [])

  const handleContainerTouchMove = useCallback(e => {
    const touch = e.touches[0]

    if (touchDragRef.current.active) {
      // ── Режим переноса растения ──────────────────────────────
      clearTimeout(longPressTimer.current)
      e.preventDefault()
      setTouchDrag(prev => ({ ...prev, x: touch.clientX, y: touch.clientY }))

      const el    = document.elementFromPoint(touch.clientX, touch.clientY)
      const cellEl = el?.closest('[data-bed]')
      if (cellEl) {
        setTouchDrag(prev => ({
          ...prev,
          target: {
            bedIndex: parseInt(cellEl.dataset.bed),
            row:      parseInt(cellEl.dataset.row),
            col:      parseInt(cellEl.dataset.col),
          }
        }))
      }

      // Детекция края → смена грядки
      const sw = window.innerWidth
      const atLeft  = touch.clientX < EDGE_W && activeBedRef.current > 0
      const atRight = touch.clientX > sw - EDGE_W && activeBedRef.current < numBeds - 1

      if (atLeft) {
        setEdgeZone('left')
        if (!edgeTimerRef.current) {
          edgeTimerRef.current = setTimeout(() => {
            switchBed(activeBedRef.current - 1)
            setTouchDrag(p => ({ ...p, target: null }))
            edgeTimerRef.current = null
            setEdgeZone(null)
          }, EDGE_DELAY)
        }
      } else if (atRight) {
        setEdgeZone('right')
        if (!edgeTimerRef.current) {
          edgeTimerRef.current = setTimeout(() => {
            switchBed(activeBedRef.current + 1)
            setTouchDrag(p => ({ ...p, target: null }))
            edgeTimerRef.current = null
            setEdgeZone(null)
          }, EDGE_DELAY)
        }
      } else {
        clearTimeout(edgeTimerRef.current)
        edgeTimerRef.current = null
        setEdgeZone(null)
      }
      return
    }

    // ── Режим свайпа между грядками ──────────────────────────
    clearTimeout(longPressTimer.current)
    if (!swipeRef.current.dragging) return
    const offset = touch.clientX - swipeRef.current.startX
    swipeRef.current.offset = offset
    setSwipeOffset(offset)
  }, [numBeds, switchBed])

  const handleContainerTouchEnd = useCallback(() => {
    clearTimeout(longPressTimer.current)
    clearTimeout(edgeTimerRef.current)
    edgeTimerRef.current = null
    setEdgeZone(null)

    if (touchDragRef.current.active) {
      setTouchDrag(prev => {
        if (prev.source && prev.target) {
          const { source, target } = prev
          const isSelf = source.bedIndex === target.bedIndex && source.row === target.row && source.col === target.col
          if (!isSelf) onPlantMove?.(source, target)
        }
        return { active: false, source: null, target: null, x: 0, y: 0, plant: null }
      })
    } else {
      // Завершение свайпа → переключаем грядку если превышен порог
      const { offset } = swipeRef.current
      if (offset < -SWIPE_THR && activeBedRef.current < numBeds - 1) {
        switchBed(activeBedRef.current + 1)
      } else if (offset > SWIPE_THR && activeBedRef.current > 0) {
        switchBed(activeBedRef.current - 1)
      }
    }

    swipeRef.current = { dragging: false, startX: 0, offset: 0 }
    setSwipeOffset(0)
  }, [onPlantMove, numBeds, switchBed])

  const handleContainerTouchCancel = useCallback(() => {
    clearTimeout(longPressTimer.current)
    clearTimeout(edgeTimerRef.current)
    edgeTimerRef.current = null
    setEdgeZone(null)
    setTouchDrag({ active: false, source: null, target: null, x: 0, y: 0, plant: null })
    swipeRef.current = { dragging: false, startX: 0, offset: 0 }
    setSwipeOffset(0)
  }, [])

  // ── Non-passive touch listeners (нужно для e.preventDefault() на Android) ──
  const sliderContainerRef = useRef(null)
  const touchStartCbRef    = useRef(handleContainerTouchStart)
  const touchMoveCbRef     = useRef(handleContainerTouchMove)
  useEffect(() => { touchStartCbRef.current = handleContainerTouchStart }, [handleContainerTouchStart])
  useEffect(() => { touchMoveCbRef.current  = handleContainerTouchMove  }, [handleContainerTouchMove])

  useEffect(() => {
    const el = sliderContainerRef.current
    if (!el) return
    const onStart  = e => touchStartCbRef.current(e)
    const onMove   = e => { e.preventDefault(); touchMoveCbRef.current(e) }
    el.addEventListener('touchstart', onStart, { passive: false })
    el.addEventListener('touchmove',  onMove,  { passive: false })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove',  onMove)
    }
  }, [])

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
          onTouchEnd={handleContainerTouchEnd}
          onTouchCancel={handleContainerTouchCancel}
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
                  onRowsChange={v => updateBed(i, 'rows', v)}
                  onColsChange={v => updateBed(i, 'cols', v)}
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
