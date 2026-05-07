import { useState, useEffect, useRef } from 'react'

const WMO = {
  0:  { icon: '☀️',  desc: 'Ясно' },
  1:  { icon: '🌤️', desc: 'Почти ясно' },
  2:  { icon: '⛅',  desc: 'Переменная облачность' },
  3:  { icon: '☁️',  desc: 'Пасмурно' },
  45: { icon: '🌫️', desc: 'Туман' },
  48: { icon: '🌫️', desc: 'Туман' },
  51: { icon: '🌦️', desc: 'Морось' },
  53: { icon: '🌦️', desc: 'Морось' },
  55: { icon: '🌦️', desc: 'Сильная морось' },
  61: { icon: '🌧️', desc: 'Дождь' },
  63: { icon: '🌧️', desc: 'Умеренный дождь' },
  65: { icon: '🌧️', desc: 'Сильный дождь' },
  71: { icon: '🌨️', desc: 'Снег' },
  73: { icon: '🌨️', desc: 'Умеренный снег' },
  75: { icon: '🌨️', desc: 'Сильный снег' },
  77: { icon: '🌨️', desc: 'Снежная крупа' },
  80: { icon: '🌦️', desc: 'Ливень' },
  81: { icon: '🌦️', desc: 'Ливень' },
  82: { icon: '⛈️',  desc: 'Сильный ливень' },
  85: { icon: '🌨️', desc: 'Снегопад' },
  86: { icon: '🌨️', desc: 'Сильный снегопад' },
  95: { icon: '⛈️',  desc: 'Гроза' },
  96: { icon: '⛈️',  desc: 'Гроза с градом' },
  99: { icon: '⛈️',  desc: 'Гроза с градом' },
}

const DAYS   = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
const MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
const LOCATION_KEY = 'weather-location'

function dayLabel(dateStr, index) {
  if (index === 0) return 'Сегодня'
  if (index === 1) return 'Завтра'
  const d = new Date(dateStr)
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`
}

async function fetchWeather(lat, lon) {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&forecast_days=3`
  )
  if (!res.ok) throw new Error('failed')
  return res.json()
}

async function geocodeCity(name) {
  const res  = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=ru&format=json`
  )
  const data = await res.json()
  if (!data.results?.length) throw new Error('not found')
  const { latitude: lat, longitude: lon, name: city } = data.results[0]
  return { lat, lon, city }
}

async function reverseGeocode(lat, lon) {
  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`,
      { headers: { 'Accept-Language': 'ru' } }
    )
    const data = await res.json()
    return data.address?.city || data.address?.town || data.address?.village || null
  } catch { return null }
}

async function ipGeolocate() {
  try {
    const res  = await fetch('https://ipapi.co/json/')
    const data = await res.json()
    if (data.latitude && data.longitude) {
      return { lat: data.latitude, lon: data.longitude, city: data.city || null }
    }
  } catch {}
  return { lat: 55.03, lon: 82.92, city: 'Новосибирск' }
}

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(LOCATION_KEY)) } catch { return null }
}

function Skeleton() {
  return (
    <div className="card p-5 flex flex-col gap-4 animate-pulse">
      <div className="h-3 w-20 bg-gray-100 rounded-full" />
      <div className="flex gap-4">
        {[0,1,2].map(i => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <div className="h-2 w-12 bg-gray-100 rounded-full" />
            <div className="h-8 w-8 bg-gray-100 rounded-full" />
            <div className="h-3 w-10 bg-gray-100 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function WeatherWidget() {
  const [state,       setState]       = useState({ status: 'loading', data: null, city: null })
  const [editing,     setEditing]     = useState(false)
  const [inputValue,  setInputValue]  = useState('')
  const [searchError, setSearchError] = useState(false)
  const [searching,   setSearching]   = useState(false)
  const inputRef = useRef(null)

  function loadCoords(lat, lon, city) {
    fetchWeather(lat, lon)
      .then(data => setState({ status: 'ok', data, city }))
      .catch(()  => setState({ status: 'error' }))
  }

  function detectGeo() {
    setState(s => ({ ...s, status: 'loading' }))
    localStorage.removeItem(LOCATION_KEY)
    if (!navigator.geolocation) {
      reverseGeocode(55.75, 37.62).then(c => loadCoords(55.75, 37.62, c || 'Москва'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lon } = pos.coords
        reverseGeocode(lat, lon).then(c => loadCoords(lat, lon, c))
      },
      () => reverseGeocode(55.75, 37.62).then(c => loadCoords(55.75, 37.62, c || 'Москва')),
      { timeout: 6000 }
    )
  }

  useEffect(() => {
    // Сразу грузим по сохранённому городу или IP — без ожидания геолокации
    const saved = loadSaved()
    if (saved) {
      loadCoords(saved.lat, saved.lon, saved.city)
    } else {
      ipGeolocate().then(({ lat, lon, city }) => loadCoords(lat, lon, city))
    }

    // Геолокация в фоне — если успеет, обновит данные
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lon } = pos.coords
        reverseGeocode(lat, lon).then(c => loadCoords(lat, lon, c))
      },
      () => {},
      { timeout: 5000, maximumAge: 600_000 }
    )
  }, [])

  useEffect(() => {
    if (editing) {
      setInputValue(state.city || '')
      setSearchError(false)
      setTimeout(() => inputRef.current?.focus(), 40)
    }
  }, [editing])

  async function handleSearch(e) {
    e.preventDefault()
    const q = inputValue.trim()
    if (!q) return
    setSearching(true); setSearchError(false)
    try {
      const { lat, lon, city } = await geocodeCity(q)
      localStorage.setItem(LOCATION_KEY, JSON.stringify({ lat, lon, city }))
      setState({ status: 'loading', data: null, city })
      setEditing(false)
      loadCoords(lat, lon, city)
    } catch {
      setSearchError(true)
    } finally {
      setSearching(false)
    }
  }

  if (state.status === 'loading') return <Skeleton />
  if (state.status === 'error')   return (
    <div className="card p-5 flex flex-col gap-2">
      <span className="text-sm font-semibold uppercase tracking-wider text-gray-400">Погода</span>
      <p className="text-sm text-gray-400">Не удалось загрузить погоду</p>
    </div>
  )

  const { daily } = state.data
  const days = daily.time.map((date, i) => ({
    date, label: dayLabel(date, i),
    max: Math.round(daily.temperature_2m_max[i]),
    min: Math.round(daily.temperature_2m_min[i]),
    code: daily.weathercode[i],
  }))

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold uppercase tracking-wider text-gray-400">Погода</span>

        {editing ? (
          <form onSubmit={handleSearch} className="flex items-center gap-1.5">
            {/* Иконка геолокации */}
            <button
              type="button"
              onClick={() => { setEditing(false); detectGeo() }}
              title="Определить по геолокации"
              className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M7 1v2M7 11v2M1 7h2M11 7h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </button>
            <input
              ref={inputRef}
              value={inputValue}
              onChange={e => { setInputValue(e.target.value); setSearchError(false) }}
              placeholder="Город…"
              className={`text-sm border rounded-lg px-2 py-1 outline-none w-28 transition-colors
                ${searchError
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200 bg-gray-50 focus:border-gray-400 focus:bg-white'}`}
            />
            <button
              type="submit"
              disabled={searching}
              className="text-sm px-2 py-1 bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-40 transition-colors"
            >
              {searching ? '…' : '→'}
            </button>
            <button type="button" onClick={() => setEditing(false)}
              className="text-xs text-gray-400 hover:text-gray-600">✕</button>
          </form>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors group"
          >
            {state.city && <span>{state.city}</span>}
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none"
              className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <path d="M11 2.5a1.5 1.5 0 0 1 2.121 2.121L5.5 12.243 2 13.5l1.257-3.5L11 2.5Z"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>

      {searchError && (
        <p className="text-xs text-red-400 mb-3 -mt-2">Город не найден</p>
      )}

      {/* 3 дня */}
      <div className="flex gap-1">
        {days.map((day, i) => {
          const wmo = WMO[day.code] ?? { icon: '🌡️', desc: '' }
          return (
            <div key={day.date} className="flex-1 flex flex-col items-center py-2 px-1">
              {/* фиксированная высота метки дня — одинакова в обоих виджетах */}
              <div className="h-5 flex items-center justify-center mb-1">
                <span className="text-sm text-gray-500 font-medium text-center leading-none">{day.label}</span>
              </div>
              <span className="text-3xl my-1">{wmo.icon}</span>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-gray-900">{day.max}°</span>
                <span className="text-sm text-gray-400">{day.min}°</span>
              </div>
              {/* фиксированная высота описания — не скачет при разном тексте */}
              <div className="h-8 flex items-start justify-center mt-1">
                <span className="text-sm text-gray-400 text-center leading-tight">{wmo.desc}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
