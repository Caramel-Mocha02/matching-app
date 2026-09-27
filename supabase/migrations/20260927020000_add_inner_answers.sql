-- 性格・会話・生活価値観の回答（項目が多いので JSON 形式でまとめて保存する）
alter table public.profiles
  add column personality jsonb not null default '{}',
  add column communication jsonb not null default '{}',
  add column lifestyle jsonb not null default '{}';
