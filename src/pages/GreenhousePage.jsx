import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import GreenhouseView from '../components/greenhouse/GreenhouseView'
import PlantModal from '../components/greenhouse/PlantModal'
import PlantDiaryModal from '../components/greenhouse/PlantDiaryModal'
import GreenhouseSettingsModal from '../components/greenhouse/GreenhouseSettingsModal'
import {
  loadMeta, saveMeta,
  loadPlants, savePlants,
  applyAddPlant, applyMovePlant, applyHarvestPlant, applyUpdatePlant,
  clearGreenhouse, removeFromGreenhouseList,
} from '../lib/greenhouseStorage'
import { getBase, DEMO_PLANTS_1 } from '../lib/greenhouseDefaults'

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2)

export default function GreenhousePage() {
  const navigate   = useNavigate()
  const { id }     = useParams()           // реальный id из URL

  const base       = getBase(id)           // базовые данные теплицы (name, numBeds, …)
  const demoPlants = id === '1' ? DEMO_PLANTS_1 : []

  const [meta,   setMeta]   = useState(() => loadMeta(id, base))
  const [plants, setPlants] = useState(() => loadPlants(id, demoPlants))

  const [plantModal,   setPlantModal]   = useState({ open: false, cell: null })
  const [diaryModal,   setDiaryModal]   = useState({ open: false, plant: null })
  const [settingsOpen, setSettingsOpen] = useState(false)

  const activePlants = plants.filter(p => !p.harvested)
  const greenhouse   = { id, numBeds: base.numBeds, ...meta, plants: activePlants }

  // ── Helpers ──────────────────────────────────────────────────────────

  function mutatePlants(fn) {
    setPlants(prev => {
      const next = fn(prev)
      savePlants(id, next)
      return next
    })
  }

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleCellClick = ({ bedIndex, row, col }) => {
    const plant = activePlants.find(
      p => p.bedIndex === bedIndex && p.row === row && p.col === col
    )
    if (plant) {
      setDiaryModal({ open: true, plant })
    } else {
      setPlantModal({ open: true, cell: { bedIndex, row, col } })
    }
  }

  const handlePlant = data => {
    const newPlant = { id: genId(), ...data }
    mutatePlants(prev => applyAddPlant(prev, newPlant))
  }

  const handlePlantMove = (from, to) => {
    mutatePlants(prev => applyMovePlant(prev, from, to))
  }

  const handleShiftPlantRows = (bedIndex, delta) => {
    mutatePlants(prev => prev.map(p =>
      p.bedIndex === bedIndex ? { ...p, row: Math.max(0, p.row + delta) } : p
    ))
  }

  const handleHarvestPlant = plant => {
    mutatePlants(prev => applyHarvestPlant(prev, plant.id))
  }

  const handleUpdatePlant = updated => {
    mutatePlants(prev => applyUpdatePlant(prev, updated))
    setDiaryModal(prev => ({ ...prev, plant: updated }))
  }

  const handleSaveSettings = ({ name, description, type }) => {
    const next = { ...meta, name, description, type }
    setMeta(next)
    saveMeta(id, next)
    setSettingsOpen(false)
  }

  const handleDeleteGreenhouse = () => {
    removeFromGreenhouseList(id)
    clearGreenhouse(id)
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-soil-100">

      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-3 md:px-6 h-14 md:h-14 flex items-center gap-2"
          style={{ minHeight: '56px' }}>

          {/* Back button */}
          <button
            onClick={() => navigate('/dashboard')}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors -ml-1 shrink-0"
            title="Назад"
          >
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Current page title */}
          <span className="text-base font-semibold text-gray-900 truncate min-w-0">
            {meta.name}
          </span>

          <div className="flex-1" />

          {/* Settings icon button */}
          <button
            onClick={() => setSettingsOpen(true)}
            title="Настройки теплицы"
            className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
              <path d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M13.3 6.6a1 1 0 0 0 .2-1.1l-.8-1.4a1 1 0 0 0-1-.5l-1 .2a5 5 0 0 0-.9-.5l-.2-1A1 1 0 0 0 8.7 2H7.3a1 1 0 0 0-1 .7l-.2 1a5 5 0 0 0-.9.5l-1-.2a1 1 0 0 0-1 .5L2.4 5.9a1 1 0 0 0 .2 1.1l.8.7v1l-.8.7a1 1 0 0 0-.2 1.1l.8 1.4a1 1 0 0 0 1 .5l1-.2c.3.2.6.4.9.5l.2 1a1 1 0 0 0 1 .7h1.4a1 1 0 0 0 1-.7l.2-1c.3-.1.6-.3.9-.5l1 .2a1 1 0 0 0 1-.5l.8-1.4a1 1 0 0 0-.2-1.1l-.8-.7v-1l.8-.7Z" stroke="currentColor" strokeWidth="1.4"/>
            </svg>
          </button>

        </div>
      </header>

      <main className="max-w-4xl mx-auto px-2 md:px-8 py-4 md:py-10">
        <GreenhouseView
          greenhouse={greenhouse}
          onCellClick={handleCellClick}
          onPlantMove={handlePlantMove}
          onShiftRows={handleShiftPlantRows}
        />
      </main>

      <PlantModal
        open={plantModal.open}
        cell={plantModal.cell}
        onClose={() => setPlantModal(prev => ({ ...prev, open: false }))}
        onPlant={handlePlant}
      />

      <PlantDiaryModal
        open={diaryModal.open}
        plant={diaryModal.plant}
        onClose={() => setDiaryModal(prev => ({ ...prev, open: false }))}
        onRemove={handleHarvestPlant}
        onUpdate={handleUpdatePlant}
      />

      <GreenhouseSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        greenhouse={{ id, numBeds: base.numBeds, ...meta }}
        onSave={handleSaveSettings}
        onDelete={handleDeleteGreenhouse}
      />

    </div>
  )
}
