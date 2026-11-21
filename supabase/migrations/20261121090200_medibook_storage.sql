-- Doctor profile photos live in a public Supabase Storage bucket.
-- Only the file path is stored in the database.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'doctor-photos',
  'doctor-photos',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "doctor_photos_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'doctor-photos');

create policy "doctor_photos_admin_or_owner_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'doctor-photos'
    and (
      medibook.is_admin()
      or exists (
        select 1 from medibook.doctors d where d.profile_id = auth.uid()
      )
    )
  );

create policy "doctor_photos_admin_or_owner_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'doctor-photos'
    and (
      medibook.is_admin()
      or exists (
        select 1 from medibook.doctors d where d.profile_id = auth.uid()
      )
    )
  )
  with check (
    bucket_id = 'doctor-photos'
    and (
      medibook.is_admin()
      or exists (
        select 1 from medibook.doctors d where d.profile_id = auth.uid()
      )
    )
  );

create policy "doctor_photos_admin_or_owner_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'doctor-photos'
    and (
      medibook.is_admin()
      or exists (
        select 1 from medibook.doctors d where d.profile_id = auth.uid()
      )
    )
  );
