function DragDots() {
  return (
    <div className="grid grid-cols-2 gap-[3px]">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="w-[3px] h-[3px] rounded-full bg-current" />
      ))}
    </div>
  )
}

export default function PlantCell({
  plant,
  onClick,
  isDragSource = false,
  isDragTarget = false,
  dragTargetType = null,   // 'empty' | 'swap'
  onDragStart,
  onDragOver,
  onDrop,
  onDragLeave,
  onDragEnd,
  onTouchStart,
}) {
  const isEmpty = !plant

  const base = 'relative w-full h-full rounded-xl border transition-all duration-100 select-none group'

  let style = ''
  if (isDragSource) {
    style = 'bg-green-100 border-green-300 opacity-40 scale-95'
  } else if (isDragTarget && dragTargetType === 'empty') {
    style = 'bg-green-100 border-green-500 border-2 shadow-inner'
  } else if (isDragTarget && dragTargetType === 'swap') {
    style = 'bg-amber-50 border-amber-400 border-2'
  } else if (isEmpty) {
    style = 'bg-white border-gray-200 hover:border-green-400 hover:bg-green-50 cursor-pointer'
  } else {
    style = 'bg-green-50 border-green-200 hover:border-green-400 cursor-grab active:cursor-grabbing'
  }

  return (
    <div
      className={`${base} ${style}`}
      draggable={!isEmpty}
      onDragStart={!isEmpty ? onDragStart : undefined}
      onDragOver={e => { e.preventDefault(); onDragOver?.() }}
      onDrop={e => { e.preventDefault(); onDrop?.() }}
      onDragLeave={onDragLeave}
      onDragEnd={onDragEnd}
      onClick={onClick}
      onTouchStart={onTouchStart}
    >
      {/* Пустая ячейка — плюс при наведении */}
      {isEmpty && !isDragTarget && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-green-400 text-xl leading-none font-light">+</span>
        </div>
      )}

      {/* Занятая ячейка — эмодзи + иконка drag + название */}
      {!isEmpty && (
        <>
          <div className="absolute inset-0 flex items-center justify-center pb-4">
            <span className="text-2xl leading-none">{plant.emoji ?? '🌱'}</span>
          </div>
          <div className="absolute bottom-1 left-1 right-1 text-center text-[11px] font-medium text-gray-400 truncate leading-none px-0.5">
            {plant.plantName || plant.plantType}
          </div>
          <div className="absolute top-1.5 right-1.5 text-gray-400 opacity-0 group-hover:opacity-60 transition-opacity pointer-events-none">
            <DragDots />
          </div>
        </>
      )}

      {/* Индикатор цели: пустая */}
      {isDragTarget && dragTargetType === 'empty' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-green-500 text-lg">↓</span>
        </div>
      )}

      {/* Индикатор цели: обмен */}
      {isDragTarget && dragTargetType === 'swap' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xl leading-none">{plant.emoji ?? '🌱'}</span>
            <span className="text-[10px] font-semibold text-amber-500 leading-none">⇄</span>
          </div>
        </div>
      )}
    </div>
  )
}
