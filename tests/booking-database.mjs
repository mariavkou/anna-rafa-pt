// Optional embedded PostgreSQL runtime; see README for the installation command.
const runtime=process.env.BOOKING_PGLITE_DIR;
const { PGlite }=await import(runtime?`${runtime}/dist/index.js`:'@electric-sql/pglite');
const { btree_gist }=await import(runtime?`${runtime}/dist/contrib/btree_gist.js`:'@electric-sql/pglite/contrib/btree_gist');
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const db=new PGlite({extensions:{btree_gist}});
await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth to anon,authenticated;`);
await db.exec(await readFile(new URL('../supabase/migrations/202611200001_booking.sql',import.meta.url),'utf8'));
const users=Array.from({length:9},(_,i)=>`00000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`);
for(const [i,id] of users.entries())await db.query('insert into auth.users(id,email)values($1,$2)',[id,`user${i}@example.com`]);
await db.query("update public.profiles set role='admin' where id=$1",[users[0]]);
async function as(id,sql,args=[]){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id||'']);await db.exec(`set role ${id?'authenticated':'anon'}`);return db.query(sql,args);}
const admin=(sql,args)=>as(users[0],sql,args),customer=(sql,args)=>as(users[1],sql,args);
const now=(await admin('select now() as date')).rows[0].date;
const starts=Array.from({length:5},(_,i)=>new Date(Date.parse(now)+(72+i*2)*3600000).toISOString());
for(let i=0;i<5;i++)await admin('select public.save_calendar_slot(null,$1,$2,true)',[starts[i],i===4?'group':'personal']);
const slots=(await admin('select * from public.calendar_slots()')).rows;
const pkg=(await customer("select public.request_package('online-10') as id")).rows[0].id;
await assert.rejects(()=>customer('select public.reserve_slot($1,$2)',[pkg,slots[0].id]),/activation/);
assert.equal((await customer("select public.request_package('online-10') as id")).rows[0].id,pkg);
await assert.rejects(()=>customer('select public.activate_package($1)',[pkg]),/Admin access/);
await admin('select public.activate_package($1)',[pkg]);
const bid=(await customer('select public.reserve_slot($1,$2) as id',[pkg,slots[0].id])).rows[0].id;
assert.equal((await customer('select remaining from public.customer_packages')).rows[0].remaining,9);
await assert.rejects(()=>customer('select public.reserve_dates($1,$2)',[pkg,[slots[1].id,slots[0].id]]),/already booked/);
assert.equal((await customer('select * from public.bookings')).rows.length,1);
assert.equal((await customer('select remaining from public.customer_packages')).rows[0].remaining,9);
assert.equal((await as(users[2],'select * from public.bookings')).rows.length,0);
assert.equal((await as(users[2],'select * from public.customer_packages')).rows.length,0);
await assert.rejects(()=>customer("update public.profiles set role='admin'"),/permission denied/);
await assert.rejects(()=>customer('update public.customer_packages set remaining=100'),/permission denied/);
await admin('select public.move_booking($1,$2)',[bid,slots[2].id]);
assert.equal((await customer('select remaining from public.customer_packages')).rows[0].remaining,9);
assert.equal((await customer('select slot_id from public.bookings')).rows[0].slot_id,slots[2].id);
assert.equal((await customer('select public.cancel_booking($1) as refunded',[bid])).rows[0].refunded,true);
await assert.rejects(()=>customer('select public.cancel_booking($1)',[bid]),/already been cancelled/);
assert.equal((await customer('select remaining from public.customer_packages')).rows[0].remaining,10);
for(let i=1;i<=7;i++){
 const id=(await as(users[i],"select public.request_package('group-10') as id")).rows[0].id;
 await admin('select public.activate_package($1)',[id]);
 if(i<=6)await as(users[i],'select public.reserve_slot($1,$2)',[id,slots[4].id]);
 else await assert.rejects(()=>as(users[i],'select public.reserve_slot($1,$2)',[id,slots[4].id]),/fully booked/);
}
const publicSlots=(await as(null,'select * from public.calendar_slots()')).rows;
assert.equal(Number(publicSlots.find(s=>s.id===slots[4].id).reserved),6);
await assert.rejects(()=>as(null,'select * from public.bookings'),/permission denied/);
await assert.rejects(()=>admin('select public.save_calendar_slot(null,$1,$2,true)',[starts[0],'group']),/conflicting key/);
// Duo occupies the same trainer slot as an individual appointment.
const duo=(await as(users[2],"select public.request_package('duo-10') as id")).rows[0].id;
await admin('select public.activate_package($1)',[duo]);
await as(users[2],'select public.reserve_slot($1,$2)',[duo,slots[0].id]);
await assert.rejects(()=>customer('select public.reserve_slot($1,$2)',[pkg,slots[0].id]),/fully booked/);
await assert.rejects(()=>as(null,'select public.reserve_slot($1,$2)',[pkg,slots[1].id]),/permission denied/);
// A successful multi-date reservation consumes exactly its number of credits.
await customer('select public.reserve_dates($1,$2)',[pkg,[slots[1].id,slots[3].id]]);
assert.equal((await customer('select remaining from public.customer_packages where id=$1',[pkg])).rows[0].remaining,8);
// Occupied times cannot be shifted by editing availability directly.
await assert.rejects(()=>admin('select public.save_calendar_slot($1,$2,$3,true)',[slots[0].id,new Date(Date.parse(starts[0])+30*60000).toISOString(),'personal']),/Move or cancel/);
// Late customer cancellation retains the credit; group duplicates cannot consume a second credit.
const near=new Date(Date.parse(now)+2*3600000).toISOString();
await admin('select public.save_calendar_slot(null,$1,$2,true)',[near,'personal']);
const nearSlot=(await admin('select id from public.calendar_slots where starts_at=$1',[near])).rows[0].id;
const nearBooking=(await customer('select public.reserve_slot($1,$2) as id',[pkg,nearSlot])).rows[0].id;
assert.equal((await customer('select public.cancel_booking($1) as refunded',[nearBooking])).rows[0].refunded,false);
const groupPkg=(await customer("select id from public.customer_packages where product_id='group-10'")).rows[0].id;
await assert.rejects(()=>customer('select public.reserve_slot($1,$2)',[groupPkg,slots[4].id]),/already booked/);
console.log('PostgreSQL migration executed successfully. Passed pending-package activation, duplicate request, role protection, ownership/RLS, batch rollback, credits, move/cancel, six-seat limit, anonymous counts/privacy, and overlap rejection.');
await db.close();
