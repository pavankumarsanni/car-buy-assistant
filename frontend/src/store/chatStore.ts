/**
 * Global state using Zustand.
 * Keeps chat history, active view, and comparison basket.
 */
import { create } from 'zustand'
import type { UIMessage, CarSummary, AppView } from '../types'
import { sendChatMessage } from '../services/api'

interface ChatState {
  messages: UIMessage[]
  conversationId?: string
  isLoading: boolean
  error?: string
  activeView: AppView
  compareBasket: CarSummary[]
  suggestions: string[]

  sendMessage: (text: string) => Promise<void>
  addToCompare: (car: CarSummary) => void
  removeFromCompare: (carId: string) => void
  clearCompare: () => void
  setView: (view: AppView) => void
  clearError: () => void
  resetConversation: () => void
}

const makeId = () => Math.random().toString(36).slice(2)

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  conversationId: undefined,
  isLoading: false,
  error: undefined,
  activeView: 'chat',
  compareBasket: [],
  suggestions: [
    'Find me a reliable SUV under $30,000',
    'Compare Toyota RAV4 vs Honda CR-V',
    'Show me the best EV for commuting',
    'What\'s a good family car with 7 seats?',
  ],

  sendMessage: async (text: string) => {
    const { messages, conversationId } = get()

    // Add user message immediately
    const userMsg: UIMessage = {
      id: makeId(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    // Add loading placeholder
    const loadingId = makeId()
    const loadingMsg: UIMessage = {
      id: loadingId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    }

    set({ messages: [...messages, userMsg, loadingMsg], isLoading: true, error: undefined })

    try {
      // Build chat history from existing messages (exclude loading placeholder)
      const history = [...messages, userMsg]
        .filter(m => !m.isLoading)
        .map(m => ({ role: m.role, content: m.content }))

      const response = await sendChatMessage(text, history, conversationId)

      const assistantMsg: UIMessage = {
        id: loadingId,
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        isLoading: false,
        searchResults: response.search_results,
        compareResults: response.compare_results,
        leadResult: response.lead_result,
      }

      set(state => ({
        messages: state.messages.map(m => m.id === loadingId ? assistantMsg : m),
        conversationId: response.conversation_id,
        isLoading: false,
        suggestions: response.suggestions,
      }))

      // Auto-switch view based on tool output
      if (response.compare_results) {
        set({ activeView: 'compare' })
      } else if (response.lead_result) {
        set({ activeView: 'buy' })
      }

    } catch (err) {
      const error = err instanceof Error ? err.message : 'Something went wrong'
      set(state => ({
        messages: state.messages.filter(m => m.id !== loadingId),
        isLoading: false,
        error,
      }))
    }
  },

  addToCompare: (car: CarSummary) => {
    set(state => {
      if (state.compareBasket.find(c => c.id === car.id)) return state
      if (state.compareBasket.length >= 5) return state
      return { compareBasket: [...state.compareBasket, car] }
    })
  },

  removeFromCompare: (carId: string) => {
    set(state => ({ compareBasket: state.compareBasket.filter(c => c.id !== carId) }))
  },

  clearCompare: () => set({ compareBasket: [] }),

  setView: (view: AppView) => set({ activeView: view }),

  clearError: () => set({ error: undefined }),

  resetConversation: () => set({
    messages: [],
    conversationId: undefined,
    error: undefined,
    compareBasket: [],
    suggestions: [
      'Find me a reliable SUV under $30,000',
      'Compare Toyota RAV4 vs Honda CR-V',
      'Show me the best EV for commuting',
      'What\'s a good family car with 7 seats?',
    ],
  }),
}))
