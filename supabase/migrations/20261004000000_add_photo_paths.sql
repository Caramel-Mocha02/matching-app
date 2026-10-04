-- プロフィール写真を複数枚（最大5枚）保存できるようにする。1枚目がメインの写真
alter table public.profiles
  add column photo_paths text[] not null default '{}'
  check (cardinality(photo_paths) <= 5);

-- これまでの写真（1枚）を新しい列に移す
update public.profiles
set photo_paths = array[avatar_path]
where avatar_path is not null;
