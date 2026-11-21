-- MediBook core schema
-- All application tables live in a dedicated `medibook` schema so the
-- project can coexist with other schemas in the same Supabase instance.

create schema if not exists medibook;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists medibook.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  role text not null default 'patient' check (role in ('patient', 'doctor', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists medibook.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists medibook.doctors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references medibook.profiles (id) on delete cascade,
  department_id uuid references medibook.departments (id) on delete set null,
  specialization text not null default '',
  fees integer not null default 0 check (fees >= 0),
  bio text not null default '',
  photo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists medibook.doctor_availability (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references medibook.doctors (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  slot_minutes smallint not null default 30 check (slot_minutes between 5 and 240),
  created_at timestamptz not null default now(),
  unique (doctor_id, weekday),
  check (end_time > start_time)
);

create table if not exists medibook.doctor_time_off (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references medibook.doctors (id) on delete cascade,
  date date not null,
  reason text not null default '',
  created_at timestamptz not null default now(),
  unique (doctor_id, date)
);

create table if not exists medibook.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references medibook.profiles (id) on delete cascade,
  doctor_id uuid not null references medibook.doctors (id) on delete cascade,
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'completed', 'cancelled', 'rejected')),
  reason text not null default '',
  doctor_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);

-- Invariant 1: a doctor cannot hold two active appointments in the same slot.
create unique index if not exists appointments_no_double_booking
  on medibook.appointments (doctor_id, appointment_date, start_time)
  where status not in ('cancelled', 'rejected');

create index if not exists appointments_patient_idx
  on medibook.appointments (patient_id, appointment_date desc);
create index if not exists appointments_doctor_idx
  on medibook.appointments (doctor_id, appointment_date desc);
create index if not exists appointments_date_idx
  on medibook.appointments (appointment_date);

create table if not exists medibook.notifications_log (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references medibook.appointments (id) on delete cascade,
  type text not null check (type in ('booking', 'confirmation', 'cancellation', 'reminder')),
  sent_at timestamptz not null default now(),
  unique (appointment_id, type)
);

-- ---------------------------------------------------------------------------
-- Authorization helpers (security definer so they can read profiles safely)
-- ---------------------------------------------------------------------------

create or replace function medibook.user_role()
returns text
language sql
stable
security definer
set search_path = medibook, pg_temp
as $$
  select role from medibook.profiles where id = auth.uid();
$$;

create or replace function medibook.is_admin()
returns boolean
language sql
stable
security definer
set search_path = medibook, pg_temp
as $$
  select coalesce((select role = 'admin' from medibook.profiles where id = auth.uid()), false);
$$;

create or replace function medibook.is_doctor()
returns boolean
language sql
stable
security definer
set search_path = medibook, pg_temp
as $$
  select coalesce((select role = 'doctor' from medibook.profiles where id = auth.uid()), false);
$$;

create or replace function medibook.owns_doctor(p_doctor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = medibook, pg_temp
as $$
  select exists (
    select 1 from medibook.doctors d
    where d.id = p_doctor_id and d.profile_id = auth.uid()
  );
$$;

create or replace function medibook.can_view_profile(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = medibook, pg_temp
as $$
  select p_id = auth.uid()
    or exists (select 1 from medibook.profiles p where p.id = auth.uid() and p.role = 'admin')
    -- Doctor directory is readable by every signed-in user.
    or exists (select 1 from medibook.profiles p where p.id = p_id and p.role = 'doctor')
    -- Doctors can read patients who have an appointment with them.
    or exists (
      select 1
      from medibook.appointments a
      join medibook.doctors d on d.id = a.doctor_id
      where a.patient_id = p_id and d.profile_id = auth.uid()
    );
$$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create or replace function medibook.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on medibook.profiles;
create trigger profiles_touch_updated_at
  before update on medibook.profiles
  for each row execute function medibook.touch_updated_at();

drop trigger if exists doctors_touch_updated_at on medibook.doctors;
create trigger doctors_touch_updated_at
  before update on medibook.doctors
  for each row execute function medibook.touch_updated_at();

drop trigger if exists appointments_touch_updated_at on medibook.appointments;
create trigger appointments_touch_updated_at
  before update on medibook.appointments
  for each row execute function medibook.touch_updated_at();

-- Invariant 4: users can never change their own role.
create or replace function medibook.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = medibook, pg_temp
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not medibook.is_admin() then
    raise exception 'Only administrators can change a user role';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_role on medibook.profiles;
create trigger profiles_protect_role
  before update on medibook.profiles
  for each row execute function medibook.protect_profile_role();

-- Create a profile row for every new auth user.
create or replace function medibook.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = medibook, pg_temp
as $$
begin
  insert into medibook.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    'patient'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_medibook on auth.users;
create trigger on_auth_user_created_medibook
  after insert on auth.users
  for each row execute function medibook.handle_new_user();

-- Doctors may edit their professional profile but not their account wiring.
create or replace function medibook.enforce_doctor_update()
returns trigger
language plpgsql
security definer
set search_path = medibook, pg_temp
as $$
begin
  if auth.uid() is null or medibook.is_admin() then
    return new;
  end if;

  if medibook.owns_doctor(old.id) then
    if new.profile_id is distinct from old.profile_id
       or new.department_id is distinct from old.department_id
       or new.is_active is distinct from old.is_active then
      raise exception 'Doctors can only update their professional profile';
    end if;
    return new;
  end if;

  raise exception 'Not allowed to update this doctor';
end;
$$;

drop trigger if exists doctors_enforce_update on medibook.doctors;
create trigger doctors_enforce_update
  before update on medibook.doctors
  for each row execute function medibook.enforce_doctor_update();

-- Patients may only cancel. Doctors may only move their own appointments
-- through the defined status flow. Admins are unrestricted.
create or replace function medibook.enforce_appointment_update()
returns trigger
language plpgsql
security definer
set search_path = medibook, pg_temp
as $$
declare
  v_role text;
begin
  if auth.uid() is null or medibook.is_admin() then
    return new;
  end if;

  v_role := medibook.user_role();

  if v_role = 'patient' then
    if new.patient_id is distinct from old.patient_id
       or new.doctor_id is distinct from old.doctor_id
       or new.appointment_date is distinct from old.appointment_date
       or new.start_time is distinct from old.start_time
       or new.end_time is distinct from old.end_time
       or new.reason is distinct from old.reason
       or new.doctor_notes is distinct from old.doctor_notes then
      raise exception 'Patients can only cancel their appointments';
    end if;

    if new.status is distinct from old.status
       and (new.status <> 'cancelled' or old.status not in ('pending', 'confirmed')) then
      raise exception 'Invalid status change for a patient';
    end if;

    return new;
  end if;

  if v_role = 'doctor' then
    if not medibook.owns_doctor(old.doctor_id) then
      raise exception 'This appointment does not belong to you';
    end if;

    if new.patient_id is distinct from old.patient_id
       or new.doctor_id is distinct from old.doctor_id
       or new.appointment_date is distinct from old.appointment_date
       or new.start_time is distinct from old.start_time
       or new.end_time is distinct from old.end_time
       or new.reason is distinct from old.reason then
      raise exception 'Doctors can only update status and notes';
    end if;

    if new.status is distinct from old.status
       and not (
         (old.status = 'pending' and new.status in ('confirmed', 'rejected'))
         or (old.status = 'confirmed' and new.status in ('completed', 'cancelled'))
       ) then
      raise exception 'Invalid status transition';
    end if;

    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists appointments_enforce_update on medibook.appointments;
create trigger appointments_enforce_update
  before update on medibook.appointments
  for each row execute function medibook.enforce_appointment_update();

-- Validate a booking against availability rules, time off and the clock.
create or replace function medibook.validate_appointment_insert()
returns trigger
language plpgsql
security definer
set search_path = medibook, pg_temp
as $$
declare
  v_today date := (now() at time zone 'Asia/Kolkata')::date;
  v_now time := (now() at time zone 'Asia/Kolkata')::time;
  v_rule medibook.doctor_availability%rowtype;
begin
  -- Trusted contexts (service role, migrations, dashboard) bypass the checks.
  if auth.uid() is null then
    return new;
  end if;

  if new.patient_id <> auth.uid() then
    raise exception 'You can only book appointments for yourself';
  end if;

  if not exists (
    select 1 from medibook.doctors d where d.id = new.doctor_id and d.is_active
  ) then
    raise exception 'This doctor is not accepting appointments';
  end if;

  if new.appointment_date < v_today then
    raise exception 'Appointment date is in the past';
  end if;

  if new.appointment_date = v_today and new.start_time <= v_now then
    raise exception 'That time slot has already passed';
  end if;

  select *
  into v_rule
  from medibook.doctor_availability a
  where a.doctor_id = new.doctor_id
    and a.weekday = extract(dow from new.appointment_date)::smallint;

  if not found then
    raise exception 'The doctor has no availability on this day';
  end if;

  if new.start_time < v_rule.start_time
     or new.end_time > v_rule.end_time
     or new.end_time <> new.start_time + make_interval(mins => v_rule.slot_minutes)
     or mod(
          (extract(epoch from (new.start_time - v_rule.start_time)) / 60)::int,
          v_rule.slot_minutes
        ) <> 0 then
    raise exception 'That time does not match an available slot';
  end if;

  if exists (
    select 1 from medibook.doctor_time_off t
    where t.doctor_id = new.doctor_id and t.date = new.appointment_date
  ) then
    raise exception 'The doctor is unavailable on this date';
  end if;

  return new;
end;
$$;

drop trigger if exists appointments_validate_insert on medibook.appointments;
create trigger appointments_validate_insert
  before insert on medibook.appointments
  for each row execute function medibook.validate_appointment_insert();

-- ---------------------------------------------------------------------------
-- Grants and PostgREST exposure
-- ---------------------------------------------------------------------------

grant usage on schema medibook to anon, authenticated, service_role;

grant select on medibook.profiles,
  medibook.departments,
  medibook.doctors,
  medibook.doctor_availability,
  medibook.doctor_time_off,
  medibook.appointments,
  medibook.notifications_log
  to authenticated;

grant insert, update, delete on medibook.appointments to authenticated;
grant insert, update, delete on medibook.departments to authenticated;
grant insert, update, delete on medibook.doctors to authenticated;
grant insert, update, delete on medibook.doctor_availability to authenticated;
grant insert, update, delete on medibook.doctor_time_off to authenticated;
grant update on medibook.profiles to authenticated;

grant all on all tables in schema medibook to service_role;

grant execute on function medibook.user_role() to authenticated, service_role;
grant execute on function medibook.is_admin() to authenticated, service_role;
grant execute on function medibook.is_doctor() to authenticated, service_role;
grant execute on function medibook.owns_doctor(uuid) to authenticated, service_role;
grant execute on function medibook.can_view_profile(uuid) to authenticated, service_role;

alter role authenticator set pgrst.db_schemas = 'public, storage, graphql_public, medibook';
notify pgrst, 'reload config';
