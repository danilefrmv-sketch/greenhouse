// ─── PlantTypesWidget ─────────────────────────────────────────────────
// Список типов растений из всех теплиц

export default function PlantTypesWidget({ greenhouses }) {
  const allPlants = greenhouses.flatMap(g => g.plants ?? [])

  const counts = {}
  const emojis = {}
  allPlants.forEach(p => {
    if (!p.plantType) return
    counts[p.plantType] = (counts[p.plantType] || 0) + 1
    if (p.emoji && !emojis[p.plantType]) emojis[p.plantType] = p.emoji
  })

  const sorted = Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)

  if (sorted.length === 0) {
    return (
      <div className="card p-5 flex flex-col gap-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Состав посадок
        </span>
        <p className="text-sm text-gray-400 mt-1">Нет посаженных растений</p>
      </div>
    )
  }

  return (
    <div className="card p-5 flex flex-col gap-4">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
        Состав посадок
      </span>

      <div className="flex flex-col gap-2.5">
        {sorted.map(([type, count]) => (
          <div key={type} className="flex items-center gap-2.5">
            <span className="text-base w-5 text-center shrink-0 leading-none">
              {emojis[type] || '🌱'}
            </span>
            <span className="flex-1 text-sm text-gray-700 truncate min-w-0">{type}</span>
            <span className="text-sm font-semibold text-gray-900 tabular-nums shrink-0">
              {count}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
