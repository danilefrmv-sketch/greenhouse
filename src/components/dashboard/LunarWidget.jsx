// ─── LunarWidget ──────────────────────────────────────────────────────

import { useState } from 'react'
import Drawer from '../ui/Drawer'

// ── Астрономический расчёт ────────────────────────────────────────────
const KNOWN_NEW_MOON = new Date('2000-01-06T18:14:00Z')
const SYNODIC        = 29.530588853

function moonAge(date) {
  const days = (date.getTime() - KNOWN_NEW_MOON.getTime()) / 86_400_000
  return ((days % SYNODIC) + SYNODIC) % SYNODIC
}

// ── 8 фаз ─────────────────────────────────────────────────────────────
const PHASES = [
  {
    id: 'new', emoji: '🌑', name: 'Новолуние', rating: 'bad', labelClass: 'text-rose-400',
    tip: 'День отдыха — воздержитесь от посевов и посадок.',
    guide: ['❌ Не сажать, не пересаживать, не прививать', '✅ Прополка, рыхление', '✅ Борьба с вредителями', '✅ Сбор урожая для хранения'],
    desc: 'Переломный момент. Сокодвижение ослаблено, растения плохо приживаются и хуже переносят травмы.',
  },
  {
    id: 'waxing_crescent', emoji: '🌒', name: 'Молодая луна', rating: 'good', labelClass: 'text-emerald-500',
    tip: 'Сажайте томаты, огурцы, перцы, зелень — всё, что растёт над землёй.',
    guide: ['✅ Надземные культуры (томаты, огурцы, перцы, кабачки)', '✅ Зелень и пряные травы', '✅ Черенкование и рассада', '✅ Прививки и внекорневые подкормки', '⚠️ Корнеплоды — не лучшее время'],
    desc: 'Соки активно поднимаются к надземным частям. Черенки и саженцы хорошо приживаются.',
  },
  {
    id: 'first_quarter', emoji: '🌓', name: '1-я четверть', rating: 'good', labelClass: 'text-emerald-500',
    tip: 'Благоприятно для любых посадок, особенно листовых культур.',
    guide: ['✅ Любые культуры', '✅ Особенно хороши листовые овощи и зелень', '✅ Прививки, черенкование', '✅ Полив и подкормки'],
    desc: 'Активный рост. Переходный момент — благоприятен для всего.',
  },
  {
    id: 'waxing_gibbous', emoji: '🌔', name: 'Растущая луна', rating: 'good', labelClass: 'text-emerald-500',
    tip: 'Надземные культуры, внекорневые подкормки, прививки.',
    guide: ['✅ Надземные культуры', '✅ Внекорневые подкормки', '✅ Прививки и окулировка', '✅ Полив (влага хорошо усваивается)', '⚠️ Корнеплоды — не трогать'],
    desc: 'Луна прибывает — соки движутся к листьям, цветам и плодам.',
  },
  {
    id: 'full', emoji: '🌕', name: 'Полнолуние', rating: 'bad', labelClass: 'text-rose-400',
    tip: 'День отдыха — не сажайте, не пересаживайте, избегайте обрезки.',
    guide: ['❌ Не сажать и не пересаживать', '❌ Не обрезать (раны долго заживают)', '✅ Прополка, пасынкование', '✅ Сбор урожая — максимум сока в плодах'],
    desc: 'Растения насыщены влагой, легко травмируются. Зато урожай в полнолуние — самый сочный.',
  },
  {
    id: 'waning_gibbous', emoji: '🌖', name: 'Убывающая луна', rating: 'good', labelClass: 'text-emerald-500',
    tip: 'Идеально для корнеплодов, луковичных и обрезки деревьев.',
    guide: ['✅ Корнеплоды (картофель, морковь, свёкла, редис)', '✅ Луковичные цветы', '✅ Обрезка деревьев и кустарников', '✅ Корневые подкормки и улучшение почвы'],
    desc: 'Луна убывает — соки уходят вниз, к корням. Лучшее время для всего, что растёт в земле.',
  },
  {
    id: 'last_quarter', emoji: '🌗', name: '3-я четверть', rating: 'neutral', labelClass: 'text-amber-500',
    tip: 'Корнеплоды, обрезка, борьба с вредителями.',
    guide: ['✅ Корнеплоды и луковичные', '✅ Обрезка, прополка', '✅ Борьба с вредителями', '⚠️ Надземные культуры — менее благоприятно'],
    desc: 'Переходный момент убывающей луны. Хорошо для работы с почвой и корневой системой.',
  },
  {
    id: 'waning_crescent', emoji: '🌘', name: 'Старая луна', rating: 'neutral', labelClass: 'text-amber-500',
    tip: 'Прополка, обработка от вредителей, посев корнеплодов.',
    guide: ['✅ Посев корнеплодов', '✅ Прополка и борьба с сорняками', '✅ Обработка от вредителей', '⚠️ Ближе к новолунию — снижайте активность'],
    desc: 'Убывающий серп — луна готовится к новому циклу. Неспешные работы с почвой.',
  },
]

function getPhase(date) {
  const age = moonAge(date)
  if (age < 1 || age >= 28.5) return PHASES[0]
  if (age < 7.4)              return PHASES[1]
  if (age < 8.4)              return PHASES[2]
  if (age < 13.8)             return PHASES[3]
  if (age < 15.8)             return PHASES[4]
  if (age < 22.1)             return PHASES[5]
  if (age < 23.1)             return PHASES[6]
  return PHASES[7]
}

const DAYS_RU   = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
const MONTHS_RU = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']

function dayLabel(date, i) {
  if (i === 0) return 'Сегодня'
  if (i === 1) return 'Завтра'
  return `${DAYS_RU[date.getDay()]}, ${date.getDate()} ${MONTHS_RU[date.getMonth()]}`
}

// ── Lunar Drawer ──────────────────────────────────────────────────────
const RATING_LABEL = { good: 'Благоприятно', bad: 'День отдыха', neutral: 'Нейтрально' }
const RATING_COLOR = { good: 'text-emerald-600 bg-emerald-50', bad: 'text-rose-500 bg-rose-50', neutral: 'text-amber-500 bg-amber-50' }

function LunarDrawer({ open, onClose }) {
  const today = new Date()
  const currentPhase = getPhase(today)

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Лунный посевной календарь"
      subtitle="Рекомендации для огородников по фазам"
      width={420}
    >
      {/* Текущая фаза */}
      <div className="px-6 py-4 border-b border-gray-100">
        <p className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">Сегодня</p>
        <div className="flex items-start gap-4 bg-gray-50 rounded-2xl p-4">
          <span className="text-4xl leading-none">{currentPhase.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-sm font-semibold text-gray-900">{currentPhase.name}</span>
              <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${RATING_COLOR[currentPhase.rating]}`}>
                {RATING_LABEL[currentPhase.rating]}
              </span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">{currentPhase.tip}</p>
          </div>
        </div>
      </div>

      {/* Все фазы */}
      <div className="px-6 py-5 flex flex-col gap-5">
        <p className="text-sm font-semibold uppercase tracking-wider text-gray-400">Все фазы</p>
        {PHASES.map(phase => (
          <div key={phase.id}
            className={`flex gap-3 pb-5 border-b border-gray-100 last:border-0 last:pb-0 ${phase.id === currentPhase.id ? 'opacity-100' : 'opacity-70'}`}>
            <span className="text-2xl leading-none mt-0.5 shrink-0">{phase.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-sm font-semibold text-gray-900">{phase.name}</span>
                <span className={`text-sm font-medium px-1.5 py-0.5 rounded-full ${RATING_COLOR[phase.rating]}`}>
                  {RATING_LABEL[phase.rating]}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-2 leading-relaxed">{phase.desc}</p>
              <ul className="flex flex-col gap-0.5">
                {phase.guide.map((g, i) => <li key={i} className="text-sm text-gray-600">{g}</li>)}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </Drawer>
  )
}

// ── Тултип на hover ───────────────────────────────────────────────────
function DayCard({ date, phase, label }) {
  const [hover, setHover] = useState(false)

  return (
    <div
      className="relative flex-1 flex flex-col items-center py-2 px-1 cursor-default"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* фиксированная высота метки дня — совпадает с погодой */}
      <div className="h-5 flex items-center justify-center mb-1">
        <span className="text-sm text-gray-500 font-medium text-center leading-none">{label}</span>
      </div>
      <span className="text-3xl my-1">{phase.emoji}</span>
      {/* фиксированная высота названия фазы */}
      <div className="h-8 flex items-start justify-center mt-1">
        <span className="text-sm text-gray-400 text-center leading-tight">{phase.name}</span>
      </div>

      {/* Тултип */}
      {hover && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20
          bg-gray-900 text-white text-sm leading-snug rounded-xl px-3 py-2
          whitespace-normal text-center max-w-[280px] pointer-events-none shadow-lg">
          {phase.tip}
          {/* стрелка */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  )
}

// ─── Основной компонент ───────────────────────────────────────────────
export default function LunarWidget() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  const today = new Date()
  today.setHours(12, 0, 0, 0)

  const days = [0, 1, 2].map(n => {
    const date = new Date(today)
    date.setDate(date.getDate() + n)
    return { date, phase: getPhase(date), label: dayLabel(date, n) }
  })

  return (
    <>
      <div className="card p-5 cursor-pointer group" onClick={() => setDrawerOpen(true)}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Лунный календарь
          </span>
          <span className="w-6 h-6 flex items-center justify-center rounded-full border border-gray-200 group-hover:border-gray-400 text-gray-400 group-hover:text-gray-700 transition-colors text-xs font-semibold">
            ?
          </span>
        </div>

        <div className="flex gap-2">
          {days.map(d => (
            <DayCard key={d.date.toDateString()} {...d} />
          ))}
        </div>
      </div>

      <LunarDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}
