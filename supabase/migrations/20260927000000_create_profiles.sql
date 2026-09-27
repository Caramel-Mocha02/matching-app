-- ユーザー自身のプロフィール（基本情報・結婚に関する情報）
-- 1ユーザーにつき1行。id はログインユーザーの ID（auth.users.id）と同じ値を使う
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,

  -- 基本情報
  nickname text,
  age integer check (age between 18 and 99),
  gender text,
  prefecture text,
  occupation text,
  annual_income integer,        -- 年収（万円）。選択肢の下限値を保存（例：400 = 400〜500万円）
  education text,
  marital_history text,
  has_children text,
  smoking text,

  -- 結婚に関する情報
  marriage_intent text,
  marriage_timing text,
  wants_children text,
  desired_children_count text,
  dual_income text,
  desired_residence text,
  relocation text,
  living_with_parents text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS（行レベルセキュリティ）：ログインユーザーは「自分の行」だけ読み書きできる
alter table public.profiles enable row level security;

create policy "自分のプロフィールを閲覧" on public.profiles
  for select using (auth.uid() = id);

create policy "自分のプロフィールを作成" on public.profiles
  for insert with check (auth.uid() = id);

create policy "自分のプロフィールを更新" on public.profiles
  for update using (auth.uid() = id);
