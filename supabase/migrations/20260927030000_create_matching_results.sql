-- マッチング結果（「マッチングする」を押すたびに作り直す）
-- 保存するのはサーバー（Secret key を使うため RLS の対象外）。ブラウザからは自分の結果の閲覧のみ可能
create table public.matching_results (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,     -- 結果を見る人
  partner_id uuid not null references auth.users (id) on delete cascade,  -- おすすめされた相手
  rank integer not null,               -- 何番目のおすすめか（1が最上位）
  total_score integer not null,        -- 総合相性スコア（0〜100）
  category_scores jsonb not null,      -- 分野別スコア { personality: 82, communication: 75, ... }
  details jsonb not null,              -- 相性が良い点・注意点（AI の説明文の材料にする）
  explanation text,                    -- AI による説明文（Phase 10 で使う）
  created_at timestamptz not null default now()
);

create index matching_results_user_id_idx on public.matching_results (user_id);

alter table public.matching_results enable row level security;

create policy "自分のマッチング結果を閲覧" on public.matching_results
  for select using (auth.uid() = user_id);
