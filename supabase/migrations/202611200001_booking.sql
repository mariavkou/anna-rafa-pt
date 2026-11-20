-- Run once in a new Supabase project's SQL editor. No example bookings or client data.
create extension if not exists btree_gist;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '', email text not null,
  role text not null default 'customer' check (role in ('customer','admin'))
);
create function public.create_booking_profile() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id,name,email) values(new.id,coalesce(new.raw_user_meta_data->>'name',''),new.email);
 return new;
end $$;
create trigger booking_profile_created after insert on auth.users for each row execute function public.create_booking_profile();

create function public.booking_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=auth.uid() and role='admin');
$$;
create table public.products (
 id text primary key, kind text not null check(kind in ('online','person','duo','group')),
 sessions integer not null check(sessions>0), price numeric not null check(price>=0),
 validity_months integer check(validity_months>0)
);
insert into public.products values
 ('online-5','online',5,450,null),('online-10','online',10,850,null),('online-20','online',20,1600,null),
 ('person-1','person',1,150,null),('person-10','person',10,1400,null),('person-20','person',20,2700,null),
 ('duo-1','duo',1,200,null),('duo-10','duo',10,1800,null),('duo-20','duo',20,3400,null),
 ('group-10','group',10,300,3),('group-20','group',20,560,6);
create table public.calendar_slots (
 id uuid primary key default gen_random_uuid(),
 starts_at timestamptz not null, ends_at timestamptz not null,
 kind text not null check(kind in ('personal','group')),
 capacity integer not null check(capacity>0), is_open boolean not null default true,
 check(ends_at=starts_at+interval '1 hour'),
 check((kind='personal' and capacity=1) or (kind='group' and capacity=6)),
 exclude using gist (tstzrange(starts_at,ends_at,'[)') with &&)
);
create table public.customer_packages (
 id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.profiles(id),
 product_id text not null references public.products(id), status text not null default 'pending' check(status in ('pending','active')),
 remaining integer not null check(remaining>=0), expires_at timestamptz, created_at timestamptz not null default now()
);
create table public.bookings (
 id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.profiles(id),
 package_id uuid not null references public.customer_packages(id), slot_id uuid not null references public.calendar_slots(id),
 status text not null default 'confirmed' check(status in ('confirmed','cancelled')),
 created_at timestamptz not null default now()
);
create unique index one_customer_per_class on public.bookings(customer_id,slot_id) where status='confirmed';
create index booking_slot_lookup on public.bookings(slot_id) where status='confirmed';
create index package_owner_lookup on public.customer_packages(customer_id);

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.calendar_slots enable row level security;
alter table public.customer_packages enable row level security;
alter table public.bookings enable row level security;
create policy profile_read on public.profiles for select to authenticated using(id=auth.uid() or public.booking_admin());
create policy product_read on public.products for select to anon,authenticated using(true);
create policy slot_admin_read on public.calendar_slots for select to authenticated using(public.booking_admin());
create policy package_read on public.customer_packages for select to authenticated using(customer_id=auth.uid() or public.booking_admin());
create policy booking_read on public.bookings for select to authenticated using(customer_id=auth.uid() or public.booking_admin());
-- All mutations go through narrowly scoped functions. Clients cannot grant roles or credits.
revoke all on public.profiles,public.products,public.calendar_slots,public.customer_packages,public.bookings from anon,authenticated;
grant select on public.products to anon,authenticated;
grant select on public.profiles,public.calendar_slots,public.customer_packages,public.bookings to authenticated;

create function public.calendar_slots() returns table(id uuid,starts_at timestamptz,ends_at timestamptz,kind text,capacity integer,is_open boolean,reserved bigint)
language sql stable security definer set search_path='' as $$
 select s.id,s.starts_at,s.ends_at,s.kind,s.capacity,s.is_open,
 (select count(*) from public.bookings b where b.slot_id=s.id and b.status='confirmed')
 from public.calendar_slots s where s.starts_at>now()-interval '1 day' order by s.starts_at;
$$;
create function public.request_package(p_product text) returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid; v_product public.products;
begin
 if auth.uid() is null then raise exception 'Please sign in first.'; end if;
 select * into strict v_product from public.products where id=p_product;
 -- Serialize repeat requests by the same customer to avoid duplicate pending packages.
 perform 1 from public.profiles where id=auth.uid() for update;
 select id into v_id from public.customer_packages where customer_id=auth.uid() and product_id=p_product
 and (status='pending' or (status='active' and remaining>0 and (expires_at is null or expires_at>now()))) order by created_at desc limit 1;
 if v_id is not null then return v_id; end if;
 insert into public.customer_packages(customer_id,product_id,remaining) values(auth.uid(),p_product,v_product.sessions) returning id into v_id;
 return v_id;
end $$;
create function public.activate_package(p_package uuid) returns void language plpgsql security definer set search_path='' as $$
declare v_pkg public.customer_packages; v_months integer;
begin
 if not public.booking_admin() then raise exception 'Admin access required.'; end if;
 select * into strict v_pkg from public.customer_packages where id=p_package for update;
 if v_pkg.status='active' then return; end if;
 select validity_months into v_months from public.products where id=v_pkg.product_id;
 update public.customer_packages set status='active',expires_at=case when v_months is null then null else now()+make_interval(months=>v_months) end where id=p_package;
end $$;
create function public.reserve_slot(p_package uuid,p_slot uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare v_slot public.calendar_slots; v_pkg public.customer_packages; v_kind text; v_id uuid;
begin
 if auth.uid() is null then raise exception 'Please sign in first.'; end if;
 -- Lock the slot before checking capacity, so simultaneous customers cannot overbook.
 select * into strict v_slot from public.calendar_slots where id=p_slot for update;
 select * into strict v_pkg from public.customer_packages where id=p_package for update;
 if v_pkg.customer_id<>auth.uid() then raise exception 'This package belongs to another customer.'; end if;
 if v_pkg.status<>'active' or v_pkg.remaining<1 then raise exception 'Your package needs activation or more sessions.'; end if;
 if v_pkg.expires_at is not null and (v_pkg.expires_at<=now() or v_slot.starts_at>=v_pkg.expires_at) then raise exception 'Choose a date before your package expires.'; end if;
 select kind into v_kind from public.products where id=v_pkg.product_id;
 if (v_kind='group')<>(v_slot.kind='group') or not v_slot.is_open or v_slot.starts_at<=now() then raise exception 'This slot is not available for your package.'; end if;
 if exists(select 1 from public.bookings where slot_id=p_slot and customer_id=auth.uid() and status='confirmed') then raise exception 'You already booked this class.'; end if;
 if (select count(*) from public.bookings where slot_id=p_slot and status='confirmed')>=v_slot.capacity then raise exception 'This time is now fully booked. Choose another.'; end if;
 insert into public.bookings(customer_id,package_id,slot_id) values(auth.uid(),p_package,p_slot) returning id into v_id;
 update public.customer_packages set remaining=remaining-1 where id=p_package;
 return v_id;
end $$;
create function public.cancel_booking(p_booking uuid) returns boolean language plpgsql security definer set search_path='' as $$
declare v_booking public.bookings; v_slot public.calendar_slots; v_refund boolean;
begin
 select * into strict v_booking from public.bookings where id=p_booking;
 select * into strict v_slot from public.calendar_slots where id=v_booking.slot_id for update;
 select * into strict v_booking from public.bookings where id=p_booking for update;
 -- A concurrent admin move may have changed the slot while we waited.
 select * into strict v_slot from public.calendar_slots where id=v_booking.slot_id for update;
 if auth.uid() is null or (v_booking.customer_id<>auth.uid() and not public.booking_admin()) then raise exception 'You cannot change this booking.'; end if;
 if v_booking.status<>'confirmed' then raise exception 'This booking has already been cancelled.'; end if;
 v_refund:=public.booking_admin() or v_slot.starts_at>=now()+interval '24 hours';
 update public.bookings set status='cancelled' where id=p_booking;
 if v_refund then update public.customer_packages set remaining=remaining+1 where id=v_booking.package_id; end if;
 return v_refund;
end $$;
create function public.save_calendar_slot(p_id uuid,p_start timestamptz,p_kind text,p_open boolean) returns void language plpgsql security definer set search_path='' as $$
declare v_existing public.calendar_slots;
begin
 if not public.booking_admin() then raise exception 'Admin access required.'; end if;
 if p_start<=now() then raise exception 'Choose a future date and time.'; end if;
 if p_kind not in ('personal','group') then raise exception 'Choose a valid slot format.'; end if;
 if p_id is not null then
 select * into strict v_existing from public.calendar_slots where id=p_id for update;
 if exists(select 1 from public.bookings where slot_id=p_id and status='confirmed') and (v_existing.starts_at<>p_start or v_existing.kind<>p_kind) then raise exception 'Move or cancel existing bookings before changing the time or format.'; end if;
 update public.calendar_slots set starts_at=p_start,ends_at=p_start+interval '1 hour',kind=p_kind,capacity=case when p_kind='group' then 6 else 1 end,is_open=p_open where id=p_id;
 else
 insert into public.calendar_slots(starts_at,ends_at,kind,capacity,is_open) values(p_start,p_start+interval '1 hour',p_kind,case when p_kind='group' then 6 else 1 end,p_open);
 end if;
end $$;
create function public.move_booking(p_booking uuid,p_target uuid) returns void language plpgsql security definer set search_path='' as $$
declare v_booking public.bookings; v_slot public.calendar_slots; v_pkg public.customer_packages; v_kind text;
begin
 if not public.booking_admin() then raise exception 'Admin access required.'; end if;
 select * into strict v_booking from public.bookings where id=p_booking;
 -- Same global lock order for both slots, then booking, then package.
 perform 1 from public.calendar_slots where id in (v_booking.slot_id,p_target) order by id for update;
 select * into strict v_booking from public.bookings where id=p_booking for update;
 if v_booking.status<>'confirmed' then raise exception 'Booking is no longer active.'; end if;
 if v_booking.slot_id=p_target then return; end if;
 select * into strict v_slot from public.calendar_slots where id=p_target;
 select * into strict v_pkg from public.customer_packages where id=v_booking.package_id for update;
 select kind into v_kind from public.products where id=v_pkg.product_id;
 if (v_kind='group')<>(v_slot.kind='group') or not v_slot.is_open or v_slot.starts_at<=now() then raise exception 'Choose an open future slot of the same format.'; end if;
 if v_pkg.expires_at is not null and v_slot.starts_at>=v_pkg.expires_at then raise exception 'Choose a date before package expiry.'; end if;
 if (select count(*) from public.bookings where slot_id=p_target and status='confirmed')>=v_slot.capacity then raise exception 'The new time is fully booked.'; end if;
 update public.bookings set slot_id=p_target where id=p_booking;
end $$;
-- SECURITY DEFINER functions must not inherit PostgreSQL's default public EXECUTE.
revoke execute on function public.create_booking_profile() from public,anon,authenticated;
revoke execute on function public.booking_admin() from public,anon;
grant execute on function public.booking_admin() to authenticated;
revoke execute on function public.calendar_slots() from public;
grant execute on function public.calendar_slots() to anon,authenticated;
revoke execute on function public.request_package(text), public.activate_package(uuid),public.reserve_slot(uuid,uuid),public.cancel_booking(uuid),public.save_calendar_slot(uuid,timestamptz,text,boolean),public.move_booking(uuid,uuid) from public,anon;
grant execute on function public.request_package(text), public.activate_package(uuid),public.reserve_slot(uuid,uuid),public.cancel_booking(uuid),public.save_calendar_slot(uuid,timestamptz,text,boolean),public.move_booking(uuid,uuid) to authenticated;

-- A customer can choose several dates; confirmation succeeds for all or none.
create function public.reserve_dates(p_package uuid,p_slots uuid[]) returns void language plpgsql security definer set search_path='' as $$
declare v_slot uuid;
begin
 if auth.uid() is null then raise exception 'Please sign in first.'; end if;
 if cardinality(p_slots) is null or cardinality(p_slots)<1 or cardinality(p_slots)>20 then raise exception 'Choose between 1 and 20 dates.'; end if;
 if cardinality(p_slots)<>(select count(distinct x) from unnest(p_slots) x) then raise exception 'Choose each date only once.'; end if;
 for v_slot in select x from unnest(p_slots) x order by x loop
 perform public.reserve_slot(p_package,v_slot);
 end loop;
end $$;
revoke execute on function public.reserve_dates(uuid,uuid[]) from public,anon;
grant execute on function public.reserve_dates(uuid,uuid[]) to authenticated;
