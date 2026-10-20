-- Leads del formulario de pabloreina.com
create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  email       text not null check (char_length(email) <= 254),
  message     text not null check (char_length(message) <= 4000),
  stack       text[] not null default '{}',
  questions   text[] not null default '{}',
  locale      text not null default 'es' check (locale in ('es', 'en')),
  consent     boolean not null check (consent),
  user_agent  text
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);

-- RLS activado y sin políticas: solo el service role (el endpoint del servidor) puede leer y escribir.
alter table public.leads enable row level security;

comment on table public.leads is 'Contactos del formulario de pabloreina.com. Escribe solo /api/lead con la service role key.';
