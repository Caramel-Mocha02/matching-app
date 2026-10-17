-- ============================================================
-- 年齢確認
-- ============================================================
-- 1ユーザーにつき1行。状態を変えられるのはサーバー（Secret key）だけにするため、
-- ユーザー本人には「読む」ことしか許可しない（提出・承認はサーバーの API 経由で行う）
create table public.age_verifications (
  user_id uuid primary key references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  document_path text,          -- 本人確認書類の画像の保存場所（審査が終わったら削除して null にする）
  birth_date date,             -- 本人が入力した生年月日（審査で書類と照らし合わせる）
  note text,                   -- 差し戻しの理由など、運営からのメッセージ
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table public.age_verifications enable row level security;

create policy "自分の年齢確認の状態を閲覧" on public.age_verifications
  for select using (auth.uid() = user_id);

-- 本人確認書類の保存場所（非公開。ユーザーは自分のフォルダへのアップロードだけ可能で、読み出しはサーバーのみ）
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('id-documents', 'id-documents', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']);

create policy "本人確認書類をアップロード" on storage.objects
  for insert with check (bucket_id = 'id-documents' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- メッセージは、年齢確認が済んだ人だけが送れるようにする
-- ============================================================
drop policy "おすすめ・いいねをくれた相手・やりとり中の相手に送信" on public.messages;

create policy "年齢確認済みの人が、おすすめ・いいねをくれた相手・やりとり中の相手に送信" on public.messages
  for insert with check (
    auth.uid() = sender_id
    and sender_id <> receiver_id
    and exists (
      select 1 from public.age_verifications v
      where v.user_id = messages.sender_id and v.status = 'verified'
    )
    and (
      exists (
        select 1 from public.matching_results r
        where r.user_id = messages.sender_id and r.partner_id = messages.receiver_id
      )
      or exists (
        select 1 from public.likes l
        where l.from_user = messages.receiver_id and l.to_user = messages.sender_id
      )
      or exists (
        select 1 from public.messages m
        where (m.sender_id = messages.receiver_id and m.receiver_id = messages.sender_id)
           or (m.sender_id = messages.sender_id and m.receiver_id = messages.receiver_id)
      )
    )
  );

-- 今いるテストユーザーは、年齢確認済みにしておく（会話のサンプルを動かすため）
insert into public.age_verifications (user_id, status, reviewed_at)
select id, 'verified', now() from auth.users where raw_user_meta_data ->> 'dummy' = 'true'
on conflict (user_id) do update set status = 'verified', reviewed_at = now();
