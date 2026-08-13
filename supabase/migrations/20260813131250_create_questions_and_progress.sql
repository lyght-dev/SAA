create table public.questions (
  id text primary key,
  question_number smallint not null unique,
  question text not null,
  choices jsonb not null,
  answers text[] not null,
  content_domain text not null,
  content_task text not null,
  aws_services text[] not null default '{}',
  explanation jsonb not null,
  choice_evaluations jsonb not null,
  updated_at timestamptz not null default now(),
  constraint questions_id_format check (id ~ '^Q[0-9]{4}$'),
  constraint questions_number_range check (question_number between 1 and 100),
  constraint questions_choices_object check (jsonb_typeof(choices) = 'object'),
  constraint questions_answers_present check (cardinality(answers) > 0),
  constraint questions_explanation_object check (jsonb_typeof(explanation) = 'object'),
  constraint questions_evaluations_object check (jsonb_typeof(choice_evaluations) = 'object')
);

create table public.question_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null references public.questions(id) on delete cascade,
  selected_answers text[] not null,
  is_correct boolean not null,
  answered_at timestamptz not null default now(),
  primary key (user_id, question_id),
  constraint question_progress_answers_present check (cardinality(selected_answers) > 0)
);

create function public.calculate_question_progress_correctness()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  correct_answers text[];
begin
  select array(select unnest(questions.answers) order by 1)
  into correct_answers
  from public.questions
  where questions.id = new.question_id;

  new.is_correct := array(select unnest(new.selected_answers) order by 1) = correct_answers;
  new.answered_at := now();
  return new;
end;
$$;

create trigger calculate_progress_correctness
before insert or update of selected_answers on public.question_progress
for each row execute function public.calculate_question_progress_correctness();

alter table public.questions enable row level security;
alter table public.question_progress enable row level security;

grant select on table public.questions to anon, authenticated;
grant select on table public.questions to service_role;
grant select, insert, update on table public.question_progress to authenticated;
grant select, insert, update, delete on table public.question_progress to service_role;
revoke all on function public.calculate_question_progress_correctness() from public;

create policy "Questions are readable by everyone"
on public.questions
for select
to anon, authenticated
using (true);

create policy "Users can read their own progress"
on public.question_progress
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own progress"
on public.question_progress
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own progress"
on public.question_progress
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
