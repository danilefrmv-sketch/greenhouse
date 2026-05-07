import { scheduleSync } from './firestoreSync'

const PROFILE_KEY = 'gh-profile'

const DEFAULT = { name: '', avatar: '🧑‍🌾', seenAchievements: [] }

export function loadProfile() {
  try {
    const raw    = localStorage.getItem(PROFILE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return {
      ...DEFAULT,
      ...parsed,
      seenAchievements: Array.isArray(parsed.seenAchievements) ? parsed.seenAchievements : [],
    }
  } catch {
    return { ...DEFAULT }
  }
}

export function saveProfile(profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
    scheduleSync()
  } catch {}
}
