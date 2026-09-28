-- メッセージを送れる相手を広げる（相互いいねを待たずに会話できるようにする）
-- 送れる相手：
--   1. 自分のおすすめ（マッチング結果）に表示された相手
--   2. 自分にいいねをくれた相手
--   3. すでにやりとりが始まっている相手（どちらかが一度でも送ったことがある）
drop policy "マッチングした相手にだけ送信" on public.messages;

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
