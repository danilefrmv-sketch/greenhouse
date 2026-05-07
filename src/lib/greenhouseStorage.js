import { scheduleSync } from './firestoreSync'

const metaKey   = id => `gh-meta-${id}`
const plantsKey = id => `gh-plants-${id}`
const GH_LIST_KEY = 'gh-list'

// ── Список теплиц (персистентный) ─────────────────────────────────────

export function loadGreenhouseList() {
  try {
    const raw = localStorage.getItem(GH_LIST_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function saveGreenhouseList(list) {
  localStorage.setItem(GH_LIST_KEY, JSON.stringify(list))
  scheduleSync()
}

export function addToGreenhouseList(gh) {
  const current = loadGreenhouseList() || []
  if (current.find(g => g.id === gh.id)) return
  saveGreenhouseList([...current, gh])
}

export function removeFromGreenhouseList(id) {
  const current = loadGreenhouseList() || []
  saveGreenhouseList(current.filter(g => g.id !== id))
}

// ── Storage ────────────────────────────────────────────────────────────

export function loadMeta(id, defaults) {
  try {
    const raw = localStorage.getItem(metaKey(id))
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults
  } catch { return defaults }
}

export function saveMeta(id, meta) {
  localStorage.setItem(metaKey(id), JSON.stringify(meta))
  scheduleSync()
}

export function loadPlants(id, defaults) {
  try {
    const raw = localStorage.getItem(plantsKey(id))
    return raw ? JSON.parse(raw) : defaults
  } catch { return defaults }
}

export function savePlants(id, plants) {
  localStorage.setItem(plantsKey(id), JSON.stringify(plants))
  scheduleSync()
}

export function clearGreenhouse(id) {
  localStorage.removeItem(metaKey(id))
  localStorage.removeItem(plantsKey(id))
  scheduleSync()
}

// ── Pure plant reducers (used by GreenhousePage + tests) ───────────────

export function applyAddPlant(plants, newPlant) {
  return [...plants, newPlant]
}

export function applyMovePlant(plants, from, to) {
  const fromPlant = plants.find(p => p.bedIndex === from.bedIndex && p.row === from.row && p.col === from.col)
  const toPlant   = plants.find(p => p.bedIndex === to.bedIndex   && p.row === to.row   && p.col === to.col)
  if (!fromPlant) return plants
  return plants.map(p => {
    if (p === fromPlant) return { ...p, bedIndex: to.bedIndex, row: to.row, col: to.col }
    if (toPlant && p === toPlant) return { ...p, bedIndex: from.bedIndex, row: from.row, col: from.col }
    return p
  })
}

export function applyHarvestPlant(plants, plantId) {
  const today = new Date().toISOString().split('T')[0]
  return plants.map(p => p.id === plantId ? { ...p, harvested: true, harvestedAt: today } : p)
}

export function applyUpdatePlant(plants, updated) {
  return plants.map(p => p.id === updated.id ? updated : p)
}
