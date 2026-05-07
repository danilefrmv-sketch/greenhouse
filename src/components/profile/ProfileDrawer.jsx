import { useState, useEffect, useRef } from 'react'
import Drawer from '../ui/Drawer'
import { loadProfile, saveProfile } from '../../lib/profileStorage'
import { useAuth } from '../../contexts/AuthContext'
import {
  computeStats, getGrade, getNextGrade,
  ACHIEVEMENTS, getEarnedIds, RARITY,
} from '../../lib/achievements'

const AVATAR_OPTIONS = ['🧑‍🌾', '👩‍🌾', '🌱', '🌻', '🥕', '🍅', '🌿', '🧑‍🔬']

const DEFAULT_PROFILE = { name: '', avatar: '🧑‍🌾', seenAchievements: [] }

const RARITY_BAR = {
  common:    'bg-green-500',
  rare:      'bg-blue-500',
  epic:      'bg-purple-500',
  legendary: 'bg-amber-500',
  secret:    'bg-indigo-500',
}

export default function ProfileDrawer({ open, onClose }) {
  const { user, logout }  = useAuth()
  const [profile, setProfile] = useState(() => loadProfile())
  const [stats,   setStats]   = useState(() => computeStats())
  const [editingName, setEditingName] = useState(false)
  const [nameInput,   setNameInput]   = useState('')
  const nameRef = useRef(null)

  useEffect(() => {
    if (open) {
      setProfile(loadProfile())
      setStats(computeStats())
    } else {
      setEditingName(false)
    }
  }, [open])

  useEffect(() => {
    if (editingName) {
      setNameInput(profile.name)
      setTimeout(() => nameRef.current?.focus(), 50)
    }
  }, [editingName])

  const grade     = getGrade(stats.totalPlants)
  const nextGrade = getNextGrade(stats.totalPlants)
  const earnedIds = new Set(getEarnedIds(stats))

  const progressPct = nextGrade
    ? Math.min(100, ((stats.totalPlants - grade.min) / (nextGrade.min - grade.min)) * 100)
    : 100

  const saveName = () => {
    const trimmed = nameInput.trim()
    const next = { ...profile, name: trimmed }
    setProfile(next)
    saveProfile(next)
    setEditingName(false)
  }

  const pickAvatar = emoji => {
    const next = { ...profile, avatar: emoji }
    setProfile(next)
    saveProfile(next)
  }

  const handleSignOut = async () => {
    onClose()
    await logout()
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Профиль"
      footer={
        <button onClick={handleSignOut} className="btn-secondary w-full flex items-center justify-center gap-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M10 11l3-3-3-3M13 8H6"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Выйти
        </button>
      }
    >
      <div className="px-6 py-6 flex flex-col gap-6">

        {/* Avatar + Name */}
        <div className="flex flex-col items-center gap-4">
          {user?.photoURL
            ? <img src={user.photoURL} alt="avatar" className="w-16 h-16 rounded-full object-cover ring-2 ring-green-200" />
            : <div className="text-6xl leading-none">{profile.avatar}</div>
          }

          <div className="flex gap-2 flex-wrap justify-center">
            {AVATAR_OPTIONS.map(em => (
              <button
                key={em}
                onClick={() => pickAvatar(em)}
                className={`w-10 h-10 flex items-center justify-center rounded-xl text-2xl transition-all
                  ${profile.avatar === em
                    ? 'bg-green-100 ring-2 ring-green-400'
                    : 'bg-gray-50 hover:bg-gray-100'}`}
              >
                {em}
              </button>
            ))}
          </div>

          {editingName ? (
            <div className="flex items-center gap-2 w-full max-w-xs">
              <input
                ref={nameRef}
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false) }}
                onBlur={saveName}
                className="input flex-1 text-center"
                placeholder="Ваше имя"
                maxLength={30}
              />
            </div>
          ) : (
            <button onClick={() => setEditingName(true)} className="group flex items-center gap-2 text-gray-900">
              <span className="text-lg font-semibold">
                {profile.name || 'Нажмите чтобы задать имя'}
              </span>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
                className="text-gray-300 group-hover:text-gray-500 transition-colors">
                <path d="M11 2.5a1.5 1.5 0 0 1 2.121 2.121L5.5 12.243 2 13.5l1.257-3.5L11 2.5Z"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>

        {/* Grade */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Уровень</span>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold ${grade.bgClass} ${grade.colorClass}`}>
              {grade.emoji} {grade.label}
            </span>
            <span className="text-sm text-gray-400">{stats.totalPlants} посадок всего</span>
          </div>
          <div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-400 rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              {nextGrade
                ? `${stats.totalPlants} / ${nextGrade.min} посадок до «${nextGrade.label}»`
                : `${grade.emoji} Максимальный уровень достигнут`}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Теплицы',  value: stats.greenhouses },
            { label: 'Растут',   value: stats.totalPlants - stats.harvested },
            { label: 'Собрано',  value: stats.harvested },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-gray-900">{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Achievements */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Достижения</span>
            <span className="text-xs text-gray-400">{earnedIds.size} / {ACHIEVEMENTS.length}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {ACHIEVEMENTS.map(a => {
              const earned = earnedIds.has(a.id)
              const isSecret = a.rarity === 'secret'
              const r = RARITY[a.rarity]
              const prog = earned && a.progress ? a.progress(stats) : null

              if (!earned) {
                return (
                  <div key={a.id} title={isSecret ? 'Секретное достижение' : `🔒 ${a.desc}`}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl text-center bg-gray-50 border border-gray-100 opacity-40 grayscale">
                    <span className="text-2xl leading-none">{isSecret ? '🔒' : a.emoji}</span>
                    <span className="text-xs text-gray-400 leading-tight">{isSecret ? '???' : a.name}</span>
                  </div>
                )
              }

              return (
                <div key={a.id} title={a.desc}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl text-center border shadow-sm ${r.border} ${r.bg}`}>
                  <span className="text-2xl leading-none">{a.emoji}</span>
                  <span className="text-xs text-gray-700 leading-tight font-medium">{a.name}</span>
                  <span className={`text-[10px] font-semibold uppercase tracking-wide ${r.text}`}>{r.label}</span>
                  {prog && (
                    <div className="w-full mt-0.5">
                      <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${RARITY_BAR[a.rarity]}`}
                          style={{ width: `${Math.round((prog.current / prog.total) * 100)}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </Drawer>
  )
}
