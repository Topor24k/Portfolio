-- Portfolio projects + image storage.
-- Anyone may read published projects; only the portfolio owner may write.

-- ── Owner check ─────────────────────────────────────────────
-- True only for the signed-in owner account, and only once its email is confirmed.
create or replace function public.is_portfolio_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users
    where id = auth.uid()
      and lower(email) = 'kayeencampana@gmail.com'
      and email_confirmed_at is not null
  );
$$;

revoke all on function public.is_portfolio_admin() from public;
grant execute on function public.is_portfolio_admin() to anon, authenticated;

-- ── Projects ────────────────────────────────────────────────
create table if not exists public.projects (
  id            text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  sort_order    integer     not null default 0,
  published     boolean     not null default true,
  name          text        not null,
  tab           text        not null default '',
  project_type  text        not null default 'personal' check (project_type in ('client', 'personal')),
  category      text        not null default '',
  archive_date  text        not null default '',
  breadcrumbs   text        not null default '',
  description   text        not null default '',
  details       text        not null default '',
  overview      jsonb       not null default '{"p1": "", "p2": ""}'::jsonb,
  team_label    text        not null default '',
  team          jsonb       not null default '[]'::jsonb,  -- [{ name, role, image, alt }]
  disciplines   text[]      not null default '{}',
  cover         text        not null default '',
  alt           text        not null default '',
  gallery       jsonb       not null default '[]'::jsonb,  -- [{ src, alt, caption }]
  link          text        not null default '',
  artifacts     jsonb       not null default '[]'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists projects_sort_order_idx on public.projects (sort_order);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_touch_updated_at on public.projects;
create trigger projects_touch_updated_at
  before update on public.projects
  for each row execute function public.touch_updated_at();

alter table public.projects enable row level security;

grant select on public.projects to anon, authenticated;
grant insert, update, delete on public.projects to authenticated;

drop policy if exists "Published projects are public" on public.projects;
create policy "Published projects are public"
  on public.projects for select
  to anon, authenticated
  using (published or public.is_portfolio_admin());

drop policy if exists "Owner can add projects" on public.projects;
create policy "Owner can add projects"
  on public.projects for insert
  to authenticated
  with check (public.is_portfolio_admin());

drop policy if exists "Owner can edit projects" on public.projects;
create policy "Owner can edit projects"
  on public.projects for update
  to authenticated
  using (public.is_portfolio_admin())
  with check (public.is_portfolio_admin());

drop policy if exists "Owner can delete projects" on public.projects;
create policy "Owner can delete projects"
  on public.projects for delete
  to authenticated
  using (public.is_portfolio_admin());

-- ── Image storage ───────────────────────────────────────────
-- Public bucket: images are served by URL to every visitor; only the owner can change them.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio', 'portfolio', true, 15728640, array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Owner can read portfolio files" on storage.objects;
create policy "Owner can read portfolio files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'portfolio' and public.is_portfolio_admin());

drop policy if exists "Owner can upload portfolio files" on storage.objects;
create policy "Owner can upload portfolio files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'portfolio' and public.is_portfolio_admin());

drop policy if exists "Owner can replace portfolio files" on storage.objects;
create policy "Owner can replace portfolio files"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'portfolio' and public.is_portfolio_admin())
  with check (bucket_id = 'portfolio' and public.is_portfolio_admin());

drop policy if exists "Owner can delete portfolio files" on storage.objects;
create policy "Owner can delete portfolio files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'portfolio' and public.is_portfolio_admin());
