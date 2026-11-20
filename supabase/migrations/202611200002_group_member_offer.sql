-- Selectable offer; requests follow the normal pending -> admin activation flow.
-- Anna verifies group-member eligibility before activating this package.
insert into public.products(id,kind,sessions,price,validity_months)
values ('online-10-member','online',10,750,null)
on conflict (id) do update set kind=excluded.kind,sessions=excluded.sessions,price=excluded.price,validity_months=excluded.validity_months;
