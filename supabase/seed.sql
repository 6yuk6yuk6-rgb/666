-- Development seed data. Run after supabase/migration.sql.
-- Remove sample prompts later with:
-- delete from prompts where id in (
--   '00000000-0000-4000-8000-000000000101',
--   '00000000-0000-4000-8000-000000000102',
--   '00000000-0000-4000-8000-000000000103'
-- );

insert into categories (id, name)
values
  ('00000000-0000-4000-8000-000000000001', '의상'),
  ('00000000-0000-4000-8000-000000000002', '배경'),
  ('00000000-0000-4000-8000-000000000003', '포즈')
on conflict (id) do nothing;

insert into prompts (id, title, image_url, category_id, base_prompt)
values
  (
    '00000000-0000-4000-8000-000000000101',
    '로즈 다이어리 소녀',
    '/placeholder-prompt.svg',
    '00000000-0000-4000-8000-000000000001',
    'soft vintage diary illustration, gentle rose-gray palette, delicate character portrait, warm paper texture, dreamy but restrained mood'
  ),
  (
    '00000000-0000-4000-8000-000000000102',
    '세이지빛 작업실',
    '/placeholder-prompt.svg',
    '00000000-0000-4000-8000-000000000002',
    'cozy small studio, sage fabric curtains, cream desk, faded pink details, analog scrapbook atmosphere, soft daylight'
  ),
  (
    '00000000-0000-4000-8000-000000000103',
    '빈티지 커버 보이',
    '/placeholder-prompt.svg',
    '00000000-0000-4000-8000-000000000003',
    'gentle boy character, black hair, soft beige knit, vintage photo album composition, low saturation, tender expression'
  )
on conflict (id) do update
set
  title = excluded.title,
  image_url = excluded.image_url,
  category_id = excluded.category_id,
  base_prompt = excluded.base_prompt;

insert into prompt_sections (id, prompt_id, section_name, content, sort_order)
values
  (
    '00000000-0000-4000-8000-000000000201',
    '00000000-0000-4000-8000-000000000101',
    '의상 프롬프트',
    'ivory blouse, dusty rose ribbon, lace collar, soft cardigan, tiny heart accessory',
    1
  ),
  (
    '00000000-0000-4000-8000-000000000202',
    '00000000-0000-4000-8000-000000000101',
    '배경 프롬프트',
    'cream scrapbook page, translucent tape, small pressed flowers, muted rose border',
    2
  ),
  (
    '00000000-0000-4000-8000-000000000203',
    '00000000-0000-4000-8000-000000000102',
    '소품 프롬프트',
    'old camera, folded memo, pale ceramic cup, small heart sticker, tidy shelves',
    1
  ),
  (
    '00000000-0000-4000-8000-000000000204',
    '00000000-0000-4000-8000-000000000103',
    '포즈 프롬프트',
    'standing with one hand holding a small notebook, shy smile, relaxed shoulders',
    1
  ),
  (
    '00000000-0000-4000-8000-000000000205',
    '00000000-0000-4000-8000-000000000103',
    '네거티브 프롬프트',
    'neon colors, harsh contrast, heavy black shadows, distorted hands, noisy background',
    2
  )
on conflict (id) do update
set
  section_name = excluded.section_name,
  content = excluded.content,
  sort_order = excluded.sort_order;
