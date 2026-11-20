-- Separate admin tools, manually entered customers, and booking lifecycle.
create table public.guest_customers (
 id uuid primary key default gen_random_uuid(), name text not null check(length(trim(name)) between 1 and 150),
 email text, created_at timestamptz not null default now()
);
alter table public.guest_customers enable row level security;
revoke all on public.guest_customers from anon,authenticated;
grant select on public.guest_customers to authenticated;
create policy guest_admin_read on public.guest_customers for select to authenticated using(public.booking_admin());

alter table public.bookings alter column customer_id drop not null;
alter table public.bookings alter column package_id drop not null;
alter table public.bookings add column guest_customer_id uuid references public.guest_customers(id);
alter table public.bookings add column format text check(format in ('online','person','duo','group'));
alter table public.bookings add column credit_used boolean not null default true;
update public.bookings b set format=p.kind from public.customer_packages cp join public.products p on p.id=cp.product_id where b.package_id=cp.id;
-- Old cancelled bookings have already had their credit handled by the cancellation policy.
update public.bookings set credit_used=false where status='cancelled';
alter table public.bookings add constraint booking_customer_type check((customer_id is not null)<>(guest_customer_id is not null));
alter table public.bookings drop constraint bookings_status_check;
alter table public.bookings add constraint bookings_status_check check(status in ('pending','confirmed','cancelled'));
drop index public.one_customer_per_class;
create unique index one_customer_per_class on public.bookings(customer_id,slot_id) where status in ('pending','confirmed');
create unique index one_guest_per_class on public.bookings(guest_customer_id,slot_id) where status in ('pending','confirmed');

create function public.admin_calendar_slots() returns table(id uuid,starts_at timestamptz,ends_at timestamptz,kind text,capacity integer,is_open boolean,reserved bigint)
language plpgsql stable security definer set search_path='' as $$
begin
 if not public.booking_admin() then raise exception 'Admin access required.'; end if;
 return query select s.id,s.starts_at,s.ends_at,s.kind,s.capacity,s.is_open,
 (select count(*) from public.bookings b where b.slot_id=s.id and b.status in ('pending','confirmed'))
 from public.calendar_slots s order by s.starts_at;
end $$;

create function public.admin_save_booking(p_booking uuid,p_slot uuid,p_customer uuid,p_guest uuid,p_name text,p_email text,p_format text,p_status text,p_package uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_old public.bookings; v_slot public.calendar_slots; v_pkg public.customer_packages; v_product public.products;
 v_guest uuid:=p_guest; v_id uuid; v_charge boolean:=false;
begin
 if not public.booking_admin() then raise exception 'Admin access required.'; end if;
 if p_status not in ('pending','confirmed') or p_format not in ('online','person','duo','group') then raise exception 'Choose a valid booking format and status.'; end if;
 -- Serialize administrative lifecycle changes, including credit refunds.
 perform pg_advisory_xact_lock(734912);
 if p_booking is not null then
 select * into strict v_old from public.bookings where id=p_booking for update;
 if v_old.status='cancelled' then raise exception 'Create a new booking instead of editing a cancelled one.'; end if;
 end if;
 perform 1 from public.calendar_slots where id in (p_slot,v_old.slot_id) order by id for update;
 select * into strict v_slot from public.calendar_slots where id=p_slot;
 if p_booking is null or p_slot is distinct from v_old.slot_id then
 if v_slot.starts_at<=now() or not v_slot.is_open then raise exception 'Choose an open future slot.'; end if;
 end if;
 if (p_format='group')<>(v_slot.kind='group') then raise exception 'This slot does not match the training format.'; end if;
 if (select count(*) from public.bookings where slot_id=p_slot and status in ('pending','confirmed') and id is distinct from p_booking)>=v_slot.capacity then raise exception 'This slot is fully booked.'; end if;
 if p_customer is not null then
 if not exists(select 1 from public.profiles where id=p_customer and role='customer') then raise exception 'Choose a customer account.'; end if;
 v_guest:=null;
 else
 if v_guest is null then
 if length(trim(coalesce(p_name,''))) not between 1 and 150 then raise exception 'Enter the customer name.'; end if;
 insert into public.guest_customers(name,email) values(trim(p_name),nullif(trim(p_email),'')) returning id into v_guest;
 elsif not exists(select 1 from public.guest_customers where id=v_guest) then raise exception 'Customer record not found.';
 else
 if length(trim(coalesce(p_name,''))) not between 1 and 150 then raise exception 'Enter the customer name.'; end if;
 update public.guest_customers set name=trim(p_name),email=nullif(trim(p_email),'') where id=v_guest;
 end if;
 end if;
 if exists(select 1 from public.bookings where slot_id=p_slot and status in ('pending','confirmed') and id is distinct from p_booking
 and ((p_customer is not null and customer_id=p_customer) or (v_guest is not null and guest_customer_id=v_guest))) then raise exception 'This customer already has a booking in this slot.'; end if;
 -- Refund the previous allocation first; the transaction rolls it back if validation fails.
 if v_old.id is not null and v_old.credit_used and v_old.package_id is not null then
 update public.customer_packages set remaining=remaining+1 where id=v_old.package_id;
 end if;
 if p_package is not null then
 select * into strict v_pkg from public.customer_packages where id=p_package for update;
 select * into strict v_product from public.products where id=v_pkg.product_id;
 if p_customer is null or v_pkg.customer_id<>p_customer or v_product.kind<>p_format then raise exception 'The package must belong to this customer and training format.'; end if;
 if v_pkg.status<>'active' or v_pkg.remaining<1 then raise exception 'The selected package has no active credits.'; end if;
 if v_pkg.expires_at is not null and v_slot.starts_at>=v_pkg.expires_at then raise exception 'Choose a date before the package expires.'; end if;
 update public.customer_packages set remaining=remaining-1 where id=p_package;
 v_charge:=true;
 end if;
 if p_booking is null then
 insert into public.bookings(customer_id,guest_customer_id,package_id,slot_id,format,status,credit_used)
 values(p_customer,v_guest,p_package,p_slot,p_format,p_status,v_charge) returning id into v_id;
 else
 update public.bookings set customer_id=p_customer,guest_customer_id=v_guest,package_id=p_package,slot_id=p_slot,format=p_format,status=p_status,credit_used=v_charge where id=p_booking returning id into v_id;
 end if;
 return v_id;
end $$;

create function public.admin_confirm_booking(p_booking uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.booking_admin() then raise exception 'Admin access required.'; end if;
 perform pg_advisory_xact_lock(734912);
 update public.bookings set status='confirmed' where id=p_booking and status='pending';
 if not found then raise exception 'Only a pending booking can be confirmed.'; end if;
end $$;

create function public.admin_delete_booking(p_booking uuid) returns void language plpgsql security definer set search_path='' as $$
declare v_booking public.bookings;
begin
 if not public.booking_admin() then raise exception 'Admin access required.'; end if;
 perform pg_advisory_xact_lock(734912);
 select * into strict v_booking from public.bookings where id=p_booking for update;
 if v_booking.status in ('pending','confirmed') and v_booking.credit_used and v_booking.package_id is not null then
 update public.customer_packages set remaining=remaining+1 where id=v_booking.package_id;
 end if;
 delete from public.bookings where id=p_booking;
end $$;

revoke execute on function public.admin_calendar_slots(),public.admin_save_booking(uuid,uuid,uuid,uuid,text,text,text,text,uuid),public.admin_confirm_booking(uuid),public.admin_delete_booking(uuid) from public,anon;
grant execute on function public.admin_calendar_slots(),public.admin_save_booking(uuid,uuid,uuid,uuid,text,text,text,text,uuid),public.admin_confirm_booking(uuid),public.admin_delete_booking(uuid) to authenticated;

create or replace function public.calendar_slots() returns table(id uuid,starts_at timestamptz,ends_at timestamptz,kind text,capacity integer,is_open boolean,reserved bigint)
language sql stable security definer set search_path='' as $$
 select s.id,s.starts_at,s.ends_at,s.kind,s.capacity,s.is_open,
 (select count(*) from public.bookings b where b.slot_id=s.id and b.status in ('pending','confirmed'))
 from public.calendar_slots s where s.starts_at>now()-interval '1 day' order by s.starts_at;
$$;

create or replace function public.reserve_slot(p_package uuid,p_slot uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare v_slot public.calendar_slots; v_pkg public.customer_packages; v_kind text; v_id uuid;
begin
 if auth.uid() is null then raise exception 'Please sign in first.'; end if;
 perform pg_advisory_xact_lock(734912);
 -- Lock the slot before checking capacity, so simultaneous customers cannot overbook.
 select * into strict v_slot from public.calendar_slots where id=p_slot for update;
 select * into strict v_pkg from public.customer_packages where id=p_package for update;
 if v_pkg.customer_id<>auth.uid() then raise exception 'This package belongs to another customer.'; end if;
 if v_pkg.status<>'active' or v_pkg.remaining<1 then raise exception 'Your package needs activation or more sessions.'; end if;
 if v_pkg.expires_at is not null and (v_pkg.expires_at<=now() or v_slot.starts_at>=v_pkg.expires_at) then raise exception 'Choose a date before your package expires.'; end if;
 select kind into v_kind from public.products where id=v_pkg.product_id;
 if (v_kind='group')<>(v_slot.kind='group') or not v_slot.is_open or v_slot.starts_at<=now() then raise exception 'This slot is not available for your package.'; end if;
 if exists(select 1 from public.bookings where slot_id=p_slot and customer_id=auth.uid() and status in ('pending','confirmed')) then raise exception 'You already booked this class.'; end if;
 if (select count(*) from public.bookings where slot_id=p_slot and status in ('pending','confirmed'))>=v_slot.capacity then raise exception 'This time is now fully booked. Choose another.'; end if;
 insert into public.bookings(customer_id,package_id,slot_id,format,status) values(auth.uid(),p_package,p_slot,v_kind,'pending') returning id into v_id;
 update public.customer_packages set remaining=remaining-1 where id=p_package;
 return v_id;
end $$;

create or replace function public.save_calendar_slot(p_id uuid,p_start timestamptz,p_kind text,p_open boolean) returns void language plpgsql security definer set search_path='' as $$
declare v_existing public.calendar_slots;
begin
 if not public.booking_admin() then raise exception 'Admin access required.'; end if;
 perform pg_advisory_xact_lock(734912);
 if p_start<=now() then raise exception 'Choose a future date and time.'; end if;
 if p_kind not in ('personal','group') then raise exception 'Choose a valid slot format.'; end if;
 if p_id is not null then
 select * into strict v_existing from public.calendar_slots where id=p_id for update;
 if exists(select 1 from public.bookings where slot_id=p_id and status in ('pending','confirmed')) and (v_existing.starts_at<>p_start or v_existing.kind<>p_kind) then raise exception 'Move or cancel existing bookings before changing the time or format.'; end if;
 update public.calendar_slots set starts_at=p_start,ends_at=p_start+interval '1 hour',kind=p_kind,capacity=case when p_kind='group' then 6 else 1 end,is_open=p_open where id=p_id;
 else
 insert into public.calendar_slots(starts_at,ends_at,kind,capacity,is_open) values(p_start,p_start+interval '1 hour',p_kind,case when p_kind='group' then 6 else 1 end,p_open);
 end if;
end $$;

create or replace function public.move_booking(p_booking uuid,p_target uuid) returns void language plpgsql security definer set search_path='' as $$
declare v_booking public.bookings; v_slot public.calendar_slots; v_pkg public.customer_packages; v_kind text;
begin
 if not public.booking_admin() then raise exception 'Admin access required.'; end if;
 perform pg_advisory_xact_lock(734912);
 select * into strict v_booking from public.bookings where id=p_booking;
 -- Same global lock order for both slots, then booking, then package.
 perform 1 from public.calendar_slots where id in (v_booking.slot_id,p_target) order by id for update;
 select * into strict v_booking from public.bookings where id=p_booking for update;
 if v_booking.status not in ('pending','confirmed') then raise exception 'Booking is no longer active.'; end if;
 if v_booking.slot_id=p_target then return; end if;
 select * into strict v_slot from public.calendar_slots where id=p_target;
 select * into strict v_pkg from public.customer_packages where id=v_booking.package_id for update;
 select kind into v_kind from public.products where id=v_pkg.product_id;
 if (v_kind='group')<>(v_slot.kind='group') or not v_slot.is_open or v_slot.starts_at<=now() then raise exception 'Choose an open future slot of the same format.'; end if;
 if v_pkg.expires_at is not null and v_slot.starts_at>=v_pkg.expires_at then raise exception 'Choose a date before package expiry.'; end if;
 if (select count(*) from public.bookings where slot_id=p_target and status in ('pending','confirmed'))>=v_slot.capacity then raise exception 'The new time is fully booked.'; end if;
 update public.bookings set slot_id=p_target where id=p_booking;
end $$;

create or replace function public.cancel_booking(p_booking uuid) returns boolean language plpgsql security definer set search_path='' as $$
declare v_booking public.bookings; v_slot public.calendar_slots; v_refund boolean;
begin
 if auth.uid() is null then raise exception 'Please sign in first.'; end if;
 perform pg_advisory_xact_lock(734912);
 select * into strict v_booking from public.bookings where id=p_booking for update;
 if v_booking.customer_id is distinct from auth.uid() and not public.booking_admin() then raise exception 'You cannot change this booking.'; end if;
 if v_booking.status not in ('pending','confirmed') then raise exception 'This booking has already been cancelled.'; end if;
 select * into strict v_slot from public.calendar_slots where id=v_booking.slot_id for update;
 v_refund:=v_booking.credit_used and v_booking.package_id is not null and (public.booking_admin() or v_booking.status='pending' or v_slot.starts_at>=now()+interval '24 hours');
 if v_refund then update public.customer_packages set remaining=remaining+1 where id=v_booking.package_id; end if;
 update public.bookings set status='cancelled',credit_used=false where id=p_booking;
 return v_refund;
end $$;
