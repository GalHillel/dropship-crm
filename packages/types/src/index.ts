// ─── Locale ────────────────────────────────────────────────────────────────────
export type i18nLocale = 'en' | 'he'

// ─── Profile ───────────────────────────────────────────────────────────────────
export type UserRole = 'customer' | 'admin' | 'super_admin'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  preferred_language: i18nLocale
  created_at: string
  updated_at: string
}

// ─── Product ───────────────────────────────────────────────────────────────────
export interface ProductImage {
  url: string
  alt: string
}

export interface Product {
  id: string
  slug: string
  sku: string | null
  name_en: string
  name_he: string
  description_en: string | null
  description_he: string | null
  price: number
  compare_price: number | null
  cost_price: number | null
  inventory_count: number
  category: string | null
  tags: string[] | null
  images: ProductImage[]
  is_active: boolean
  supplier_id: string | null
  created_at: string
  updated_at: string
}

export interface LocalizedProduct extends Product {
  name: string
  description: string | null
}

// ─── Order ─────────────────────────────────────────────────────────────────────
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export interface Address {
  full_name: string
  line1: string
  line2?: string
  city: string
  state?: string
  postal_code: string
  country: string
  phone?: string
}

export interface Order {
  id: string
  order_number: string
  customer_id: string | null
  status: OrderStatus
  subtotal: number
  discount: number
  shipping_cost: number
  tax: number
  total: number
  currency: string
  shipping_address: Address | null
  billing_address: Address | null
  notes: string | null
  supplier_order_id: string | null
  tracking_number: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  // joined
  customer?: Profile
  items?: OrderItem[]
}

// ─── Order Item ────────────────────────────────────────────────────────────────
export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  quantity: number
  unit_price: number
  total_price: number
  product_snapshot: Partial<Product> | null
  // joined
  product?: Product
}

// ─── Cart ──────────────────────────────────────────────────────────────────────
export interface CartItem {
  product: Product
  quantity: number
}

export interface Cart {
  items: CartItem[]
  subtotal: number
  itemCount: number
}

// ─── Checkout ──────────────────────────────────────────────────────────────────
export interface CheckoutData {
  shipping_address: Address
  billing_address?: Address
  same_as_shipping: boolean
  payment_method: 'credit_card' | 'paypal' | 'bank_transfer'
  notes?: string
  coupon_code?: string
}

// ─── Lead ──────────────────────────────────────────────────────────────────────
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'

export interface Lead {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  source: string
  status: LeadStatus
  score: number
  tags: string[] | null
  notes: string | null
  assigned_to: string | null
  last_contacted_at: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  // joined
  assignee?: Profile
  activities?: LeadActivity[]
}

// ─── Lead Activity ─────────────────────────────────────────────────────────────
export type LeadActivityType = 'note' | 'email' | 'call' | 'meeting' | 'status_change' | 'purchase'

export interface LeadActivity {
  id: string
  lead_id: string
  type: LeadActivityType
  content: string | null
  performed_by: string | null
  created_at: string
  // joined
  performer?: Profile
}

// ─── Analytics ─────────────────────────────────────────────────────────────────
export interface AnalyticsEvent {
  id: string
  session_id: string | null
  user_id: string | null
  event_type: string
  page: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface DashboardKPIs {
  total_revenue: number
  revenue_change_pct: number
  active_orders: number
  orders_change_pct: number
  leads_this_week: number
  leads_change_pct: number
  conversion_rate: number
  conversion_change_pct: number
}

export interface RevenueDataPoint {
  date: string
  revenue: number
  orders: number
}

// ─── API Responses ─────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}
