-- 年齢確認の機能をいったん取り消す（20261017000000_create_age_verifications.sql で追加したものを元に戻す）

-- メッセージを送れる条件を、年齢確認を追加する前のルールに戻す
drop policy "年齢確認済みの人が、おすすめ・いいねをくれた相手・やりとり中の相手に送信" on public.messages;

create policy "おすすめ・いいねをくれた相手・やりとり中の相手に送信" on public.messages
  for insert with check (
    auth.uid() = sender_id
    and sender_id <> receiver_id
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

-- 本人確認書類のアップロードの許可を削除する（保存場所そのものは、サーバーから削除する）
drop policy "本人確認書類をアップロード" on storage.objects;

-- 年齢確認の状態を保存していたテーブルを削除する
drop table public.age_verifications;
