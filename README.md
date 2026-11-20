# Anna Rafailidou — Training website

React + Vite, with a homepage, a customer `bookings.html` page, and a separate `admin.html` workspace for Anna. The production base path remains `/anna-rafa-pt/`.

```sh
npm install
npm run dev
npm run build
npm run test:booking
```

## Try the booking calendar now

Without Supabase environment variables, the booking page is an explicitly labelled **local preview**. Select Online, Individual, Duo, or Group; select a package; choose one or more dates; and save the bookings. The balance and bookings persist in this browser. Selecting the same usable package again does not replenish credits.

Open `http://localhost:5173/anna-rafa-pt/admin.html` (or the “Open admin preview” link on the customer page), then click “Open local admin preview”. The separate workspace lets you create, confirm, edit, cancel and delete bookings, enter customer names without login accounts, and add/edit/block availability. Hover a calendar slot to see customer names, or click/tap it to open the roster. This preview is deliberately unprotected sample data; real password sign-in requires Supabase. Personal and Duo appointments share availability; group sessions have six places. No real availability, emails, payment or shared customer data is used. Example slots cover six weeks starting from the preview's initial week. Preview data uses the `anna-booking-preview-v1` localStorage key and is independent of the old prototype.

## Connect a new Supabase project

1. Create a new Supabase project. In its SQL editor run each SQL file in [supabase/migrations](supabase/migrations) in filename order, once each. Start with `202611200001_booking.sql`, then apply `202611200002_group_member_offer.sql` and `202611200003_admin_bookings.sql`. Existing projects with the first two migrations already applied need only the third migration. This creates the product catalog, customer profiles, package balances, slots, bookings, permissions and transactional booking functions. It deliberately creates **no live availability**.
2. Copy `.env.example` to `.env.local`. Fill in your project URL and public publishable key. These values are included in the browser bundle by Vite; never use a secret or service-role key. Local environment files are ignored by Git.
3. In Supabase Authentication, enable email/password authentication and email confirmation; configure the site URL for your environment. For development this is `http://localhost:5173/anna-rafa-pt/`; use the actual HTTPS URL for production. Configure email delivery before inviting customers. Users confirm their email, then return to the booking page and sign in.
4. Restart `npm run dev`. The booking page now uses Supabase with **no fallback to example data** after connection or permission errors.
5. Create Anna's account through the booking page and confirm its email. Then, as the Supabase project owner, grant that specific account the admin role in the SQL editor:

   ```sql
   update public.profiles
   set role = 'admin'
   where email = 'REPLACE_WITH_ANNA_ACCOUNT_EMAIL';
   ```

   Customers cannot grant themselves this role. The separate admin page and admin database functions require this role. Customers cannot access the admin data or tools by navigating directly to the URL. No admin password is stored in the site source; Anna signs in with her Supabase account password.
6. Open `/anna-rafa-pt/admin.html`, sign in with Anna’s email/password, and add availability. All entered dates/times are interpreted in **Europe/Zurich**, regardless of the browser timezone. Add Personal/Duo slots or Group slots; overlapping hours are rejected. Blocking a slot stops new reservations but preserves existing bookings.
7. Test with a second, customer account. Select a package; Anna sees a pending request and activates it. Then the customer can select and request dates using its credits. These requests hold the selected places as pending bookings; Anna confirms them in her separate admin workspace. Package selection never charges a card or marks an invoice as paid.

For a hosted static build, set the same two public environment variables in its build environment before `npm run build`. No Node server is required by the deployed frontend; the shared backend is Supabase.

## Package activation and booking rules

- **Local preview:** selecting a package activates demo credits immediately so the complete calendar flow can be tried.
- **Connected customer account:** selecting a new package requests it. Anna activates it after agreeing the terms, without an online payment feature. An existing usable package is reused instead of granting more credits. The date picker unlocks only for active packages.
- Booking one Personal or Duo session uses one package credit and occupies the trainer's entire slot. A Duo package price covers both participants; the booking is held by the account that owns the package.
- Booking a Group class uses one group credit and one of six places. One account cannot reserve the same class twice.
- Choosing several dates requests **all or none** in one database transaction. Balance, package ownership, validity, future dates, matching format, and capacity are checked server-side.
- Group package validity begins at activation: 10 classes for 3 months; 20 classes for 6 months. Personal package expiry is currently unspecified, as on the pricing page, and should be agreed with Anna before launch.
- Cancelling a pending request returns its reserved credit. For confirmed bookings, customer cancellations at least 24 hours before the session return one credit; later cancellations consume it. Admin cancellations return the credit. Cancelling twice cannot generate another refund.
- Editing an admin booking keeps its package allocation consistent and validates the destination’s capacity, format and expiry. Confirming a pending booking never deducts a second credit. Deleting an active booking returns its reserved credit once and permanently removes the booking; cancelling preserves a cancelled record.
- The CHF 750 / 10-session Online Group member offer is selectable under Online Individual. Anna verifies eligibility (existing Online Group members attending at least twice weekly) before activating a live package, just like other package requests. The local preview allows it immediately for testing.


## Anna’s admin workspace

- Password sign-in is handled by Supabase Auth; the database independently enforces the admin role for every admin operation. The static HTML sign-in shell is public, while bookings and customer data remain protected. The local sample-data preview is explicitly not password protected.
- Anna can create a booking for a registered customer or enter a customer name and optional email herself. Manually entered customers do not need an account. Saved customer names can be reused; editing a saved name updates that customer’s other bookings too. For manual Duo bookings, include both participants in the name field.
- Bookings can be pending, confirmed or cancelled. Pending and confirmed bookings hold capacity. The customer page no longer includes admin tabs or a role switch.
- For registered customers, Anna can optionally allocate an active package credit. Manual bookings can also be created without a package. Payments are not recorded or processed by these actions.
- Edit changes the customer, format, date/time, status and optional package allocation. Cancel keeps a record; Delete asks for confirmation and permanently removes it. Cancelled records can be deleted or rebooked as new bookings.
- Calendar hover text lists the slot’s customer names and statuses. Click/tap reveals the same roster with action buttons. Names from other customers are never included in the public calendar response.
- Use the booking filters to see upcoming bookings, pending requests, confirmed bookings, cancelled bookings or all history, and search by customer name. Admin slot queries include history; the public calendar only exposes recent/upcoming times and anonymous occupancy counts.

## Access and consistency

Customers can read only their own profile, packages and bookings. Public availability contains times and occupancy counts, with no participant identities. Admins can see customer records and manage the calendar. Client-side code cannot write roles, balances or bookings directly; mutations are restricted database functions. Row locks protect credits and group capacity, and an exclusion constraint prevents overlapping trainer slots. The UI refreshes every 15 seconds and on focus; confirmations always recheck current database state.

## Validation and remaining work

`npm run test:booking` covers package rules, credits, capacity, duplicate reservations, Duo occupancy, cancellation, moving, batch rollback, and Zurich daylight-saving boundaries in the local model. `npm run build` verifies all three frontend entry points. Admin lifecycle tests cover manually entered customers, pending capacity, edit/delete credit accounting, and roster privacy.

The SQL migration was also executed in embedded PostgreSQL, checking role/owner restrictions, package activation, credits, batch rollback, overlapping slots, capacity, moving and cancellation. To repeat this optional database check without adding a dependency to the site:

```sh
npm install --prefix /tmp/anna-booking-db-check --no-audit --no-fund @electric-sql/pglite
BOOKING_PGLITE_DIR=/tmp/anna-booking-db-check/node_modules/@electric-sql/pglite npm run test:booking:database
```

The migration must still be applied to the new Supabase project, and real Auth/email flows plus simultaneous requests across devices need integration testing there. Browser QA was unavailable in the implementation session. Before launch, test two customers competing for the last place, separate-account isolation, admin access, activation/expiry, cancellations and refresh across devices. Auth password recovery, booking email notifications, customer rescheduling and payment integration are not implemented yet. No hosted Supabase project or production deployment was created by this change.
