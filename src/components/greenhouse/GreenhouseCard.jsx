import { useNavigate } from 'react-router-dom'

function plantDeclension(n) {
  if (n % 10 === 1 && n % 100 !== 11) return 'посадка'
  if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return 'посадки'
  return 'посадок'
}

function bedDeclension(n) {
  if (n % 10 === 1 && n % 100 !== 11) return 'грядка'
  if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return 'грядки'
  return 'грядок'
}

export default function GreenhouseCard({ greenhouse }) {
  const navigate = useNavigate()
  const { id, name, description, numBeds, plants = [] } = greenhouse

  return (
    <div
      className="card card-hover cursor-pointer flex flex-col overflow-hidden min-h-[110px]"
      onClick={() => navigate(`/greenhouse/${id}`)}
    >
      <div className="p-5 flex flex-col flex-1 gap-2">
        <h3 className="font-semibold text-gray-900 text-base leading-tight">{name}</h3>
        {/* Резервируем место под описание чтобы все карточки были одной высоты */}
        <div className="flex-1 min-h-[2.5rem]">
          {description && (
            <p className="text-sm text-gray-500 line-clamp-2">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
            {plants.length} {plantDeclension(plants.length)}
          </span>
          <span>{numBeds} {bedDeclension(numBeds)}</span>
        </div>
      </div>
    </div>
  )
}
