// Базовые данные теплиц — единственный источник правды для дашборда и страницы теплицы
export const GREENHOUSE_BASES = [
  { id: '1', name: 'Основная теплица', description: '', type: 'polycarbonate', numBeds: 2 },
  { id: '2', name: 'Рассадная',        description: '', type: 'film',          numBeds: 2 },
  { id: '3', name: 'Зимняя',           description: '', type: 'glass',         numBeds: 3 },
]

// Начальные растения только для первой теплицы (демо-данные)
export const DEMO_PLANTS_1 = [
  { id: 'p1', bedIndex: 0, row: 0, col: 0, plantType: 'Томат',  plantName: 'Черри',        emoji: '🍅', plantedAt: '2025-04-15' },
  { id: 'p2', bedIndex: 0, row: 0, col: 1, plantType: 'Томат',  plantName: 'Бычье сердце', emoji: '🍅', plantedAt: '2025-04-15' },
  { id: 'p3', bedIndex: 0, row: 1, col: 0, plantType: 'Огурец', plantName: 'Нежинский',    emoji: '🥒', plantedAt: '2025-04-20' },
  { id: 'p4', bedIndex: 0, row: 2, col: 1, plantType: 'Перец',  plantName: 'Ратунда',      emoji: '🌶️', plantedAt: '2025-04-18' },
  { id: 'p5', bedIndex: 0, row: 4, col: 0, plantType: 'Огурец', plantName: 'Муромский',    emoji: '🥒', plantedAt: '2025-05-01' },
  { id: 'p6', bedIndex: 1, row: 0, col: 0, plantType: 'Томат',  plantName: 'Сливка',       emoji: '🍅', plantedAt: '2025-04-15' },
  { id: 'p7', bedIndex: 1, row: 1, col: 1, plantType: 'Перец',  plantName: 'Белозёрка',    emoji: '🌶️', plantedAt: '2025-04-18' },
  { id: 'p8', bedIndex: 1, row: 3, col: 0, plantType: 'Огурец', plantName: 'Нежинский',    emoji: '🥒', plantedAt: '2025-04-22' },
  { id: 'p9', bedIndex: 1, row: 3, col: 1, plantType: 'Огурец', plantName: 'Родничок',     emoji: '🥒', plantedAt: '2025-04-22' },
]

export const DEFAULT_META = { name: 'Теплица', description: '', type: 'polycarbonate', numBeds: 2 }

// Найти базу по id — сначала дефолтные, потом localStorage (для созданных пользователем)
export function getBase(id) {
  const builtin = GREENHOUSE_BASES.find(g => g.id === id)
  if (builtin) return builtin

  try {
    const list = JSON.parse(localStorage.getItem('gh-list')) || []
    const found = list.find(g => g.id === id)
    if (found) return { ...DEFAULT_META, ...found }
  } catch {}

  return { ...DEFAULT_META, id }
}
