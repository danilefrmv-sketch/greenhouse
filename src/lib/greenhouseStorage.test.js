import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadMeta, saveMeta,
  loadPlants, savePlants,
  clearGreenhouse,
  applyAddPlant,
  applyMovePlant,
  applyHarvestPlant,
  applyUpdatePlant,
} from './greenhouseStorage'

const ID = 'test-gh-1'

const PLANT = (overrides = {}) => ({
  id: 'p1', bedIndex: 0, row: 0, col: 0,
  plantType: 'Томат', plantName: 'Черри', emoji: '🍅', plantedAt: '2025-04-15',
  ...overrides,
})

beforeEach(() => {
  localStorage.clear()
})

// ── Storage: meta ────────────────────────────────────────────────────────

describe('loadMeta', () => {
  it('returns defaults when nothing stored', () => {
    const defaults = { name: 'Теплица', description: '', type: 'polycarbonate' }
    expect(loadMeta(ID, defaults)).toEqual(defaults)
  })

  it('merges stored values over defaults', () => {
    saveMeta(ID, { name: 'Новая теплица', type: 'glass' })
    const result = loadMeta(ID, { name: 'Old', description: 'desc', type: 'polycarbonate' })
    expect(result.name).toBe('Новая теплица')
    expect(result.type).toBe('glass')
    expect(result.description).toBe('desc') // kept from defaults
  })

  it('roundtrips name, description, type', () => {
    const meta = { name: '🌿 Огурцы', description: 'Только огурцы', type: 'film' }
    saveMeta(ID, meta)
    expect(loadMeta(ID, {})).toMatchObject(meta)
  })

  it('returns defaults on corrupt JSON', () => {
    localStorage.setItem(`gh-meta-${ID}`, 'not-json')
    const defaults = { name: 'X' }
    expect(loadMeta(ID, defaults)).toEqual(defaults)
  })
})

// ── Storage: plants ──────────────────────────────────────────────────────

describe('loadPlants', () => {
  it('returns defaults when nothing stored', () => {
    const defaults = [PLANT()]
    expect(loadPlants(ID, defaults)).toEqual(defaults)
  })

  it('roundtrips full plant array', () => {
    const plants = [
      PLANT({ id: 'p1' }),
      PLANT({ id: 'p2', bedIndex: 1, row: 2, col: 1, plantType: 'Огурец', plantName: 'Нежинский' }),
    ]
    savePlants(ID, plants)
    expect(loadPlants(ID, [])).toEqual(plants)
  })

  it('persists harvested flag and harvestedAt', () => {
    const plants = [PLANT({ harvested: true, harvestedAt: '2025-09-01' })]
    savePlants(ID, plants)
    const loaded = loadPlants(ID, [])
    expect(loaded[0].harvested).toBe(true)
    expect(loaded[0].harvestedAt).toBe('2025-09-01')
  })

  it('persists exact cell coordinates (bedIndex, row, col)', () => {
    const plants = [PLANT({ bedIndex: 1, row: 3, col: 1 })]
    savePlants(ID, plants)
    const loaded = loadPlants(ID, [])
    expect(loaded[0]).toMatchObject({ bedIndex: 1, row: 3, col: 1 })
  })

  it('returns defaults on corrupt JSON', () => {
    localStorage.setItem(`gh-plants-${ID}`, '{bad}')
    expect(loadPlants(ID, [])).toEqual([])
  })
})

describe('clearGreenhouse', () => {
  it('removes both meta and plants', () => {
    saveMeta(ID, { name: 'X' })
    savePlants(ID, [PLANT()])
    clearGreenhouse(ID)
    expect(localStorage.getItem(`gh-meta-${ID}`)).toBeNull()
    expect(localStorage.getItem(`gh-plants-${ID}`)).toBeNull()
  })
})

// ── Pure reducers ────────────────────────────────────────────────────────

describe('applyAddPlant', () => {
  it('appends a new plant to the array', () => {
    const prev = [PLANT({ id: 'p1' })]
    const newPlant = PLANT({ id: 'p2', row: 1, col: 0 })
    const result = applyAddPlant(prev, newPlant)
    expect(result).toHaveLength(2)
    expect(result[1]).toEqual(newPlant)
  })

  it('does not mutate the original array', () => {
    const prev = [PLANT()]
    applyAddPlant(prev, PLANT({ id: 'p2' }))
    expect(prev).toHaveLength(1)
  })

  it('plant lands at the specified cell', () => {
    const newPlant = PLANT({ id: 'px', bedIndex: 1, row: 4, col: 1 })
    const [added] = applyAddPlant([], newPlant)
    expect(added).toMatchObject({ bedIndex: 1, row: 4, col: 1 })
  })
})

describe('applyMovePlant', () => {
  it('moves a plant to an empty cell', () => {
    const plants = [PLANT({ id: 'p1', bedIndex: 0, row: 0, col: 0 })]
    const result = applyMovePlant(plants,
      { bedIndex: 0, row: 0, col: 0 },
      { bedIndex: 0, row: 2, col: 1 }
    )
    expect(result[0]).toMatchObject({ id: 'p1', bedIndex: 0, row: 2, col: 1 })
  })

  it('swaps two plants', () => {
    const plants = [
      PLANT({ id: 'p1', bedIndex: 0, row: 0, col: 0 }),
      PLANT({ id: 'p2', bedIndex: 0, row: 1, col: 1 }),
    ]
    const result = applyMovePlant(plants,
      { bedIndex: 0, row: 0, col: 0 },
      { bedIndex: 0, row: 1, col: 1 }
    )
    const p1 = result.find(p => p.id === 'p1')
    const p2 = result.find(p => p.id === 'p2')
    expect(p1).toMatchObject({ row: 1, col: 1 })
    expect(p2).toMatchObject({ row: 0, col: 0 })
  })

  it('moves across beds', () => {
    const plants = [PLANT({ id: 'p1', bedIndex: 0, row: 0, col: 0 })]
    const result = applyMovePlant(plants,
      { bedIndex: 0, row: 0, col: 0 },
      { bedIndex: 1, row: 3, col: 1 }
    )
    expect(result[0]).toMatchObject({ id: 'p1', bedIndex: 1, row: 3, col: 1 })
  })

  it('returns original array if source cell is empty', () => {
    const plants = [PLANT({ id: 'p1', bedIndex: 0, row: 0, col: 0 })]
    const result = applyMovePlant(plants,
      { bedIndex: 1, row: 5, col: 0 },
      { bedIndex: 0, row: 0, col: 0 }
    )
    expect(result).toBe(plants)
  })

  it('does not mutate the original array', () => {
    const plants = [PLANT()]
    const orig = { ...plants[0] }
    applyMovePlant(plants, { bedIndex: 0, row: 0, col: 0 }, { bedIndex: 1, row: 1, col: 0 })
    expect(plants[0]).toMatchObject(orig)
  })
})

describe('applyHarvestPlant', () => {
  it('sets harvested:true on the target plant', () => {
    const plants = [PLANT({ id: 'p1' }), PLANT({ id: 'p2', row: 1 })]
    const result = applyHarvestPlant(plants, 'p1')
    expect(result.find(p => p.id === 'p1').harvested).toBe(true)
    expect(result.find(p => p.id === 'p2').harvested).toBeUndefined()
  })

  it('sets harvestedAt to today', () => {
    const today = new Date().toISOString().split('T')[0]
    const result = applyHarvestPlant([PLANT({ id: 'p1' })], 'p1')
    expect(result[0].harvestedAt).toBe(today)
  })

  it('does not remove plant from array (archive semantics)', () => {
    const plants = [PLANT({ id: 'p1' })]
    const result = applyHarvestPlant(plants, 'p1')
    expect(result).toHaveLength(1)
  })

  it('does not mutate original plant objects', () => {
    const plant = PLANT({ id: 'p1' })
    applyHarvestPlant([plant], 'p1')
    expect(plant.harvested).toBeUndefined()
  })
})

describe('applyUpdatePlant', () => {
  it('replaces the matching plant by id', () => {
    const plants = [PLANT({ id: 'p1', plantName: 'Черри' }), PLANT({ id: 'p2', row: 1 })]
    const updated = { ...plants[0], plantName: 'Бычье сердце', rating: 5 }
    const result = applyUpdatePlant(plants, updated)
    expect(result.find(p => p.id === 'p1').plantName).toBe('Бычье сердце')
    expect(result.find(p => p.id === 'p1').rating).toBe(5)
    expect(result.find(p => p.id === 'p2')).toEqual(plants[1])
  })

  it('preserves cell coordinates on update', () => {
    const plant = PLANT({ id: 'p1', bedIndex: 1, row: 3, col: 1 })
    const updated = { ...plant, plantName: 'Новый сорт' }
    const [result] = applyUpdatePlant([plant], updated)
    expect(result).toMatchObject({ bedIndex: 1, row: 3, col: 1 })
  })

  it('does not mutate original array', () => {
    const plants = [PLANT({ id: 'p1' })]
    const updated = { ...plants[0], plantName: 'X' }
    applyUpdatePlant(plants, updated)
    expect(plants[0].plantName).toBe('Черри')
  })
})

// ── Full round-trip scenario ─────────────────────────────────────────────

describe('full persistence scenario', () => {
  it('survives: add → move → edit → harvest → reload', () => {
    // Step 1: add a plant
    let plants = applyAddPlant([], PLANT({ id: 'p1', bedIndex: 0, row: 0, col: 0 }))
    savePlants(ID, plants)

    // Step 2: move it
    plants = applyMovePlant(plants,
      { bedIndex: 0, row: 0, col: 0 },
      { bedIndex: 1, row: 2, col: 1 }
    )
    savePlants(ID, plants)

    // Step 3: edit the plant (add rating)
    const editedPlant = { ...plants[0], plantName: 'Обновлённый сорт', rating: 4 }
    plants = applyUpdatePlant(plants, editedPlant)
    savePlants(ID, plants)

    // Step 4: harvest it
    plants = applyHarvestPlant(plants, 'p1')
    savePlants(ID, plants)

    // Step 5: simulate page reload — load from localStorage
    const loaded = loadPlants(ID, [])

    expect(loaded).toHaveLength(1)
    const p = loaded[0]
    expect(p.id).toBe('p1')
    expect(p.bedIndex).toBe(1)
    expect(p.row).toBe(2)
    expect(p.col).toBe(1)
    expect(p.plantName).toBe('Обновлённый сорт')
    expect(p.rating).toBe(4)
    expect(p.harvested).toBe(true)
    expect(p.harvestedAt).toBe(new Date().toISOString().split('T')[0])
  })

  it('survives: rename greenhouse → reload', () => {
    const original = { name: 'Старое название', description: 'desc', type: 'polycarbonate' }
    saveMeta(ID, original)

    const updated = { name: 'Новое название', description: 'Обновлено', type: 'glass' }
    saveMeta(ID, updated)

    const loaded = loadMeta(ID, {})
    expect(loaded).toMatchObject(updated)
  })

  it('multiple plants — each persists at its own cell', () => {
    const plants = [
      PLANT({ id: 'p1', bedIndex: 0, row: 0, col: 0 }),
      PLANT({ id: 'p2', bedIndex: 0, row: 1, col: 1 }),
      PLANT({ id: 'p3', bedIndex: 1, row: 3, col: 0 }),
    ]
    savePlants(ID, plants)
    const loaded = loadPlants(ID, [])

    expect(loaded).toHaveLength(3)
    expect(loaded.find(p => p.id === 'p1')).toMatchObject({ bedIndex: 0, row: 0, col: 0 })
    expect(loaded.find(p => p.id === 'p2')).toMatchObject({ bedIndex: 0, row: 1, col: 1 })
    expect(loaded.find(p => p.id === 'p3')).toMatchObject({ bedIndex: 1, row: 3, col: 0 })
  })

  it('swap persists — both plants at new positions after reload', () => {
    let plants = [
      PLANT({ id: 'p1', bedIndex: 0, row: 0, col: 0 }),
      PLANT({ id: 'p2', bedIndex: 0, row: 2, col: 1 }),
    ]
    plants = applyMovePlant(plants,
      { bedIndex: 0, row: 0, col: 0 },
      { bedIndex: 0, row: 2, col: 1 }
    )
    savePlants(ID, plants)

    const loaded = loadPlants(ID, [])
    expect(loaded.find(p => p.id === 'p1')).toMatchObject({ row: 2, col: 1 })
    expect(loaded.find(p => p.id === 'p2')).toMatchObject({ row: 0, col: 0 })
  })
})
