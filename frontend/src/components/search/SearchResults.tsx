import { Car } from 'lucide-react'
import { CarCard } from './CarCard'
import type { SearchResponse, CarSummary } from '../../types'

interface SearchResultsProps {
  data: SearchResponse
  onViewDetails?: (car: CarSummary) => void
  onBuy?: (car: CarSummary) => void
}

export function SearchResults({ data, onViewDetails, onBuy }: SearchResultsProps) {
  if (!data.results.length) {
    return (
      <div className="text-center py-6 text-gray-500 text-sm">
        <Car className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        No vehicles found matching your criteria.
      </div>
    )
  }

  return (
    <div className="mt-3">
      <p className="text-xs text-gray-500 mb-2 font-medium">
        {data.total} vehicle{data.total !== 1 ? 's' : ''} found
        {data.total > data.results.length && ` · showing top ${data.results.length}`}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {data.results.map(car => (
          <CarCard
            key={car.id}
            car={car}
            onViewDetails={onViewDetails}
            onBuy={onBuy}
          />
        ))}
      </div>
    </div>
  )
}
