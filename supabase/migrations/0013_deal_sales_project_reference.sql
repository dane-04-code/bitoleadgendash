-- Project / purchase-order reference recorded when a deal is won.
ALTER TABLE deal_sales
  ADD COLUMN IF NOT EXISTS project_reference TEXT;
