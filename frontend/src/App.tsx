import { useState } from 'react'
import { Car, MessageSquare, BarChart3, ShoppingBag, ChevronRight } from 'lucide-react'
import { ChatWindow } from './components/chat/ChatWindow'
import { CompareBasket } from './components/compare/CompareBasket'
import { useChatStore } from './store/chatStore'
import { clsx } from 'clsx'

type Tab = 'chat' | 'compare'

export default function App() {
  const [tab, setTab] = useState<Tab>('chat')
  const { compareBasket } = useChatStore()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col" style={{ height: 'min(90vh, 800px)' }}>

        {/* App header */}
        <header className="bg-gradient-to-r from-brand-700 to-brand-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-base tracking-tight">AutoAdvisor</h1>
              <p className="text-blue-200 text-xs">AI-Powered Car Shopping</p>
            </div>
          </div>

          {/* Tab nav */}
          <div className="flex items-center gap-1 bg-white/10 rounded-xl p-1">
            <TabBtn active={tab === 'chat'} onClick={() => setTab('chat')} icon={<MessageSquare className="w-3.5 h-3.5" />} label="Chat" />
            <TabBtn
              active={tab === 'compare'}
              onClick={() => setTab('compare')}
              icon={<BarChart3 className="w-3.5 h-3.5" />}
              label="Compare"
              badge={compareBasket.length > 0 ? compareBasket.length : undefined}
            />
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {tab === 'chat' && <ChatWindow />}
          {tab === 'compare' && (
            <div className="flex-1 overflow-y-auto p-4">
              {compareBasket.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <BarChart3 className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                  <p className="text-sm font-medium">No cars in your compare list</p>
                  <p className="text-xs mt-1">Use the + button on any car card in the chat to add it here.</p>
                </div>
              ) : (
                <CompareBasket />
              )}
            </div>
          )}
        </div>

        {/* Footer watermark */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">Prices shown are MSRP and may vary by dealer</p>
          <p className="text-xs text-gray-300">Powered by Claude AI</p>
        </div>
      </div>
    </div>
  )
}

function TabBtn({
  active, onClick, icon, label, badge,
}: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string; badge?: number
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors relative',
        active ? 'bg-white text-brand-700' : 'text-white/70 hover:text-white',
      )}
    >
      {icon}
      {label}
      {badge !== undefined && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
          {badge}
        </span>
      )}
    </button>
  )
}
