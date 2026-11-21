-- MediBook row level security.
-- Authorization lives here, never in the UI alone.

alter table medibook.profiles enable row level security;
alter table medibook.departments enable row level security;
alter table medibook.doctors enable row level security;
alter table medibook.doctor_availability enable row level security;
alter table medibook.doctor_time_off enable row level security;
alter table medibook.appointments enable row level security;
alter table medibook.notifications_log enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create policy "profiles_select_visible"
  on medibook.profiles for select
  to authenticated
  using (medibook.can_view_profile(id));

create policy "profiles_update_self_or_admin"
  on medibook.profiles for update
  to authenticated
  using (id = auth.uid() or medibook.is_admin())
  with check (id = auth.uid() or medibook.is_admin());

-- ---------------------------------------------------------------------------
-- departments
-- ---------------------------------------------------------------------------

create policy "departments_select_authenticated"
  on medibook.departments for select
  to authenticated
  using (true);

create policy "departments_admin_insert"
  on medibook.departments for insert
  to authenticated
  with check (medibook.is_admin());

create policy "departments_admin_update"
  on medibook.departments for update
  to authenticated
  using (medibook.is_admin())
  with check (medibook.is_admin());

create policy "departments_admin_delete"
  on medibook.departments for delete
  to authenticated
  using (medibook.is_admin());

-- ---------------------------------------------------------------------------
-- doctors
-- ---------------------------------------------------------------------------

create policy "doctors_select_authenticated"
  on medibook.doctors for select
  to authenticated
  using (true);

create policy "doctors_admin_insert"
  on medibook.doctors for insert
  to authenticated
  with check (medibook.is_admin());

create policy "doctors_admin_update"
  on medibook.doctors for update
  to authenticated
  using (medibook.is_admin())
  with check (medibook.is_admin());

create policy "doctors_self_update"
  on medibook.doctors for update
  to authenticated
  using (medibook.owns_doctor(id))
  with check (medibook.owns_doctor(id));

create policy "doctors_admin_delete"
  on medibook.doctors for delete
  to authenticated
  using (medibook.is_admin());

-- ---------------------------------------------------------------------------
-- doctor_availability
-- ---------------------------------------------------------------------------

create policy "availability_select_authenticated"
  on medibook.doctor_availability for select
  to authenticated
  using (true);

create policy "availability_owner_insert"
  on medibook.doctor_availability for insert
  to authenticated
  with check (medibook.is_admin() or medibook.owns_doctor(doctor_id));

create policy "availability_owner_update"
  on medibook.doctor_availability for update
  to authenticated
  using (medibook.is_admin() or medibook.owns_doctor(doctor_id))
  with check (medibook.is_admin() or medibook.owns_doctor(doctor_id));

create policy "availability_owner_delete"
  on medibook.doctor_availability for delete
  to authenticated
  using (medibook.is_admin() or medibook.owns_doctor(doctor_id));

-- ---------------------------------------------------------------------------
-- doctor_time_off
-- ---------------------------------------------------------------------------

create policy "time_off_select_authenticated"
  on medibook.doctor_time_off for select
  to authenticated
  using (true);

create policy "time_off_owner_insert"
  on medibook.doctor_time_off for insert
  to authenticated
  with check (medibook.is_admin() or medibook.owns_doctor(doctor_id));

create policy "time_off_owner_update"
  on medibook.doctor_time_off for update
  to authenticated
  using (medibook.is_admin() or medibook.owns_doctor(doctor_id))
  with check (medibook.is_admin() or medibook.owns_doctor(doctor_id));

create policy "time_off_owner_delete"
  on medibook.doctor_time_off for delete
  to authenticated
  using (medibook.is_admin() or medibook.owns_doctor(doctor_id));

-- ---------------------------------------------------------------------------
-- appointments
-- ---------------------------------------------------------------------------

create policy "appointments_select_own_doctor_admin"
  on medibook.appointments for select
  to authenticated
  using (
    patient_id = auth.uid()
    or medibook.is_admin()
    or medibook.owns_doctor(doctor_id)
  );

create policy "appointments_patient_insert"
  on medibook.appointments for insert
  to authenticated
  with check (patient_id = auth.uid());

create policy "appointments_update_own_doctor_admin"
  on medibook.appointments for update
  to authenticated
  using (
    patient_id = auth.uid()
    or medibook.is_admin()
    or medibook.owns_doctor(doctor_id)
  )
  with check (
    patient_id = auth.uid()
    or medibook.is_admin()
    or medibook.owns_doctor(doctor_id)
  );

create policy "appointments_admin_delete"
  on medibook.appointments for delete
  to authenticated
  using (medibook.is_admin());

-- ---------------------------------------------------------------------------
-- notifications_log (written by Edge Functions with the service role)
-- ---------------------------------------------------------------------------

create policy "notifications_admin_select"
  on medibook.notifications_log for select
  to authenticated
  using (medibook.is_admin());
