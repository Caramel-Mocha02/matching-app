-- ============================================================
-- いいね
-- ============================================================
-- 1行 =「from_user が to_user にいいねした」。お互いにいいねしたらマッチング成立
create table public.likes (
  from_user uuid not null references auth.users (id) on delete cascade,
  to_user uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (from_user, to_user),     -- 同じ相手に2回いいねできない
  check (from_user <> to_user)          -- 自分にはいいねできない
);

create index likes_to_user_idx on public.likes (to_user);

alter table public.likes enable row level security;

-- 自分が送った・もらったいいねだけ見られる
create policy "自分に関係するいいねを閲覧" on public.likes
  for select using (auth.uid() = from_user or auth.uid() = to_user);

-- いいねできるのは「自分のおすすめに出た相手」か「自分にいいねをくれた相手」だけ
create policy "おすすめの相手かいいねをくれた相手にいいね" on public.likes
  for insert with check (
    auth.uid() = from_user
    and (
      exists (
        select 1 from public.matching_results r
        where r.user_id = auth.uid() and r.partner_id = likes.to_user
      )
      or exists (
        select 1 from public.likes l
        where l.from_user = likes.to_user and l.to_user = auth.uid()
      )
    )
  );

-- 自分のいいねは取り消せる
create policy "自分のいいねを取り消し" on public.likes
  for delete using (auth.uid() = from_user);

-- ============================================================
-- メッセージ
-- ============================================================
create table public.messages (
  id bigint generated always as identity primary key,
  sender_id uuid not null references auth.users (id) on delete cascade,
  receiver_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now(),
  read_at timestamptz                   -- 相手が読んだ日時（未読なら null）
);

create index messages_pair_idx on public.messages (sender_id, receiver_id, created_at);
create index messages_receiver_idx on public.messages (receiver_id, created_at);

alter table public.messages enable row level security;

-- 自分が送った・受け取ったメッセージだけ見られる
create policy "自分のメッセージを閲覧" on public.messages
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- 送れるのは、お互いにいいねしている（マッチング成立した）相手だけ
create policy "マッチングした相手にだけ送信" on public.messages
  for insert with check (
    auth.uid() = sender_id
    and exists (select 1 from public.likes where from_user = sender_id and to_user = receiver_id)
    and exists (select 1 from public.likes where from_user = receiver_id and to_user = sender_id)
  );

-- 受け取った人は「既読」にできる（本文は書き換えられないよう、read_at 列だけ更新を許可する）
create policy "受け取ったメッセージを既読にする" on public.messages
  for update using (auth.uid() = receiver_id);
revoke update on public.messages from authenticated;
grant update (read_at) on public.messages to authenticated;

-- 新しいメッセージを、再読み込みしなくても画面に届ける（Supabase Realtime）
alter publication supabase_realtime add table public.messages;
