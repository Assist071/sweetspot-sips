-- Create a new bucket for product images
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Allow public access to read images
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'product-images' );

-- Allow authenticated admins to upload images
-- Note: This assumes 'admin' role or similar metadata exists. 
-- For simplicity, we'll allow all authenticated users for now, 
-- but ideally, this should be restricted to admin accounts.
create policy "Admin Upload Access"
on storage.objects for insert
with check (
  bucket_id = 'product-images' 
  and auth.role() = 'authenticated'
);

-- Allow admins to delete/update images
create policy "Admin Update Access"
on storage.objects for update
using ( bucket_id = 'product-images' and auth.role() = 'authenticated' );

create policy "Admin Delete Access"
on storage.objects for delete
using ( bucket_id = 'product-images' and auth.role() = 'authenticated' );
