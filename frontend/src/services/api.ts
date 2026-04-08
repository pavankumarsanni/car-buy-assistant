/**
 * API service layer.
 * All HTTP calls go through here so the rest of the app
 * never directly imports axios.
 */
import axios from 'axios'
import type {
  ChatMessage, ChatResponse,
  SearchFilters, SearchResponse,
  CarSpec, CompareResponse, LeadRequest, LeadResponse,
} from '../types'

const BASE = '/api/v1'

const client = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
})

// ── response interceptor for uniform error shape ──────────────────────────────
client.interceptors.response.use(
  res => res,
  err => {
    const message =
      err.response?.data?.detail ||
      err.response?.data?.error ||
      err.message ||
      'Unknown error'
    return Promise.reject(new Error(message))
  },
)

// ── Chat ──────────────────────────────────────────────────────────────────────

export async function sendChatMessage(
  message: string,
  history: ChatMessage[],
  conversationId?: string,
): Promise<ChatResponse> {
  const { data } = await client.post<ChatResponse>('/chat', {
    message,
    history,
    conversation_id: conversationId,
  })
  return data
}

// ── Cars ──────────────────────────────────────────────────────────────────────

export async function searchCars(filters: SearchFilters): Promise<SearchResponse> {
  const { data } = await client.get<SearchResponse>('/cars/search', { params: filters })
  return data
}

export async function getCarDetails(carId: string): Promise<CarSpec> {
  const { data } = await client.get<CarSpec>(`/cars/${carId}`)
  return data
}

export async function compareCars(carIds: string[]): Promise<CompareResponse> {
  const { data } = await client.post<CompareResponse>('/cars/compare', { car_ids: carIds })
  return data
}

export async function createLead(lead: LeadRequest): Promise<LeadResponse> {
  const { data } = await client.post<LeadResponse>('/cars/lead', lead)
  return data
}
