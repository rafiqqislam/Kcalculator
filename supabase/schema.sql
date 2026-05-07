-- ============================================================
-- Nourish — Grocery Receipt Tracker
-- Run this in your Supabase SQL editor to set up the database.
-- After running, create a Storage bucket named "receipts"
-- and set it to public in Supabase Storage settings.
-- ============================================================

create table receipts (
    id          uuid default gen_random_uuid() primary key,
    store_name  text,
    purchased_at date,
    total_amount numeric(10, 2),
    image_url   text,
    created_at  timestamp with time zone default now()
);

create table receipt_items (
    id           uuid default gen_random_uuid() primary key,
    receipt_id   uuid references receipts(id) on delete cascade,
    name         text not null,
    quantity     numeric(10, 3),
    unit         text,
    price        numeric(10, 2),
    food_group   text not null,
    nutrient_tags text[] default '{}',
    created_at   timestamp with time zone default now()
);

-- Caches item→category mappings so Claude is called less over time
create table item_cache (
    id               uuid default gen_random_uuid() primary key,
    name_normalized  text unique not null,
    food_group       text not null,
    nutrient_tags    text[] default '{}',
    created_at       timestamp with time zone default now()
);

create index idx_receipt_items_receipt_id  on receipt_items(receipt_id);
create index idx_receipt_items_food_group  on receipt_items(food_group);
create index idx_receipts_purchased_at     on receipts(purchased_at desc);
create index idx_item_cache_name           on item_cache(name_normalized);
