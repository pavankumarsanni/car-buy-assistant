import { useChatStore } from '../../store/chatStore'

export function SuggestionChips() {
  const { suggestions, sendMessage, isLoading } = useChatStore()

  if (!suggestions.length) return null

  return (
    <div className="flex flex-wrap gap-2 px-4 pb-3">
      {suggestions.map(s => (
        <button
          key={s}
          disabled={isLoading}
          onClick={() => sendMessage(s)}
          className="text-xs px-3 py-1.5 rounded-full border border-brand-200 text-brand-700 bg-brand-50 hover:bg-brand-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {s}
        </button>
      ))}
    </div>
  )
}
