import { useState } from 'react'
import { CheckCircle, Loader2, Car } from 'lucide-react'
import type { CarSummary, LeadRequest, LeadResponse } from '../../types'
import { createLead } from '../../services/api'

interface BuyFlowProps {
  car: CarSummary
  onComplete?: (result: LeadResponse) => void
  onCancel?: () => void
}

type Step = 'intent' | 'contact' | 'confirm' | 'success'
type Intent = LeadRequest['intent']

const INTENT_OPTIONS: { value: Intent; label: string; desc: string }[] = [
  { value: 'test_drive', label: '🚗 Schedule Test Drive', desc: 'Arrange a test drive at the dealership' },
  { value: 'contact_dealer', label: '📞 Contact Dealer', desc: 'Get pricing, availability, and more info' },
  { value: 'purchase', label: '✅ Start Purchase', desc: "I'm ready to buy – connect me with a sales advisor" },
]

export function BuyFlow({ car, onComplete, onCancel }: BuyFlowProps) {
  const [step, setStep] = useState<Step>('intent')
  const [intent, setIntent] = useState<Intent>('contact_dealer')
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', zip_code: '', message: '' })
  const [errors, setErrors] = useState<Partial<typeof form>>({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<LeadResponse | null>(null)

  const validate = () => {
    const e: Partial<typeof form> = {}
    if (!form.first_name.trim()) e.first_name = 'Required'
    if (!form.last_name.trim()) e.last_name = 'Required'
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = 'Valid email required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const lead = await createLead({
        car_id: car.id,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone || undefined,
        zip_code: form.zip_code || undefined,
        message: form.message || undefined,
        intent,
      })
      setResult(lead)
      setStep('success')
      onComplete?.(lead)
    } catch (err) {
      setErrors({ email: err instanceof Error ? err.message : 'Submission failed' })
    } finally {
      setLoading(false)
    }
  }

  const inputCls = (field: keyof typeof form) =>
    `w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors ${
      errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-200'
    }`

  // ── Step: intent ─────────────────────────────────────────────────────────
  if (step === 'intent') {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl">
          <Car className="w-4 h-4 text-brand-600 flex-shrink-0" />
          <p className="text-xs font-medium text-gray-700">
            {car.year} {car.make} {car.model} {car.trim} — ${car.price.toLocaleString()}
          </p>
        </div>
        <p className="text-sm font-medium text-gray-800">What would you like to do?</p>
        <div className="space-y-2">
          {INTENT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setIntent(opt.value); setStep('contact') }}
              className="w-full text-left p-3 rounded-xl border border-gray-200 hover:border-brand-400 hover:bg-brand-50 transition-colors"
            >
              <p className="text-sm font-medium text-gray-900">{opt.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
        {onCancel && (
          <button onClick={onCancel} className="text-xs text-gray-400 hover:text-gray-600 w-full text-center mt-1">
            Cancel
          </button>
        )}
      </div>
    )
  }

  // ── Step: contact form ────────────────────────────────────────────────────
  if (step === 'contact') {
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-800">Your contact information</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <input placeholder="First name *" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} className={inputCls('first_name')} />
            {errors.first_name && <p className="text-xs text-red-500 mt-0.5">{errors.first_name}</p>}
          </div>
          <div>
            <input placeholder="Last name *" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} className={inputCls('last_name')} />
            {errors.last_name && <p className="text-xs text-red-500 mt-0.5">{errors.last_name}</p>}
          </div>
        </div>
        <div>
          <input type="email" placeholder="Email address *" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls('email')} />
          {errors.email && <p className="text-xs text-red-500 mt-0.5">{errors.email}</p>}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input placeholder="Phone (optional)" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputCls('phone')} />
          <input placeholder="ZIP code (optional)" value={form.zip_code} onChange={e => setForm(f => ({ ...f, zip_code: e.target.value }))} className={inputCls('zip_code')} />
        </div>
        <textarea
          placeholder="Message to dealer (optional)"
          value={form.message}
          onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
          rows={2}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-200 resize-none"
        />
        <div className="flex gap-2">
          <button onClick={() => setStep('intent')} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
            Back
          </button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors flex items-center justify-center gap-1 font-medium">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : 'Submit Request'}
          </button>
        </div>
      </div>
    )
  }

  // ── Step: success ─────────────────────────────────────────────────────────
  if (step === 'success' && result) {
    return (
      <div className="text-center space-y-3 py-2">
        <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
        <div>
          <p className="font-semibold text-gray-900 text-sm">Request Submitted!</p>
          <p className="text-xs text-gray-500 mt-0.5">Reference: {result.lead_id}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-xs text-green-800 text-left">
          <p className="font-medium mb-1">Next Steps</p>
          <p>{result.next_steps}</p>
          <p className="mt-1 text-green-600">
            Expected contact within {result.estimated_contact_hours} hour{result.estimated_contact_hours !== 1 ? 's' : ''}.
          </p>
        </div>
      </div>
    )
  }

  return null
}
