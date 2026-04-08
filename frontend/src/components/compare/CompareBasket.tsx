import { useState } from 'react'
import { X, BarChart3, Loader2 } from 'lucide-react'
import { useChatStore } from '../../store/chatStore'
import { compareCars } from '../../services/api'
import type { CompareResponse } from '../../types'
import { CompareView } from './CompareView'

export function CompareBasket() {
  const { compareBasket, removeFromCompare, clearCompare, sendMessage } = useChatStore()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CompareResponse | null>(null)

  const handleCompare = async () => {
    if (compareBasket.length < 2) return
    setLoading(true)
    try {
      const data = await compareCars(compareBasket.map(c => c.id))
      setResult(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (compareBasket.length === 0 && !result) return null

  return (
    <div className="bg-white border-t border-gray-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
          <BarChart3 className="w-4 h-4 text-brand-600" />
          Compare ({compareBasket.length}/5)
        </h3>
        <button onClick={() => { clearCompare(); setResult(null) }} className="text-xs text-gray-400 hover:text-gray-600">
          Clear all
        </button>
      </div>

      {/* Basket chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {compareBasket.map(car => (
          <div key={car.id} className="flex items-center gap-1 bg-brand-50 text-brand-700 text-xs px-2 py-1 rounded-full">
            <span>{car.year} {car.make} {car.model}</span>
            <button onClick={() => removeFromCompare(car.id)} className="text-brand-400 hover:text-brand-700">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {compareBasket.length >= 2 && !result && (
        <button
          onClick={handleCompare}
          disabled={loading}
          className="w-full py-2 bg-brand-600 text-white text-sm rounded-xl hover:bg-brand-700 transition-colors flex items-center justify-center gap-2 font-medium"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Comparing…</> : 'Compare Now'}
        </button>
      )}

      {result && (
        <CompareView
          data={result}
          onBuy={(carId) => {
            const car = compareBasket.find(c => c.id === carId)
            if (car) sendMessage(`I want to buy the ${car.year} ${car.make} ${car.model}`)
          }}
        />
      )}
    </div>
  )
}
