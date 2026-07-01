-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'super_admin')),
  preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'he')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE public.products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  sku TEXT UNIQUE,
  name_en TEXT NOT NULL,
  name_he TEXT NOT NULL,
  description_en TEXT,
  description_he TEXT,
  price NUMERIC(10,2) NOT NULL,
  compare_price NUMERIC(10,2),
  cost_price NUMERIC(10,2),
  inventory_count INTEGER DEFAULT 0,
  category TEXT,
  tags TEXT[],
  images JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  supplier_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE public.orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')),
  subtotal NUMERIC(10,2) NOT NULL,
  discount NUMERIC(10,2) DEFAULT 0,
  shipping_cost NUMERIC(10,2) DEFAULT 0,
  tax NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'ILS',
  shipping_address JSONB,
  billing_address JSONB,
  notes TEXT,
  supplier_order_id TEXT,
  tracking_number TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items
CREATE TABLE public.order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  product_snapshot JSONB
);

-- Leads / CRM contacts
CREATE TABLE public.leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  source TEXT DEFAULT 'organic',
  status TEXT DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','converted','lost')),
  score INTEGER DEFAULT 0,
  tags TEXT[],
  notes TEXT,
  assigned_to UUID REFERENCES public.profiles(id),
  last_contacted_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lead activities (CRM timeline)
CREATE TABLE public.lead_activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('note','email','call','meeting','status_change','purchase')),
  content TEXT,
  performed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics events
CREATE TABLE public.analytics_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id TEXT,
  user_id UUID REFERENCES public.profiles(id),
  event_type TEXT NOT NULL,
  page TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_orders_customer ON public.orders(customer_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_email ON public.leads(email);
CREATE INDEX idx_lead_activities_lead ON public.lead_activities(lead_id);
CREATE INDEX idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_events_created ON public.analytics_events(created_at DESC);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
);

-- Products: public read, admin write
CREATE POLICY "Products are publicly readable" ON public.products FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
);

-- Orders: users see own orders, admins see all
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Admins can manage all orders" ON public.orders FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
);

-- Order items follow order access
CREATE POLICY "Order items follow order access" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND customer_id = auth.uid())
);
CREATE POLICY "Admins manage order items" ON public.order_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
);

-- Leads: admin only
CREATE POLICY "Admins manage leads" ON public.leads FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
);
CREATE POLICY "Admins manage lead activities" ON public.lead_activities FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
);

-- Analytics: insert for all, read for admins
CREATE POLICY "Anyone can log events" ON public.analytics_events FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Admins can read analytics" ON public.analytics_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
);

-- Seed demo data
INSERT INTO public.products (slug, sku, name_en, name_he, description_en, description_he, price, compare_price, cost_price, inventory_count, category, tags, images, is_active)
VALUES
  ('wireless-earbuds-pro', 'SKU-001', 'Wireless Earbuds Pro', 'אוזניות אלחוטיות פרו', 'Premium wireless earbuds with active noise cancellation and 30-hour battery life.', 'אוזניות אלחוטיות פרימיום עם ביטול רעשים אקטיבי וחיי סוללה של 30 שעות.', 299.00, 399.00, 120.00, 150, 'Electronics', ARRAY['wireless','audio','earbuds'], '[{"url":"https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600","alt":"Wireless Earbuds"}]'::jsonb, TRUE),
  ('smart-watch-x1', 'SKU-002', 'Smart Watch X1', 'שעון חכם X1', 'Advanced smartwatch with health monitoring, GPS, and 7-day battery.', 'שעון חכם מתקדם עם ניטור בריאות, GPS וסוללה ל-7 ימים.', 849.00, 1099.00, 350.00, 75, 'Electronics', ARRAY['smartwatch','fitness','wearable'], '[{"url":"https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600","alt":"Smart Watch"}]'::jsonb, TRUE),
  ('portable-charger-20k', 'SKU-003', 'Portable Charger 20000mAh', 'מטען נייד 20000mAh', 'High-capacity power bank with fast charging and USB-C PD support.', 'בנק כוח עם קיבולת גבוהה, טעינה מהירה ותמיכה ב-USB-C PD.', 179.00, 229.00, 65.00, 300, 'Electronics', ARRAY['charging','portable','powerbank'], '[{"url":"https://images.unsplash.com/photo-1609592806596-b8d4a4234d5e?w=600","alt":"Power Bank"}]'::jsonb, TRUE),
  ('minimalist-backpack', 'SKU-004', 'Minimalist Backpack', 'תרמיל גב מינימליסטי', 'Clean, durable 20L backpack for daily commuting and travel.', 'תרמיל גב נקי ועמיד 20 ליטר לנסיעות יומיות וטיולים.', 349.00, 449.00, 140.00, 60, 'Bags', ARRAY['backpack','travel','minimalist'], '[{"url":"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600","alt":"Backpack"}]'::jsonb, TRUE),
  ('desk-lamp-led', 'SKU-005', 'LED Desk Lamp', 'מנורת שולחן LED', 'Adjustable LED desk lamp with USB charging port and multiple brightness levels.', 'מנורת שולחן LED מתכווננת עם יציאת טעינה USB ורמות בהירות מרובות.', 129.00, 179.00, 45.00, 200, 'Home', ARRAY['lamp','led','desk'], '[{"url":"https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600","alt":"Desk Lamp"}]'::jsonb, TRUE);
