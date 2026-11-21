-- Enable Realtime for live slot availability.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'medibook'
      and tablename = 'appointments'
  ) then
    alter publication supabase_realtime add table medibook.appointments;
  end if;
end;
$$;

-- Baseline departments for a fresh install.
insert into medibook.departments (name, description) values
  ('Cardiology', 'Heart and vascular care'),
  ('Dermatology', 'Skin, hair and nails'),
  ('General Medicine', 'Primary care and general health'),
  ('Orthopedics', 'Bones, joints and muscles'),
  ('Pediatrics', 'Child health and development'),
  ('Neurology', 'Brain and nervous system'),
  ('Gynecology', 'Women''s health'),
  ('ENT', 'Ear, nose and throat')
on conflict (name) do nothing;
