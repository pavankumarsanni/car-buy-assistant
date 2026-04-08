import { useState } from 'react'
import { Bot, User } from 'lucide-react'
import { LoadingDots } from '../ui/LoadingDots'
import { SearchResults } from '../search/SearchResults'
import { CompareView } from '../compare/CompareView'
import { BuyFlow } from '../buy/BuyFlow'
import type { UIMessage, CarSummary } from '../../types'
import { useChatStore } from '../../store/chatStore'
import { getCarDetails } from '../../services/api'
import { clsx } from 'clsx'

interface MessageBubbleProps {
  message: UIMessage
}

// Very simple markdown→HTML: bold, newlines
function renderMarkdown(text: string) {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  const withBold = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  const withBreaks = withBold.replace(/\n/g, '<br />')
  return withBreaks
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const { sendMessage } = useChatStore()
  const [buyCarId, setBuyCarId] = useState<string | null>(null)
  const [buyCarData, setBuyCarData] = useState<CarSummary | null>(null)
  const [showBuy, setShowBuy] = useState(false)

  const isUser = message.role === 'user'

  const handleBuy = async (carId: string) => {
    setBuyCarId(carId)
    // Try to find in search results
    const car = message.searchResults?.results.find(c => c.id === carId)
      || message.compareResults?.cars.find(c => c.id === carId)
    if (car) {
      setBuyCarData(car as CarSummary)
    } else {
      try {
        const spec = await getCarDetails(carId)
        setBuyCarData(spec)
      } catch {
        setBuyCarData(null)
      }
    }
    setShowBuy(true)
  }

  const handleViewDetails = (car: CarSummary) => {
    sendMessage(`Tell me more about the ${car.year} ${car.make} ${car.model} ${car.trim || ''}`)
  }

  return (
    <div className={clsx('flex gap-2.5', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div className={clsx(
        'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
        isUser ? 'bg-brand-600' : 'bg-gray-100'
      )}>
        {isUser
          ? <User className="w-3.5 h-3.5 text-white" />
          : <Bot className="w-3.5 h-3.5 text-gray-500" />
        }
      </div>

      {/* Content */}
      <div className={clsx('max-w-[85%] space-y-2', isUser ? 'items-end flex flex-col' : '')}>
        {/* Text bubble */}
        <div className={clsx(
          'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-brand-600 text-white rounded-tr-sm'
            : 'bg-gray-100 text-gray-800 rounded-tl-sm',
        )}>
          {message.isLoading
            ? <LoadingDots />
            : <span dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }} />
          }
        </div>

        {/* Search results panel */}
        {message.searchResults && message.searchResults.results.length > 0 && (
          <div className="w-full">
            <SearchResults
              data={message.searchResults}
              onViewDetails={handleViewDetails}
              onBuy={(car) => handleBuy(car.id)}
            />
          </div>
        )}

        {/* Compare panel */}
        {message.compareResults && (
          <div className="w-full">
            <CompareView
              data={message.compareResults}
              onBuy={handleBuy}
            />
          </div>
        )}

        {/* Buy / lead panel */}
        {showBuy && buyCarData && (
          <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <BuyFlow
              car={buyCarData}
              onComplete={() => setShowBuy(false)}
              onCancel={() => setShowBuy(false)}
            />
          </div>
        )}

        {/* Lead result inline */}
        {message.leadResult && !showBuy && (
          <div className="w-full bg-green-50 rounded-2xl border border-green-100 p-3 text-xs text-green-800">
            <p className="font-semibold">✅ Request Confirmed – {message.leadResult.lead_id}</p>
            <p className="mt-1">{message.leadResult.next_steps}</p>
          </div>
        )}

        {/* Timestamp */}
        <p className={clsx('text-xs text-gray-400', isUser ? 'text-right' : '')}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}
