import { useState, useRef } from 'react'
import { Send, Mic } from 'lucide-react'
import { useChatStore } from '../../store/chatStore'

export function ChatInput() {
  const [text, setText] = useState('')
  const { sendMessage, isLoading } = useChatStore()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = async () => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return
    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    await sendMessage(trimmed)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
  }

  return (
    <div className="flex items-end gap-2 p-4 pt-2 bg-white border-t border-gray-100">
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Ask me about cars… e.g. 'Find me a hybrid SUV under $40k'"
          rows={1}
          disabled={isLoading}
          className="w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 pr-10 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all disabled:bg-gray-50 disabled:cursor-not-allowed overflow-hidden"
          style={{ minHeight: '44px', maxHeight: '120px' }}
        />
      </div>
      <button
        onClick={handleSend}
        disabled={!text.trim() || isLoading}
        className="w-11 h-11 rounded-2xl bg-brand-600 text-white flex items-center justify-center hover:bg-brand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
        aria-label="Send message"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  )
}
