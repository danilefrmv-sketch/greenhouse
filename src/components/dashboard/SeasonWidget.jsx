// ─── SeasonCard — единая компактная карточка ──────────────────────────

import { useState } from 'react'
import { loadPlants } from '../../lib/greenhouseStorage'

function useSeasonStats(greenhouses) {
  const allIds    = greenhouses.map(g => g.id)
  const allPlants = allIds.flatMap(id => loadPlants(id, []))
  const active    = allPlants.filter(p => !p.harvested)

  const counts = {}
  const emojis = {}
  active.forEach(p => {
    if (!p.plantType) return
    counts[p.plantType] = (counts[p.plantType] || 0) + 1
    if (p.emoji && !emojis[p.plantType]) emojis[p.plantType] = p.emoji
  })
  const plantTypes = Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .map(([type, count]) => ({ type, count, emoji: emojis[type] || '🌱' }))

  const varieties = new Set(active.map(p => p.plantType).filter(Boolean))

  return { active: active.length, varieties: varieties.size, total: greenhouses.length, plantTypes }
}

const ROWS = [
  { key: 'active',    label: 'Растут сейчас', hasDetail: true },
  { key: 'varieties', label: 'Видов растений' },
  { key: 'total',     label: 'Теплицы' },
]

export default function SeasonCard({ greenhouses }) {
  const stats = useSeasonStats(greenhouses)
  const [open, setOpen] = useState(false)

  return (
    <div className="card p-5 flex flex-col gap-5">
      <span className="text-sm font-semibold uppercase tracking-wider text-gray-400">Сезон</span>

      <div className="flex flex-col gap-4">
        {ROWS.map(row => (
          <div key={row.key} className="relative flex items-center gap-3">
            <span className="text-2xl font-bold text-gray-900 tabular-nums leading-none w-8 shrink-0">
              {stats[row.key]}
            </span>
            <span className="text-sm text-gray-500 flex-1 leading-tight">{row.label}</span>

            {row.hasDetail && stats.plantTypes.length > 0 && (
              <>
                <button
                  onMouseEnter={() => setOpen(true)}
                  onMouseLeave={() => setOpen(false)}
                  className="w-5 h-5 flex items-center justify-center rounded-md text-gray-300 hover:text-gray-500 transition-colors shrink-0"
                >
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <rect x="4.5" y="1.5"  width="7" height="1.4" rx="0.7" fill="currentColor"/>
                    <rect x="4.5" y="5.8"  width="7" height="1.4" rx="0.7" fill="currentColor"/>
                    <rect x="4.5" y="10.1" width="7" height="1.4" rx="0.7" fill="currentColor"/>
                    <circle cx="2" cy="2.2"  r="0.9" fill="currentColor"/>
                    <circle cx="2" cy="6.5"  r="0.9" fill="currentColor"/>
                    <circle cx="2" cy="10.8" r="0.9" fill="currentColor"/>
                  </svg>
                </button>

                {open && (
                  <div
                    className="absolute top-full left-0 mt-2 z-30 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 min-w-[180px]"
                    onMouseEnter={() => setOpen(true)}
                    onMouseLeave={() => setOpen(false)}
                  >
                    <div className="text-sm font-semibold text-gray-400 mb-2.5">
                      По культурам
                    </div>
                    <div className="flex flex-col gap-2">
                      {stats.plantTypes.map(({ type, count, emoji }) => (
                        <div key={type} className="flex items-center gap-2">
                          <span className="text-sm leading-none w-5 text-center shrink-0">{emoji}</span>
                          <span className="flex-1 text-sm text-gray-700 truncate">{type}</span>
                          <span className="text-sm font-semibold text-gray-900 tabular-nums">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
