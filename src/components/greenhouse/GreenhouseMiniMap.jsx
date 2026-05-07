const ROWS = 6
const COLS = 2

const mockCells = [
  [1,0],[1,1],[0,1],[0,2],[1,3],[1,4],[0,5],
]

function isFilled(bedIndex, row, col, plants) {
  return plants.some(p => p.bedIndex === bedIndex && p.row === row && p.col === col)
}

export default function GreenhouseMiniMap({ numBeds = 2, plants = mockCells.map(([row, col]) => ({ bedIndex: 0, row, col })) }) {
  const beds = Array.from({ length: numBeds }, (_, i) => i)

  return (
    <div className="flex items-stretch gap-1.5 h-24 w-full px-2">
      {beds.map((bedIndex, i) => (
        <div key={bedIndex} className="flex gap-1.5 flex-1">
          {/* Грядка */}
          <div className="flex-1 bg-green-50 rounded-lg border border-green-100 p-1.5 flex flex-col gap-1">
            {Array.from({ length: ROWS }, (_, row) => (
              <div key={row} className="flex gap-1 flex-1">
                {Array.from({ length: COLS }, (_, col) => {
                  const filled = isFilled(bedIndex, row, col, plants)
                  return (
                    <div
                      key={col}
                      className={`flex-1 rounded-sm transition-colors ${
                        filled
                          ? 'bg-green-400'
                          : 'bg-white border border-green-100'
                      }`}
                    />
                  )
                })}
              </div>
            ))}
          </div>

          {/* Проход между грядками */}
          {i < beds.length - 1 && (
            <div className="w-2 flex-shrink-0 flex flex-col justify-center gap-0.5 py-1">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="w-full h-px bg-soil-300 rounded-full opacity-60" />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
