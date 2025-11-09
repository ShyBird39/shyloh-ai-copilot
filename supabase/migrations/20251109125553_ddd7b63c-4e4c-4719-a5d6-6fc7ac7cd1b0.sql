-- Add new sales mix categories to restaurant_kpis table
ALTER TABLE restaurant_kpis
  ADD COLUMN sales_mix_retail numeric,
  ADD COLUMN sales_mix_room_fees numeric,
  ADD COLUMN sales_mix_other numeric,
  ADD COLUMN sales_mix_other_label text;