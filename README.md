# Anna Rafailidou — Training website

React + Vite, with a homepage and a separate `bookings.html` page. The production base path remains `/anna-rafa-pt/`.

```sh
npm install
npm run dev
npm run build
npm run test:booking
```

## Try the booking calendar now

Without Supabase environment variables, the booking page is an explicitly labelled **local preview**. Select Online, Individual, Duo, or Group; select a package; choose one or more dates; and save the bookings. The balance and bookings persist in this browser. Selecting the same usable package again does not replenish credits.

“Preview as Anna” opens a local admin preview where you can add/edit/block availability, move bookings and cancel them. Personal and Duo appointments share availability; group sessions have six places. No real availability, emails, payment or shared customer data is used. Example slots cover six weeks starting from the preview's initial week. Preview data uses the `anna-booking-preview-v1` localStorage key and is independent of the old prototype.

## Connect a new Supabase project

1. Create a new Supabase project. In its SQL editor run the complete contents of [the initial booking migration](supabase/migrations/202611200001_booking.sql) once. This creates the product catalog, customer profiles, package balances, slots, bookings, permissions and transactional booking functions. It deliberately creates **no live availability**.
2. Copy `.env.example` to `.env.local`. Fill in your project URL and public publishable key. These values are included in the browser bundle by Vite; never use a secret or service-role key. Local environment files are ignored by Git.
3. In Supabase Authentication, enable email/password authentication and email confirmation; configure the site URL for your environment. For development this is `http://localhost:5173/anna-rafa-pt/`; use the actual HTTPS URL for production. Configure email delivery before inviting customers. Users confirm their email, then return to the booking page and sign in.
4. Restart `npm run dev`. The booking page now uses Supabase with **no fallback to example data** after connection or permission errors.
5. Create Anna's account through the booking page and confirm its email. Then, as the Supabase project owner, grant that specific account the admin role in the SQL editor:

   ```sql
   update public.profiles
   set role = 'admin'
   where email = 'REPLACE_WITH_ANNA_ACCOUNT_EMAIL';
   ```

   Customers cannot grant themselves this role. The admin tab and database mutation functions require it. Only the local preview exposes a role switch.
6. Sign in as Anna and add availability. All entered dates/times are interpreted in **Europe/Zurich**, regardless of the browser timezone. Add Personal/Duo slots or Group slots; overlapping hours are rejected. Blocking a slot stops new reservations but preserves existing bookings.
7. Test with a second, customer account. Select a package; Anna sees a pending request and activates it. Then the customer can select and confirm dates using its credits. Package selection never charges a card or marks an invoice as paid.

For a hosted static build, set the same two public environment variables in its build environment before `npm run build`. No Node server is required by the deployed frontend; the shared backend is Supabase.

## Package activation and booking rules

- **Local preview:** selecting a package activates demo credits immediately so the complete calendar flow can be tried.
- **Connected customer account:** selecting a new package requests it. Anna activates it after agreeing the terms, without an online payment feature. An existing usable package is reused instead of granting more credits. The date picker unlocks only for active packages.
- Booking one Personal or Duo session uses one package credit and occupies the trainer's entire slot. A Duo package price covers both participants; the booking is held by the account that owns the package.
- Booking a Group class uses one group credit and one of six places. One account cannot reserve the same class twice.
- Choosing several dates confirms **all or none** in one database transaction. Balance, package ownership, validity, future dates, matching format, and capacity are checked server-side.
- Group package validity begins at activation: 10 classes for 3 months; 20 classes for 6 months. Personal package expiry is currently unspecified, as on the pricing page, and should be agreed with Anna before launch.
- Customer cancellations at least 24 hours before the session return one credit. Later cancellations consume it. Admin cancellations return the credit. Cancelling twice cannot generate another refund.
- Admin moves keep the package balance unchanged and validate the destination's capacity, format and expiry.
- The discounted Online Group member offer remains an enquiry to Anna. It is not self-granted by the customer calendar.

## Access and consistency

Customers can read only their own profile, packages and bookings. Public availability contains times and occupancy counts, with no participant identities. Admins can see customer records and manage the calendar. Client-side code cannot write roles, balances or bookings directly; mutations are restricted database functions. Row locks protect credits and group capacity, and an exclusion constraint prevents overlapping trainer slots. The UI refreshes every 15 seconds and on focus; confirmations always recheck current database state.

## Validation and remaining work

`npm run test:booking` covers package rules, credits, capacity, duplicate reservations, Duo occupancy, cancellation, moving, batch rollback, and Zurich daylight-saving boundaries in the local model. `npm run build` verifies both frontend entry points.

The SQL migration was also executed in embedded PostgreSQL, checking role/owner restrictions, package activation, credits, batch rollback, overlapping slots, capacity, moving and cancellation. To repeat this optional database check without adding a dependency to the site:

```sh
npm install --prefix /tmp/anna-booking-db-check --no-audit --no-fund @electric-sql/pglite
BOOKING_PGLITE_DIR=/tmp/anna-booking-db-check/node_modules/@electric-sql/pglite npm run test:booking:database
```

The migration must still be applied to the new Supabase project, and real Auth/email flows plus simultaneous requests across devices need integration testing there. Browser QA was unavailable in the implementation session. Before launch, test two customers competing for the last place, separate-account isolation, admin access, activation/expiry, cancellations and refresh across devices. Auth password recovery, booking email notifications, customer rescheduling and payment integration are not implemented yet. No hosted Supabase project or production deployment was created by this change.
