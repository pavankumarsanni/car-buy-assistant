import { useEffect, useRef } from 'react'
import { Bot, RefreshCw, AlertCircle } from 'lucide-react'
import { MessageBubble } from './MessageBubble'
import { SuggestionChips } from './SuggestionChips'
import { ChatInput } from './ChatInput'
import { useChatStore } from '../../store/chatStore'

export function ChatWindow() {
  const { messages, error, clearError, resetConversation } = useChatStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">AutoAdvisor</p>
            <p className="text-xs text-green-500 font-medium">● Online</p>
          </div>
        </div>
        <button
          onClick={resetConversation}
          className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          title="Start new conversation"
        >
          <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-brand-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Hi, I'm AutoAdvisor!</h2>
            <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
              I can help you find, compare, and buy the perfect car. Just tell me what you're looking for!
            </p>
          </div>
        )}

        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={clearError} className="text-red-400 hover:text-red-600 text-xs">✕</button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestion chips */}
      <SuggestionChips />

      {/* Input */}
      <ChatInput />
    </div>
  )
}
