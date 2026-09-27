-- プロフィール写真の保存場所（Supabase Storage）
-- public = false：URL を知っていても見られない。閲覧はサーバーが発行する期限付き URL だけ
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

-- 写真は「ユーザーID/ファイル名」に保存する。自分のフォルダだけ読み書きできる
create policy "自分の写真をアップロード" on storage.objects
  for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "自分の写真を閲覧" on storage.objects
  for select using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "自分の写真を更新" on storage.objects
  for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "自分の写真を削除" on storage.objects
  for delete using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- プロフィールに写真の保存場所（パス）を記録する列
alter table public.profiles add column avatar_path text;
