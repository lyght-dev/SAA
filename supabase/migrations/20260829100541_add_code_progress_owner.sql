alter table public.question_progress
  drop constraint question_progress_pkey,
  alter column user_id drop not null,
  add column access_code_hash text;

alter table public.question_progress
  add constraint question_progress_has_one_owner check (
    (user_id is not null and access_code_hash is null)
    or (user_id is null and access_code_hash is not null)
  );

alter table public.question_progress
  add constraint question_progress_user_question_key unique (user_id, question_id),
  add constraint question_progress_code_question_key unique (access_code_hash, question_id);

create table public.study_code_progress_imports (
  access_code_hash text not null,
  source_user_id uuid not null references auth.users(id) on delete cascade,
  imported_at timestamptz not null default now(),
  primary key (access_code_hash, source_user_id)
);

alter table public.study_code_progress_imports enable row level security;

grant select, insert, update, delete on table public.study_code_progress_imports to service_role;
