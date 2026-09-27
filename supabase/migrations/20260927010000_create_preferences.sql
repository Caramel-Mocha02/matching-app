-- 自分の外見・清潔感（項目が多いので JSON 形式でまとめて保存する）
alter table public.profiles
  add column appearance jsonb not null default '{}',
  add column cleanliness jsonb not null default '{}';

-- 相手への希望（1ユーザーにつき1行。id はログインユーザーの ID）
create table public.preferences (
  id uuid primary key references auth.users (id) on delete cascade,
  must_conditions jsonb not null default '{}',  -- 必須条件。キーは profiles の列名とそろえる
  appearance jsonb not null default '{}',       -- 外見の好み
  cleanliness jsonb not null default '{}',      -- 清潔感の重視度
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS：ログインユーザーは「自分の行」だけ読み書きできる
alter table public.preferences enable row level security;

create policy "自分の希望条件を閲覧" on public.preferences
  for select using (auth.uid() = id);

create policy "自分の希望条件を作成" on public.preferences
  for insert with check (auth.uid() = id);

create policy "自分の希望条件を更新" on public.preferences
  for update using (auth.uid() = id);
