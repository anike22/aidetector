
-- Student submissions: a student submits an essay to a teacher assignment
create table if not exists student_submissions (
  id            uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references teacher_assignments(id) on delete cascade,
  student_id    uuid not null references auth.users(id) on delete cascade,
  essay_id      uuid references essays(id) on delete set null,
  title         text not null default '',
  content       text not null default '',
  word_count    int  not null default 0,
  status        text not null default 'submitted'
                check (status in ('submitted','under_review','reviewed','returned','accepted')),
  submitted_at  timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  student_note  text not null default '',
  -- snapshot of detection results at submission time
  balanced_ai_score  int,
  aggressive_ai_score int,
  quality_score      int
);

-- Teacher reviews of a submission
create table if not exists submission_reviews (
  id              uuid primary key default gen_random_uuid(),
  submission_id   uuid not null references student_submissions(id) on delete cascade,
  teacher_id      uuid not null references auth.users(id) on delete cascade,
  grade           text,               -- free-form: "A", "85/100", etc.
  overall_comment text not null default '',
  rubric_scores   jsonb not null default '{}',   -- {criterion: score}
  inline_comments jsonb not null default '[]',   -- [{offset,length,text}]
  ai_use_verdict  text not null default 'not_reviewed'
                  check (ai_use_verdict in ('not_reviewed','compliant','minor_concern','major_concern','violation')),
  reviewed_at     timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Indexes
create index if not exists idx_student_submissions_assignment on student_submissions(assignment_id);
create index if not exists idx_student_submissions_student    on student_submissions(student_id);
create index if not exists idx_submission_reviews_submission  on submission_reviews(submission_id);
create index if not exists idx_submission_reviews_teacher     on submission_reviews(teacher_id);

-- updated_at triggers
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists trg_student_submissions_updated_at on student_submissions;
create trigger trg_student_submissions_updated_at
  before update on student_submissions
  for each row execute function update_updated_at_column();

drop trigger if exists trg_submission_reviews_updated_at on submission_reviews;
create trigger trg_submission_reviews_updated_at
  before update on submission_reviews
  for each row execute function update_updated_at_column();

-- RLS
alter table student_submissions enable row level security;
alter table submission_reviews   enable row level security;

-- Students can insert/view their own submissions
create policy "students_insert_own_submission"
  on student_submissions for insert
  with check (auth.uid() = student_id);

create policy "students_view_own_submissions"
  on student_submissions for select
  using (auth.uid() = student_id);

create policy "students_update_own_draft"
  on student_submissions for update
  using (auth.uid() = student_id and status = 'submitted');

-- Teachers can view submissions for their assignments
create policy "teachers_view_assignment_submissions"
  on student_submissions for select
  using (
    exists (
      select 1 from teacher_assignments ta
      where ta.id = student_submissions.assignment_id
        and ta.teacher_id = auth.uid()
    )
  );

create policy "teachers_update_submission_status"
  on student_submissions for update
  using (
    exists (
      select 1 from teacher_assignments ta
      where ta.id = student_submissions.assignment_id
        and ta.teacher_id = auth.uid()
    )
  );

-- Teachers can insert/view/update their own reviews
create policy "teachers_insert_review"
  on submission_reviews for insert
  with check (auth.uid() = teacher_id);

create policy "teachers_view_own_reviews"
  on submission_reviews for select
  using (auth.uid() = teacher_id);

create policy "teachers_update_own_review"
  on submission_reviews for update
  using (auth.uid() = teacher_id);

-- Students can view reviews of their submissions
create policy "students_view_reviews_of_their_submissions"
  on submission_reviews for select
  using (
    exists (
      select 1 from student_submissions ss
      where ss.id = submission_reviews.submission_id
        and ss.student_id = auth.uid()
    )
  );
