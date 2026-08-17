-- Create the "images" bucket
insert into storage.buckets (id, name, public) 
values ('images', 'images', true)
on conflict (id) do nothing;

-- Set up policies for the images bucket
create policy "Public Access" 
on storage.objects for select 
to public 
using ( bucket_id = 'images' );

create policy "Authenticated Users can Upload" 
on storage.objects for insert 
to authenticated 
with check ( bucket_id = 'images' );

create policy "Users can Update their own images" 
on storage.objects for update 
to authenticated 
using ( bucket_id = 'images' and auth.uid() = owner );

create policy "Users can Delete their own images" 
on storage.objects for delete 
to authenticated 
using ( bucket_id = 'images' and auth.uid() = owner );
