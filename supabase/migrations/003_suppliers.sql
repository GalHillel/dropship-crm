-- 003_suppliers.sql
-- Suppliers table for dropship vendor management

CREATE TABLE IF NOT EXISTS suppliers (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  contact_name     text,
  email            text,
  phone            text,
  website          text,
  country          text,
  lead_time_days   integer NOT NULL DEFAULT 7,
  rating           numeric(2,1) CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  minimum_order    numeric(10,2) NOT NULL DEFAULT 0,
  is_active        boolean NOT NULL DEFAULT true,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE TRIGGER suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage suppliers"
  ON suppliers FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Index
CREATE INDEX IF NOT EXISTS suppliers_is_active_idx ON suppliers (is_active);

-- Add FK from products.supplier_id → suppliers.id (advisory only, not enforced if supplier_id was already text)
-- Products table already has supplier_id uuid column from migration 001
ALTER TABLE products
  ADD CONSTRAINT products_supplier_id_fkey
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;
