-- Visão computacional: código de barras/QR lido pela câmera do app.
alter table public.pantry_items
  add column if not exists barcode text;

create index if not exists pantry_items_user_barcode_idx
  on public.pantry_items (user_id, barcode);
