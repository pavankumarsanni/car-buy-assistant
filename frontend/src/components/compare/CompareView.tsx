import { CheckCircle, X, BarChart3 } from 'lucide-react'
import type { CompareResponse } from '../../types'

interface CompareViewProps {
  data: CompareResponse
  onBuy?: (carId: string) => void
}

const fallbackImg = 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=300&q=80'

export function CompareView({ data, onBuy }: CompareViewProps) {
  const { cars, comparison_table, recommendation } = data

  return (
    <div className="mt-3 overflow-x-auto">
      <div className="min-w-[480px]">
        {/* Header row */}
        <div className="grid gap-2 mb-3" style={{ gridTemplateColumns: `120px repeat(${cars.length}, 1fr)` }}>
          <div />
          {cars.map(car => (
            <div key={car.id} className="text-center">
              <div className="w-full h-24 rounded-xl overflow-hidden mb-1 bg-gray-50">
                <img
                  src={car.image_url || fallbackImg}
                  alt={`${car.make} ${car.model}`}
                  className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).src = fallbackImg }}
                />
              </div>
              <p className="text-xs font-semibold text-gray-900 leading-tight">
                {car.year} {car.make} {car.model}
              </p>
              {car.trim && <p className="text-xs text-gray-400">{car.trim}</p>}
            </div>
          ))}
        </div>

        {/* Comparison rows */}
        <div className="rounded-xl overflow-hidden border border-gray-100">
          {comparison_table.map((row, idx) => (
            <div
              key={row.attribute}
              className={`grid gap-2 px-3 py-2 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
              style={{ gridTemplateColumns: `120px repeat(${cars.length}, 1fr)` }}
            >
              <span className="text-xs text-gray-500 font-medium self-center">{row.attribute}</span>
              {cars.map(car => (
                <span key={car.id} className="text-xs text-gray-800 text-center self-center font-medium">
                  {row.values[car.id] ?? '—'}
                </span>
              ))}
            </div>
          ))}
        </div>

        {/* Recommendation */}
        {recommendation && (
          <div className="mt-3 p-3 bg-brand-50 rounded-xl border border-brand-100 flex gap-2">
            <CheckCircle className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-brand-800 leading-relaxed">
              {recommendation.replace(/\*\*/g, '')}
            </p>
          </div>
        )}

        {/* Buy buttons */}
        {onBuy && (
          <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: `120px repeat(${cars.length}, 1fr)` }}>
            <div />
            {cars.map(car => (
              <button
                key={car.id}
                onClick={() => onBuy(car.id)}
                className="text-xs py-1.5 px-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors font-medium"
              >
                Choose this
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
