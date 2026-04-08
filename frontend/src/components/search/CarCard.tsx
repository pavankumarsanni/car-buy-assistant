import { Star, Zap, Fuel, Users, ChevronRight, Plus, Check } from 'lucide-react'
import { Badge } from '../ui/Badge'
import type { CarSummary } from '../../types'
import { useChatStore } from '../../store/chatStore'

interface CarCardProps {
  car: CarSummary
  onViewDetails?: (car: CarSummary) => void
  onBuy?: (car: CarSummary) => void
  compact?: boolean
}

const FUEL_BADGE: Record<string, { label: string; variant: 'default' | 'success' | 'electric' | 'hybrid' | 'warning' }> = {
  electric:      { label: '⚡ Electric', variant: 'electric' },
  hybrid:        { label: '🌿 Hybrid', variant: 'hybrid' },
  plug_in_hybrid:{ label: '🔌 PHEV', variant: 'hybrid' },
  gasoline:      { label: '⛽ Gas', variant: 'default' },
  diesel:        { label: '⛽ Diesel', variant: 'warning' },
}

export function CarCard({ car, onViewDetails, onBuy, compact = false }: CarCardProps) {
  const { compareBasket, addToCompare, removeFromCompare } = useChatStore()
  const inBasket = compareBasket.some(c => c.id === car.id)
  const fuelInfo = FUEL_BADGE[car.fuel_type] || { label: car.fuel_type, variant: 'default' as const }
  const fallbackImg = 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&q=80'

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
      {/* Image */}
      <div className="relative h-40 bg-gray-50 overflow-hidden">
        <img
          src={car.image_url || fallbackImg}
          alt={`${car.year} ${car.make} ${car.model}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={e => { (e.target as HTMLImageElement).src = fallbackImg }}
        />
        <div className="absolute top-2 right-2 flex gap-1.5">
          <Badge variant={fuelInfo.variant}>{fuelInfo.label}</Badge>
          {car.availability === 'in_stock' && <Badge variant="success">In Stock</Badge>}
        </div>
        {/* Compare toggle */}
        <button
          onClick={() => inBasket ? removeFromCompare(car.id) : addToCompare(car)}
          className={`absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow transition-colors ${
            inBasket ? 'bg-brand-600 text-white' : 'bg-white/90 text-gray-600 hover:bg-brand-50'
          }`}
          title={inBasket ? 'Remove from compare' : 'Add to compare'}
        >
          {inBasket ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="font-semibold text-gray-900 text-sm leading-tight">
              {car.year} {car.make} {car.model}
            </h3>
            {car.trim && <p className="text-xs text-gray-500">{car.trim}</p>}
          </div>
          <span className="text-brand-600 font-bold text-sm whitespace-nowrap">
            ${car.price.toLocaleString()}
          </span>
        </div>

        {!compact && (
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            {car.safety_rating && (
              <span className="flex items-center gap-0.5">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                {car.safety_rating}/5
              </span>
            )}
            {(car.mpg_city || car.mpg_highway) && (
              <span className="flex items-center gap-0.5">
                <Fuel className="w-3 h-3 text-green-500" />
                {car.mpg_city}/{car.mpg_highway} mpg
              </span>
            )}
            {car.range_miles && (
              <span className="flex items-center gap-0.5">
                <Zap className="w-3 h-3 text-blue-500" />
                {car.range_miles} mi
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(car)}
              className="flex-1 text-xs py-1.5 px-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
            >
              Details <ChevronRight className="w-3 h-3" />
            </button>
          )}
          {onBuy && (
            <button
              onClick={() => onBuy(car)}
              className="flex-1 text-xs py-1.5 px-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors font-medium"
            >
              Contact Dealer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
