-- Required extensions
create extension if not exists "uuid-ossp";

-- Submission status enum
create type submission_status as enum (
  'pending',
  'processing',
  'graded',
  'error'
);

-- Activity type enum
create type activity_type as enum (
  'CREATE_CLASS',
  'ADD_STUDENT',
  'CREATE_EXAM',
  'GRADE_EXAM',
  'UPDATE_EXAM',
  'DELETE_EXAM'
);

create table teachers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null,
  created_at timestamptz default now()
);

create index idx_teachers_user_id on teachers(user_id);

create table classes (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references teachers(id) on delete cascade,
  class_name text not null,
  grade_level text not null,
  subject text not null,
  created_at timestamptz default now(),
  unique (teacher_id, class_name)
);

create index idx_classes_teacher_id on classes(teacher_id);

create table students (
  id uuid primary key default uuid_generate_v4(),
  class_id uuid not null references classes(id) on delete cascade,
  student_name text not null,
  student_id text not null, -- external / school ID
  created_at timestamptz default now(),
  unique (class_id, student_id)
);

create index idx_students_class_id on students(class_id);

create table exams (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references teachers(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  exam_name text not null,
  total_points integer not null check (total_points > 0),
  exam_date date not null,
  answer_key jsonb not null, -- structured rubric / correct answers
  created_at timestamptz default now()
);

create index idx_exams_teacher_id on exams(teacher_id);
create index idx_exams_class_id on exams(class_id);

create table exam_submissions (
  id uuid primary key default uuid_generate_v4(),
  exam_id uuid not null references exams(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  submission_image_url text not null,
  graded_score numeric(5,2) check (graded_score >= 0),
  feedback text,
  status submission_status not null default 'pending',
  created_at timestamptz default now(),
  graded_at timestamptz,
  unique (exam_id, student_id)
);

create index idx_submissions_exam_id on exam_submissions(exam_id);
create index idx_submissions_student_id on exam_submissions(student_id);
create index idx_submissions_status on exam_submissions(status);

create table activity_log (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references teachers(id) on delete cascade,
  activity_type activity_type not null,
  description text not null,
  created_at timestamptz default now()
);

create index idx_activity_teacher_id on activity_log(teacher_id);
create index idx_activity_created_at on activity_log(created_at desc);

alter table teachers enable row level security;
alter table classes enable row level security;
alter table students enable row level security;
alter table exams enable row level security;
alter table exam_submissions enable row level security;
alter table activity_log enable row level security;

create policy "Teachers can access their own profile"
on teachers
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Teachers manage their classes"
on classes
for all
using (
  teacher_id in (
    select id from teachers where user_id = auth.uid()
  )
)
with check (
  teacher_id in (
    select id from teachers where user_id = auth.uid()
  )
);

create policy "Teachers manage students in their classes"
on students
for all
using (
  class_id in (
    select c.id
    from classes c
    join teachers t on t.id = c.teacher_id
    where t.user_id = auth.uid()
  )
)
with check (
  class_id in (
    select c.id
    from classes c
    join teachers t on t.id = c.teacher_id
    where t.user_id = auth.uid()
  )
);

create policy "Teachers manage their exams"
on exams
for all
using (
  teacher_id in (
    select id from teachers where user_id = auth.uid()
  )
)
with check (
  teacher_id in (
    select id from teachers where user_id = auth.uid()
  )
);

create policy "Teachers access submissions of their exams"
on exam_submissions
for all
using (
  exam_id in (
    select e.id
    from exams e
    join teachers t on t.id = e.teacher_id
    where t.user_id = auth.uid()
  )
)
with check (
  exam_id in (
    select e.id
    from exams e
    join teachers t on t.id = e.teacher_id
    where t.user_id = auth.uid()
  )
);

create policy "Teachers view their activity logs"
on activity_log
for select
using (
  teacher_id in (
    select id from teachers where user_id = auth.uid()
  )
);

create policy "Teachers insert their activity logs"
on activity_log
for insert
with check (
  teacher_id in (
    select id from teachers where user_id = auth.uid()
  )
);
