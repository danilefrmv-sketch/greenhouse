import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import GreenhouseCard from '../components/greenhouse/GreenhouseCard'
import CreateGreenhouseModal from '../components/greenhouse/CreateGreenhouseModal'
import WeatherWidget from '../components/dashboard/WeatherWidget'
import LunarWidget from '../components/dashboard/LunarWidget'
import SeasonCard from '../components/dashboard/SeasonWidget'
import ProfileDrawer from '../components/profile/ProfileDrawer'
import { useToast } from '../contexts/ToastContext'
import { loadProfile, saveProfile } from '../lib/profileStorage'
import { computeStats, getEarnedIds, ACHIEVEMENTS, recordVisit } from '../lib/achievements'
import {
  loadMeta, loadPlants,
  loadGreenhouseList, saveGreenhouseList, addToGreenhouseList,
  saveMeta,
} from '../lib/greenhouseStorage'
import { GREENHOUSE_BASES } from '../lib/greenhouseDefaults'

// Инициализируем gh-list при первом запуске, потом всегда читаем оттуда
function initList() {
  const stored = loadGreenhouseList()
  if (stored && stored.length > 0) return stored
  return []
}

function enrichGreenhouse(gh) {
  const meta       = loadMeta(gh.id, { name: gh.name, description: gh.description, type: gh.type })
  const allPlants  = loadPlants(gh.id, [])
  const active     = allPlants.filter(p => !p.harvested)
  const plantTypes = [...new Set(active.map(p => p.plantType).filter(Boolean))]
  const description = meta.description || (plantTypes.length > 0 ? plantTypes.join(', ') : '')
  return { ...gh, name: meta.name, type: meta.type, description, plants: active }
}

export default function DashboardPage() {
  const navigate      = useNavigate()
  const showToast     = useToast()
  const [greenhouses, setGreenhouses] = useState(() => initList().map(enrichGreenhouse))
  const [modalOpen,   setModalOpen]   = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [profile,     setProfile]     = useState(() => loadProfile())

  // Проверяем новые достижения при каждом монтировании
  useEffect(() => {
    recordVisit()
    const stats   = computeStats()
    const earned  = getEarnedIds(stats)
    const profile = loadProfile()
    const newOnes = earned.filter(id => !profile.seenAchievements.includes(id))

    if (newOnes.length > 0) {
      const updated = { ...profile, seenAchievements: [...profile.seenAchievements, ...newOnes] }
      saveProfile(updated)
      setProfile(updated)
      // Показываем тост с задержкой для каждого нового достижения
      newOnes.forEach((id, i) => {
        const a = ACHIEVEMENTS.find(a => a.id === id)
        if (a) setTimeout(() => showToast(a.emoji, a.name, a.desc), i * 600)
      })
    }
  }, [])

  const handleCreate = newGreenhouse => {
    // Сохраняем в список теплиц и мету
    addToGreenhouseList({ id: newGreenhouse.id, name: newGreenhouse.name, type: newGreenhouse.type, numBeds: newGreenhouse.numBeds, description: newGreenhouse.description })
    saveMeta(newGreenhouse.id, { name: newGreenhouse.name, description: newGreenhouse.description, type: newGreenhouse.type })
    // Сразу открываем новую теплицу
    navigate(`/greenhouse/${newGreenhouse.id}`)
  }

  return (
    <div className="min-h-screen bg-soil-100">
      <header className="bg-white border-b border-soil-200 px-4 md:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <span className="text-xl md:text-2xl">🌿</span>
            <span className="text-base md:text-lg font-semibold text-green-800">Виртуальная теплица</span>
          </div>
          <button
            onClick={() => setProfileOpen(true)}
            title="Профиль"
            className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-green-50 hover:bg-green-100 border border-green-200 text-xl transition-colors"
          >
            {profile.avatar || '🧑‍🌾'}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10">

        {/* Bento-блок виджетов */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8 md:mb-10">
          <SeasonCard greenhouses={greenhouses} />
          <WeatherWidget />
          <LunarWidget />
        </div>

        <div className="flex items-center justify-between mb-5 md:mb-8">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Мои теплицы</h1>
          <button className="btn-primary flex items-center gap-2" onClick={() => setModalOpen(true)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="hidden sm:inline">Новая теплица</span>
            <span className="sm:hidden">Новая</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {greenhouses.map(g => (
            <GreenhouseCard key={g.id} greenhouse={g} />
          ))}
          <button
            className="rounded-3xl border-2 border-dashed border-soil-300 hover:border-green-300 hover:bg-green-50 transition-all duration-200 flex flex-col items-center justify-center gap-3 py-8 text-soil-400 hover:text-green-500 group"
            onClick={() => setModalOpen(true)}
          >
            <span className="text-3xl group-hover:scale-110 transition-transform duration-200">+</span>
            <span className="text-sm font-medium">Новая теплица</span>
          </button>
        </div>
      </main>

      <CreateGreenhouseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
      />

      <ProfileDrawer
        open={profileOpen}
        onClose={() => { setProfileOpen(false); setProfile(loadProfile()) }}
      />
    </div>
  )
}

function declension(n) {
  if (n % 10 === 1 && n % 100 !== 11) return 'теплица'
  if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return 'теплицы'
  return 'теплиц'
}
