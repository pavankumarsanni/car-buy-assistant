// ── Car types ─────────────────────────────────────────────────────────────────

export type FuelType = 'gasoline' | 'diesel' | 'hybrid' | 'electric' | 'plug_in_hybrid'
export type BodyStyle = 'sedan' | 'suv' | 'truck' | 'coupe' | 'convertible' | 'hatchback' | 'minivan' | 'wagon'

export interface CarSummary {
  id: string
  make: string
  model: string
  year: number
  trim?: string
  body_style: BodyStyle
  fuel_type: FuelType
  price: number
  mpg_city?: number
  mpg_highway?: number
  range_miles?: number
  safety_rating?: number
  image_url?: string
  availability: 'in_stock' | 'order' | 'unavailable'
}

export interface CarSpec extends CarSummary {
  horsepower?: number
  cargo_space_cuft?: number
  seating_capacity?: number
  features: string[]
  dealer_name?: string
  dealer_location?: string
}

export interface SearchFilters {
  query?: string
  make?: string
  model?: string
  body_style?: BodyStyle
  fuel_type?: FuelType
  min_price?: number
  max_price?: number
  min_year?: number
  min_safety_rating?: number
  min_mpg?: number
  seating_capacity?: number
  limit?: number
}

export interface SearchResponse {
  results: CarSummary[]
  total: number
  filters_applied: SearchFilters
}

// ── Compare types ─────────────────────────────────────────────────────────────

export interface CompareRow {
  attribute: string
  values: Record<string, string>
}

export interface CompareResponse {
  cars: CarSpec[]
  comparison_table: CompareRow[]
  recommendation?: string
}

// ── Lead types ────────────────────────────────────────────────────────────────

export interface LeadRequest {
  car_id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  zip_code?: string
  message?: string
  intent: 'contact_dealer' | 'test_drive' | 'purchase'
}

export interface LeadResponse {
  lead_id: string
  status: string
  car: CarSummary
  next_steps: string
  estimated_contact_hours: number
}

// ── Chat types ────────────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant'

export interface ChatMessage {
  role: MessageRole
  content: string
}

export interface ToolCall {
  tool: string
  arguments: Record<string, unknown>
  result?: unknown
}

export interface ChatResponse {
  conversation_id: string
  message: string
  tool_calls: ToolCall[]
  search_results?: SearchResponse
  compare_results?: CompareResponse
  lead_result?: LeadResponse
  suggestions: string[]
}

// ── UI types ──────────────────────────────────────────────────────────────────

export type AppView = 'chat' | 'search' | 'compare' | 'buy'

export interface UIMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: Date
  isLoading?: boolean
  searchResults?: SearchResponse
  compareResults?: CompareResponse
  leadResult?: LeadResponse
}
