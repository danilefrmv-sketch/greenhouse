import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore'
import { app, auth } from './firebase'

const db = getFirestore(app)

let syncTimer = null

// ── Собираем весь localStorage в один объект ──────────────────────────
function snapshot() {
  const result = { plants: {}, meta: {} }
  try { result.profile = JSON.parse(localStorage.getItem('gh-profile')) } catch {}
  try { result.visits  = JSON.parse(localStorage.getItem('gh-visits'))  } catch {}
  try { result.ghList  = JSON.parse(localStorage.getItem('gh-list'))    } catch {}

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    try {
      if (key?.startsWith('gh-plants-')) {
        result.plants[key.slice('gh-plants-'.length)] = JSON.parse(localStorage.getItem(key))
      } else if (key?.startsWith('gh-meta-')) {
        result.meta[key.slice('gh-meta-'.length)] = JSON.parse(localStorage.getItem(key))
      }
    } catch {}
  }
  return result
}

// ── Записываем в Firestore с дебаунсом 1.5с ──────────────────────────
export function scheduleSync() {
  const uid = auth.currentUser?.uid
  if (!uid) return
  clearTimeout(syncTimer)
  syncTimer = setTimeout(async () => {
    try { await setDoc(doc(db, 'users', uid), snapshot()) } catch (e) {
      console.warn('Firestore sync error:', e)
    }
  }, 1500)
}

// ── Загружаем из Firestore → localStorage ─────────────────────────────
export async function syncDown(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid))
    if (!snap.exists()) return false

    const d = snap.data()
    if (d.profile) localStorage.setItem('gh-profile', JSON.stringify(d.profile))
    if (d.visits)  localStorage.setItem('gh-visits',  JSON.stringify(d.visits))
    if (d.ghList)  localStorage.setItem('gh-list',    JSON.stringify(d.ghList))

    Object.entries(d.plants ?? {}).forEach(([id, v]) =>
      localStorage.setItem(`gh-plants-${id}`, JSON.stringify(v)))
    Object.entries(d.meta ?? {}).forEach(([id, v]) =>
      localStorage.setItem(`gh-meta-${id}`, JSON.stringify(v)))

    return true
  } catch (e) {
    console.warn('Firestore syncDown error:', e)
    return false
  }
}

// ── Первый вход: заливаем существующий localStorage → Firestore ───────
export async function syncUp(uid) {
  try { await setDoc(doc(db, 'users', uid), snapshot()) } catch (e) {
    console.warn('Firestore syncUp error:', e)
  }
}
