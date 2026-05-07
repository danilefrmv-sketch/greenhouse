import { scheduleSync } from './firestoreSync'

// ─── Visit tracking ───────────────────────────────────────────────────

const KNOWN_NEW_MOON = new Date('2000-01-06T18:14:00Z')
const SYNODIC        = 29.530588853

function moonAge(date) {
  const days = (date.getTime() - KNOWN_NEW_MOON.getTime()) / 86_400_000
  return ((days % SYNODIC) + SYNODIC) % SYNODIC
}

function isCurrentlyFullMoon() {
  const age = moonAge(new Date())
  return age >= 13.8 && age < 15.8
}

function getVisitData() {
  try { return JSON.parse(localStorage.getItem('gh-visits') || '{}') } catch { return {} }
}

function getStreak(dates) {
  if (!dates?.length) return 0
  const sorted = [...new Set(dates)].sort().reverse()
  const today = new Date().toISOString().split('T')[0]
  if (sorted[0] !== today) return 0
  let streak = 1
  for (let i = 1; i < sorted.length; i++) {
    const diff = (new Date(sorted[i - 1]) - new Date(sorted[i])) / 86_400_000
    if (Math.round(diff) === 1) streak++
    else break
  }
  return streak
}

// Вызывается при каждом открытии дашборда
export function recordVisit() {
  const now   = new Date()
  const today = now.toISOString().split('T')[0]
  const hour  = now.getHours()

  try {
    const data = getVisitData()
    if (!data.dates)   data.dates   = []
    if (!data.morning) data.morning = []
    if (!data.night)   data.night   = []
    if (!data.fullMoon)data.fullMoon= []

    if (!data.dates.includes(today))   data.dates.push(today)
    if (hour >= 6  && hour < 11  && !data.morning.includes(today))  data.morning.push(today)
    if (hour >= 2  && hour < 5   && !data.night.includes(today))    data.night.push(today)
    if (isCurrentlyFullMoon()    && !data.fullMoon.includes(today))  data.fullMoon.push(today)

    localStorage.setItem('gh-visits', JSON.stringify(data))
    scheduleSync()
  } catch {}
}

// ─── Статистика ───────────────────────────────────────────────────────

export function computeStats() {
  let totalPlants = 0
  let harvested   = 0
  const types     = new Set()
  let hasWinterPlant = false

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key?.startsWith('gh-plants-')) continue
    try {
      const plants = JSON.parse(localStorage.getItem(key)) || []
      totalPlants += plants.length
      harvested   += plants.filter(p => p.harvested).length
      plants.forEach(p => {
        if (p.plantType) types.add(p.plantType)
        if (p.plantedAt) {
          const m = new Date(p.plantedAt).getMonth()
          if (m === 11 || m === 0 || m === 1) hasWinterPlant = true
        }
      })
    } catch {}
  }

  let greenhouses = 0
  try { greenhouses = (JSON.parse(localStorage.getItem('gh-list')) || []).length } catch {}

  const visits      = getVisitData()
  const streak      = getStreak(visits.dates || [])
  const morningStreak = getStreak(visits.morning || [])
  const nightVisit  = (visits.night || []).length > 0
  const fullMoonVisit = (visits.fullMoon || []).length > 0

  return {
    greenhouses, totalPlants, harvested,
    types: types.size,
    streak, morningStreak,
    nightVisit, fullMoonVisit, hasWinterPlant,
  }
}

// ─── Грейды ───────────────────────────────────────────────────────────

export const GRADES = [
  { min: 0,   label: 'Новичок',        emoji: '🌱', colorClass: 'text-gray-500',    bgClass: 'bg-gray-100'    },
  { min: 5,   label: 'Дачник',         emoji: '🪴', colorClass: 'text-green-600',   bgClass: 'bg-green-100'   },
  { min: 15,  label: 'Садовод',        emoji: '🌾', colorClass: 'text-emerald-600', bgClass: 'bg-emerald-100' },
  { min: 30,  label: 'Фермер',         emoji: '🚜', colorClass: 'text-teal-600',    bgClass: 'bg-teal-100'    },
  { min: 75,  label: 'Мастер грядок',  emoji: '🌳', colorClass: 'text-amber-600',   bgClass: 'bg-amber-100'   },
  { min: 150, label: 'Лорд урожая',    emoji: '👑', colorClass: 'text-orange-600',  bgClass: 'bg-orange-100'  },
  { min: 350, label: 'Хранитель сада', emoji: '✨', colorClass: 'text-purple-600',  bgClass: 'bg-purple-100'  },
]

export function getGrade(totalPlants) {
  let grade = GRADES[0]
  for (const g of GRADES) { if (totalPlants >= g.min) grade = g }
  return grade
}

export function getNextGrade(totalPlants) {
  return GRADES.find(g => g.min > totalPlants) ?? null
}

// ─── Достижения ───────────────────────────────────────────────────────
// rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'secret'
// progress(stats) → { current, total } — опционально

export const ACHIEVEMENTS = [
  // ── Базовые посадки ────────────────────────────────────────────────
  {
    id: 'sprout',   emoji: '🌱', name: 'Проклюнулось!',   rarity: 'common',
    desc: 'Посадите первое растение',
    check: s => s.totalPlants >= 1,
    progress: s => ({ current: Math.min(s.totalPlants, 1), total: 1 }),
  },
  {
    id: 'hands',    emoji: '🪴', name: 'Руки в земле',    rarity: 'common',
    desc: '5 посадок',
    check: s => s.totalPlants >= 5,
    progress: s => ({ current: Math.min(s.totalPlants, 5), total: 5 }),
  },
  {
    id: 'mini_farm',emoji: '🌾', name: 'Мини-фермер',     rarity: 'rare',
    desc: '25 посадок',
    check: s => s.totalPlants >= 25,
    progress: s => ({ current: Math.min(s.totalPlants, 25), total: 25 }),
  },
  {
    id: 'magnate',  emoji: '🚜', name: 'Агромагнат',      rarity: 'epic',
    desc: '100 посадок',
    check: s => s.totalPlants >= 100,
    progress: s => ({ current: Math.min(s.totalPlants, 100), total: 100 }),
  },
  {
    id: 'legend',   emoji: '🌳', name: 'Легенда грядок',  rarity: 'legendary',
    desc: '500 посадок',
    check: s => s.totalPlants >= 500,
    progress: s => ({ current: Math.min(s.totalPlants, 500), total: 500 }),
  },

  // ── Урожай ────────────────────────────────────────────────────────
  {
    id: 'harvest1', emoji: '🥕', name: 'Первый урожай',   rarity: 'common',
    desc: 'Соберите первый урожай',
    check: s => s.harvested >= 1,
    progress: s => ({ current: Math.min(s.harvested, 1), total: 1 }),
  },
  {
    id: 'summer',   emoji: '🍓', name: 'Вкус лета',       rarity: 'rare',
    desc: '10 урожаев',
    check: s => s.harvested >= 10,
    progress: s => ({ current: Math.min(s.harvested, 10), total: 10 }),
  },
  {
    id: 'basket',   emoji: '🧺', name: 'Полная корзина',  rarity: 'epic',
    desc: '50 урожаев',
    check: s => s.harvested >= 50,
    progress: s => ({ current: Math.min(s.harvested, 50), total: 50 }),
  },
  {
    id: 'wholesale',emoji: '🚛', name: 'Оптовик',         rarity: 'legendary',
    desc: '200 урожаев',
    check: s => s.harvested >= 200,
    progress: s => ({ current: Math.min(s.harvested, 200), total: 200 }),
  },

  // ── Коллекционные ─────────────────────────────────────────────────
  {
    id: 'diversity',emoji: '🌈', name: 'Ботаническое разнообразие', rarity: 'rare',
    desc: '5 видов растений',
    check: s => s.types >= 5,
    progress: s => ({ current: Math.min(s.types, 5), total: 5 }),
  },
  {
    id: 'collector',emoji: '🧬', name: 'Коллекционер семян',        rarity: 'epic',
    desc: '15 видов растений',
    check: s => s.types >= 15,
    progress: s => ({ current: Math.min(s.types, 15), total: 15 }),
  },

  // ── Теплицы ───────────────────────────────────────────────────────
  {
    id: 'first_gh', emoji: '🪵', name: 'Своя грядка',     rarity: 'common',
    desc: 'Создайте первую теплицу',
    check: s => s.greenhouses >= 1,
  },
  {
    id: 'cozy',     emoji: '🏠', name: 'Уютный уголок',   rarity: 'common',
    desc: '2 теплицы',
    check: s => s.greenhouses >= 2,
    progress: s => ({ current: Math.min(s.greenhouses, 2), total: 2 }),
  },
  {
    id: 'empire',   emoji: '🏰', name: 'Империя урожая',  rarity: 'epic',
    desc: '5 теплиц',
    check: s => s.greenhouses >= 5,
    progress: s => ({ current: Math.min(s.greenhouses, 5), total: 5 }),
  },

  // ── Серии ─────────────────────────────────────────────────────────
  {
    id: 'week',     emoji: '📆', name: '7 дней на грядке',rarity: 'rare',
    desc: 'Заходите 7 дней подряд',
    check: s => s.streak >= 7,
    progress: s => ({ current: Math.min(s.streak, 7), total: 7 }),
  },
  {
    id: 'nodays',   emoji: '🔥', name: 'Без выходных',    rarity: 'legendary',
    desc: '30 дней активности подряд',
    check: s => s.streak >= 30,
    progress: s => ({ current: Math.min(s.streak, 30), total: 30 }),
  },
  {
    id: 'morning',  emoji: '☀️', name: 'Солнечный режим', rarity: 'rare',
    desc: 'Открывайте приложение утром 7 дней подряд',
    check: s => s.morningStreak >= 7,
    progress: s => ({ current: Math.min(s.morningStreak, 7), total: 7 }),
  },

  // ── Секретные ─────────────────────────────────────────────────────
  {
    id: 'night',    emoji: '🌚', name: 'Ночной агроном',  rarity: 'secret',
    desc: 'Зайдите в приложение после 2:00 ночи',
    check: s => s.nightVisit,
  },
  {
    id: 'fullmoon', emoji: '🌕', name: 'Лунный огородник',rarity: 'secret',
    desc: 'Откройте приложение в полнолуние',
    check: s => s.fullMoonVisit,
  },
  {
    id: 'winter',   emoji: '❄️', name: 'Зимний фермер',   rarity: 'secret',
    desc: 'Посадите растение зимой',
    check: s => s.hasWinterPlant,
  },
]

export function getEarnedIds(stats) {
  return ACHIEVEMENTS.filter(a => a.check(stats)).map(a => a.id)
}

// Цвета по редкости
export const RARITY = {
  common:    { label: 'Обычное',    border: 'border-gray-200',   bg: 'bg-white',       text: 'text-gray-400'   },
  rare:      { label: 'Редкое',     border: 'border-blue-200',   bg: 'bg-blue-50',     text: 'text-blue-400'   },
  epic:      { label: 'Эпическое',  border: 'border-purple-200', bg: 'bg-purple-50',   text: 'text-purple-400' },
  legendary: { label: 'Легендарное',border: 'border-amber-300',  bg: 'bg-amber-50',    text: 'text-amber-500'  },
  secret:    { label: 'Секретное',  border: 'border-indigo-200', bg: 'bg-indigo-50',   text: 'text-indigo-400' },
}
