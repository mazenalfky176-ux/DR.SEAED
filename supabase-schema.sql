-- Run on the existing project's SQL editor after taking a database backup.
-- Application data is accessed ONLY by the server service role. Browser roles have no grants.
begin;

create table if not exists public.clinic_content (
 id text primary key check (id='default'), data jsonb not null,
 version integer not null default 1 check(version>0), updated_at timestamptz not null default now()
);
create table if not exists public.clinic_appointments (
 id uuid primary key default gen_random_uuid(), legacy_id text unique,
 data jsonb not null, status text not null default 'New' check(status in ('New','Contacted','Confirmed','Completed','Cancelled')),
 version integer not null default 1 check(version>0), created_at timestamptz not null default now()
);
create table if not exists public.clinic_reviews (
 id uuid primary key default gen_random_uuid(), legacy_id text unique,
 data jsonb not null, status text not null default 'pending' check(status in ('pending','approved')),
 version integer not null default 1 check(version>0), created_at timestamptz not null default now()
);
create table if not exists public.clinic_sessions (
 token_hash text primary key check(length(token_hash)=64), user_id uuid not null,
 expires_at timestamptz not null
);
create table if not exists public.clinic_rate_limits (
 key text primary key, count integer not null, expires_at timestamptz not null
);
create index if not exists clinic_appointments_created on public.clinic_appointments(created_at desc);
create index if not exists clinic_reviews_status_created on public.clinic_reviews(status,created_at desc);
create index if not exists clinic_sessions_user on public.clinic_sessions(user_id);
create index if not exists clinic_sessions_expiry on public.clinic_sessions(expires_at);
create index if not exists clinic_rate_expiry on public.clinic_rate_limits(expires_at);

-- Migrate legacy appointment copies before removing them from the public settings document.
-- Prefer the complete settings copy, then import table-only records. Re-runs preserve edited records.
do $$
declare item jsonb; old_document jsonb; normalized text;
begin
 if to_regclass('public.site_settings') is not null then
  execute 'select settings_json from public.site_settings where id=''default''' into old_document;
  if jsonb_typeof(old_document->'appointments')='array' then
   for item in select value from jsonb_array_elements(old_document->'appointments') loop
    normalized:=case lower(item->>'status') when 'confirmed' then 'Confirmed' when 'completed' then 'Completed' when 'cancelled' then 'Cancelled' when 'contacted' then 'Contacted' else 'New' end;
    insert into public.clinic_appointments(legacy_id,data,status) values(item->>'id',item-'id'-'status'-'version',normalized)
    on conflict(legacy_id) do nothing;
   end loop;
  end if;
  -- Only real legacy reviews are migrated, pending owner review. Never publish demo content as real.
  if jsonb_typeof(old_document->'testimonials')='array' then
   for item in select value from jsonb_array_elements(old_document->'testimonials') loop
    if coalesce((item->>'isDemo')::boolean,false)=false then
     insert into public.clinic_reviews(legacy_id,data) values(item->>'id',item) on conflict(legacy_id) do nothing;
    end if;
   end loop;
  end if;
  execute 'update public.site_settings set settings_json=settings_json-''ownerCode''-''adminPassword''-''appointments''';
 end if;
 if to_regclass('public.appointments') is not null then
  for item in execute 'select to_jsonb(a) from public.appointments a' loop
   normalized:=case lower(item->>'status') when 'confirmed' then 'Confirmed' when 'completed' then 'Completed' when 'cancelled' then 'Cancelled' when 'contacted' then 'Contacted' else 'New' end;
   insert into public.clinic_appointments(legacy_id,data,status)
   values(item->>'id',jsonb_build_object('patientName',item->>'patient_name','phone',item->>'phone','email',coalesce(item->>'email',''),'age',coalesce(item->>'age',''),'complaint',coalesce(item->>'complaint',''),'treatment',coalesce(item->>'treatment',''),'preferredDate',coalesce(item->>'preferred_date',''),'preferredTime',coalesce(item->>'preferred_time',''),'message',coalesce(item->>'message',''),'notes',coalesce(item->>'notes','')),normalized)
   on conflict(legacy_id) do nothing;
  end loop;
 end if;
end $$;
-- Normalize migrated review identifiers to the new immutable UUID.
update public.clinic_reviews set data=jsonb_set(data,'{id}',to_jsonb(id::text)) where data->>'id' is distinct from id::text;

-- Lock legacy and current application tables. No permissive policy survives this upgrade.
do $$
declare table_name text; policy_name text;
begin
 foreach table_name in array array['site_settings','services','testimonials','gallery','appointments','contact_messages','clinic_content','clinic_appointments','clinic_reviews','clinic_sessions','clinic_rate_limits'] loop
  if to_regclass('public.'||table_name) is not null then
   execute format('alter table public.%I enable row level security',table_name);
   execute format('revoke all on public.%I from anon, authenticated, public',table_name);
   execute format('grant all on public.%I to service_role',table_name);
   for policy_name in select policyname from pg_policies where schemaname='public' and tablename=table_name loop
    execute format('drop policy %I on public.%I',policy_name,table_name);
   end loop;
  end if;
 end loop;
end $$;

-- Invoker rights: only service_role has EXECUTE and table grants.
create or replace function public.clinic_rate_limit(request_key text,max_count integer,window_seconds integer)
returns boolean language plpgsql security invoker set search_path=public,pg_temp as $$
declare used integer;
begin
 if max_count<1 or max_count>100 or window_seconds<1 or window_seconds>86400 then return false; end if;
 delete from public.clinic_rate_limits where expires_at < now()-interval '1 day';
 insert into public.clinic_rate_limits(key,count,expires_at) values(request_key,1,now()+make_interval(secs=>window_seconds))
 on conflict(key) do update set count=case when clinic_rate_limits.expires_at<=now() then 1 else clinic_rate_limits.count+1 end,
 expires_at=case when clinic_rate_limits.expires_at<=now() then now()+make_interval(secs=>window_seconds) else clinic_rate_limits.expires_at end
 returning count into used;
 return used<=max_count;
end $$;
revoke all on function public.clinic_rate_limit(text,integer,integer) from public,anon,authenticated;
grant execute on function public.clinic_rate_limit(text,integer,integer) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('clinic-images','clinic-images',true,8388608,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
-- Remove only the old project's storage policies; leave other buckets' policies untouched.
do $$ declare item record; begin
 for item in select policyname from pg_policies where schemaname='storage' and tablename='objects' and (coalesce(qual,'') like '%website-images%' or coalesce(with_check,'') like '%website-images%' or coalesce(qual,'') like '%clinic-images%' or coalesce(with_check,'') like '%clinic-images%') loop
  execute format('drop policy %I on storage.objects',item.policyname);
 end loop;
end $$;
-- Public bucket URLs permit downloads; upload/update/delete remain server-only with no client policies.
-- Restrictive guard also blocks broad policies belonging to other buckets from granting clinic writes.
create policy clinic_storage_guard on storage.objects as restrictive for all to anon,authenticated
 using(bucket_id not in ('clinic-images','website-images'))
 with check(bucket_id not in ('clinic-images','website-images'));
commit;
