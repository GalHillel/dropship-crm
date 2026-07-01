import { createClient } from '@supabase/supabase-js'
import type {
  Profile,
  Product,
  Order,
  OrderItem,
  Lead,
  LeadActivity,
  AnalyticsEvent,
  OrderStatus,
  LeadStatus,
  PaginatedResponse,
  DashboardKPIs,
  RevenueDataPoint,
} from '@dropship/types'

export { createClient }

// ─── Browser client (for use in client components) ─────────────────────────────
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

// ─── Server client (for use in Server Components / Route Handlers) ─────────────
export function createServerClient(cookieStore?: {
  get: (name: string) => { value: string } | undefined
  set: (name: string, value: string, options?: Record<string, unknown>) => void
  delete: (name: string, options?: Record<string, unknown>) => void
}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!cookieStore) {
    return createClient(url, key)
  }

  return createClient(url, key, {
    auth: {
      flowType: 'pkce',
    },
    global: {
      headers: {},
    },
  })
}

// ─── Admin client (service role — server only) ─────────────────────────────────
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// ─── Products ──────────────────────────────────────────────────────────────────
export async function getProducts(
  client: ReturnType<typeof createClient>,
  options?: { category?: string; search?: string; page?: number; pageSize?: number; activeOnly?: boolean }
): Promise<PaginatedResponse<Product>> {
  const page = options?.page ?? 1
  const pageSize = options?.pageSize ?? 12
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = client.from('products').select('*', { count: 'exact' })

  if (options?.activeOnly !== false) query = query.eq('is_active', true)
  if (options?.category) query = query.eq('category', options.category)
  if (options?.search) {
    query = query.or(`name_en.ilike.%${options.search}%,name_he.ilike.%${options.search}%`)
  }

  const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to)

  if (error) throw error
  return {
    data: data as Product[],
    count: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

export async function getProductBySlug(
  client: ReturnType<typeof createClient>,
  slug: string
): Promise<Product | null> {
  const { data, error } = await client.from('products').select('*').eq('slug', slug).single()
  if (error) return null
  return data as Product
}

export async function upsertProduct(
  client: ReturnType<typeof createClient>,
  product: Partial<Product>
): Promise<Product> {
  const { data, error } = await client.from('products').upsert(product).select().single()
  if (error) throw error
  return data as Product
}

export async function deleteProduct(
  client: ReturnType<typeof createClient>,
  id: string
): Promise<void> {
  const { error } = await client.from('products').update({ is_active: false }).eq('id', id)
  if (error) throw error
}

// ─── Orders ────────────────────────────────────────────────────────────────────
export async function getOrders(
  client: ReturnType<typeof createClient>,
  options?: { status?: OrderStatus; search?: string; page?: number; pageSize?: number; customerId?: string }
): Promise<PaginatedResponse<Order>> {
  const page = options?.page ?? 1
  const pageSize = options?.pageSize ?? 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = client
    .from('orders')
    .select('*, customer:profiles(id,email,full_name), items:order_items(*, product:products(*))', { count: 'exact' })

  if (options?.status) query = query.eq('status', options.status)
  if (options?.customerId) query = query.eq('customer_id', options.customerId)
  if (options?.search) {
    query = query.ilike('order_number', `%${options.search}%`)
  }

  const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to)
  if (error) throw error
  return {
    data: data as Order[],
    count: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

export async function getOrderById(
  client: ReturnType<typeof createClient>,
  id: string
): Promise<Order | null> {
  const { data, error } = await client
    .from('orders')
    .select('*, customer:profiles(*), items:order_items(*, product:products(*))')
    .eq('id', id)
    .single()
  if (error) return null
  return data as Order
}

export async function updateOrderStatus(
  client: ReturnType<typeof createClient>,
  id: string,
  status: OrderStatus
): Promise<void> {
  const { error } = await client.from('orders').update({ status }).eq('id', id)
  if (error) throw error
}

export async function createOrder(
  client: ReturnType<typeof createClient>,
  order: Omit<Order, 'id' | 'created_at' | 'updated_at'>,
  items: Omit<OrderItem, 'id' | 'order_id'>[]
): Promise<Order> {
  const { data: orderData, error: orderError } = await client
    .from('orders')
    .insert(order)
    .select()
    .single()
  if (orderError) throw orderError

  const orderItems = items.map((item) => ({ ...item, order_id: orderData.id }))
  const { error: itemsError } = await client.from('order_items').insert(orderItems)
  if (itemsError) throw itemsError

  return orderData as Order
}

// ─── Leads ─────────────────────────────────────────────────────────────────────
export async function getLeads(
  client: ReturnType<typeof createClient>,
  options?: { status?: LeadStatus; search?: string; page?: number; pageSize?: number }
): Promise<PaginatedResponse<Lead>> {
  const page = options?.page ?? 1
  const pageSize = options?.pageSize ?? 50
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = client
    .from('leads')
    .select('*, assignee:profiles!leads_assigned_to_fkey(id,email,full_name), activities:lead_activities(*)', {
      count: 'exact',
    })

  if (options?.status) query = query.eq('status', options.status)
  if (options?.search) {
    query = query.or(`email.ilike.%${options.search}%,full_name.ilike.%${options.search}%`)
  }

  const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to)
  if (error) throw error
  return {
    data: data as Lead[],
    count: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

export async function getLeadById(
  client: ReturnType<typeof createClient>,
  id: string
): Promise<Lead | null> {
  const { data, error } = await client
    .from('leads')
    .select('*, assignee:profiles!leads_assigned_to_fkey(*), activities:lead_activities(*, performer:profiles!lead_activities_performed_by_fkey(*))')
    .eq('id', id)
    .single()
  if (error) return null
  return data as Lead
}

export async function upsertLead(
  client: ReturnType<typeof createClient>,
  lead: Partial<Lead>
): Promise<Lead> {
  const { data, error } = await client.from('leads').upsert(lead).select().single()
  if (error) throw error
  return data as Lead
}

export async function addLeadActivity(
  client: ReturnType<typeof createClient>,
  activity: Omit<LeadActivity, 'id' | 'created_at'>
): Promise<LeadActivity> {
  const { data, error } = await client.from('lead_activities').insert(activity).select().single()
  if (error) throw error
  return data as LeadActivity
}

// ─── Analytics ─────────────────────────────────────────────────────────────────
export async function logEvent(
  client: ReturnType<typeof createClient>,
  event: Omit<AnalyticsEvent, 'id' | 'created_at'>
): Promise<void> {
  await client.from('analytics_events').insert(event)
}

export async function getDashboardKPIs(
  client: ReturnType<typeof createClient>
): Promise<DashboardKPIs> {
  const now = new Date()
  const thisWeekStart = new Date(now)
  thisWeekStart.setDate(now.getDate() - 7)
  const lastWeekStart = new Date(now)
  lastWeekStart.setDate(now.getDate() - 14)

  const [revenueResult, lastRevenueResult, activeOrdersResult, leadsResult, lastLeadsResult] =
    await Promise.all([
      client
        .from('orders')
        .select('total')
        .gte('created_at', thisWeekStart.toISOString())
        .not('status', 'in', '("cancelled","refunded")'),
      client
        .from('orders')
        .select('total')
        .gte('created_at', lastWeekStart.toISOString())
        .lt('created_at', thisWeekStart.toISOString())
        .not('status', 'in', '("cancelled","refunded")'),
      client.from('orders').select('id', { count: 'exact' }).in('status', ['pending', 'confirmed', 'processing']),
      client.from('leads').select('id', { count: 'exact' }).gte('created_at', thisWeekStart.toISOString()),
      client.from('leads').select('id', { count: 'exact' }).gte('created_at', lastWeekStart.toISOString()).lt('created_at', thisWeekStart.toISOString()),
    ])

  const thisRevenue = (revenueResult.data ?? []).reduce((sum, o) => sum + Number(o.total), 0)
  const lastRevenue = (lastRevenueResult.data ?? []).reduce((sum, o) => sum + Number(o.total), 0)
  const revenueChangePct = lastRevenue > 0 ? ((thisRevenue - lastRevenue) / lastRevenue) * 100 : 0

  const activeOrders = activeOrdersResult.count ?? 0
  const leadsThisWeek = leadsResult.count ?? 0
  const leadsLastWeek = lastLeadsResult.count ?? 0
  const leadsChangePct = leadsLastWeek > 0 ? ((leadsThisWeek - leadsLastWeek) / leadsLastWeek) * 100 : 0

  const [convertedLeads, totalLeads] = await Promise.all([
    client.from('leads').select('id', { count: 'exact' }).eq('status', 'converted'),
    client.from('leads').select('id', { count: 'exact' }),
  ])
  const conversionRate =
    (totalLeads.count ?? 0) > 0 ? ((convertedLeads.count ?? 0) / (totalLeads.count ?? 1)) * 100 : 0

  return {
    total_revenue: thisRevenue,
    revenue_change_pct: revenueChangePct,
    active_orders: activeOrders,
    orders_change_pct: 0,
    leads_this_week: leadsThisWeek,
    leads_change_pct: leadsChangePct,
    conversion_rate: conversionRate,
    conversion_change_pct: 0,
  }
}

export async function getRevenueChart(
  client: ReturnType<typeof createClient>,
  days = 30
): Promise<RevenueDataPoint[]> {
  const from = new Date()
  from.setDate(from.getDate() - days)

  const { data } = await client
    .from('orders')
    .select('created_at, total')
    .gte('created_at', from.toISOString())
    .not('status', 'in', '("cancelled","refunded")')
    .order('created_at')

  if (!data) return []

  const grouped: Record<string, RevenueDataPoint> = {}
  data.forEach((row) => {
    const date = row.created_at.slice(0, 10)
    if (!grouped[date]) grouped[date] = { date, revenue: 0, orders: 0 }
    grouped[date].revenue += Number(row.total)
    grouped[date].orders += 1
  })

  return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date))
}
