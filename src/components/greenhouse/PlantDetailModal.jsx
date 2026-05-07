import Modal from '../ui/Modal'

export default function PlantDetailModal({ open, onClose, plant, onRemove }) {
  if (!plant) return null

  const displayName = plant.plantName && plant.plantName !== plant.plantType
    ? plant.plantName
    : null

  const handleRemove = () => {
    onRemove(plant)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Растение">
      <div className="flex flex-col gap-5">

        {/* Карточка */}
        <div className="flex items-center gap-4 bg-green-50 rounded-2xl px-5 py-4">
          <span className="text-5xl leading-none">{plant.emoji ?? '🌱'}</span>
          <div className="flex flex-col gap-0.5">
            <span className="text-lg font-semibold text-gray-900">{plant.plantType}</span>
            {displayName && (
              <span className="text-sm text-gray-500">{displayName}</span>
            )}
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex gap-3">
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>
            Закрыть
          </button>
          <button
            type="button"
            onClick={handleRemove}
            className="flex-1 py-2.5 px-5 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-all duration-200 active:scale-95"
          >
            Выкопать
          </button>
        </div>

      </div>
    </Modal>
  )
}
