import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTS, createDemo, bookDemo, cancelDemo, expiryFor, zurichInstant, dayKey, availableCredits, saveAdminDemo, deleteAdminDemo, holdsSlot } from '../src/booking/model.js';
const now=Date.parse('2026-11-20T08:00:00Z');
function fixture(kind='online',sessions=10){
 const state=createDemo(new Date(now));
 const p=state.products.find(p=>p.kind===kind&&p.sessions===sessions);
 state.packages.push({id:'package',customer_id:'demo-customer',product_id:p.id,status:'active',remaining:p.sessions,expires_at:expiryFor(p,new Date(now))});
 const slot=state.slots.find(s=>Date.parse(s.starts_at)>now+86400000&&(kind==='group'?s.kind==='group':s.kind==='personal'));
 return {state,pkg:state.packages[0],slot};
}
test('all advertised format prices are represented',()=>{
 assert.equal(PRODUCTS.length,12);assert.equal(PRODUCTS.find(p=>p.id==='duo-10').price,1800);assert.equal(PRODUCTS.find(p=>p.id==='online-10-member').price,750);assert.equal(PRODUCTS.find(p=>p.id==='group-20').price,560);
});
test('Zurich times remain correct in winter and summer',()=>{
 assert.equal(zurichInstant('2026-11-20','12:00'),'2026-11-20T11:00:00.000Z');
 assert.equal(zurichInstant('2026-07-20','12:00'),'2026-07-20T10:00:00.000Z');
 assert.equal(dayKey('2026-11-20T23:30:00Z'),'2026-11-21');
});
test('nonexistent daylight-saving time is rejected',()=>{assert.throws(()=>zurichInstant('2027-03-28','02:30'),/clocks change/);});
test('package expiry clamps to the last day of the month',()=>{assert.equal(expiryFor({validity_months:3},new Date('2026-11-30T10:00Z')),'2027-02-28T10:00:00.000Z');});
test('personal reservation deducts exactly one credit',()=>{const {state,pkg,slot}=fixture();bookDemo(state,pkg.id,slot.id,undefined,now);assert.equal(pkg.remaining,9);assert.equal(state.bookings.length,1);});
test('personal and Duo compete for the same appointment',()=>{
 const {state,pkg,slot}=fixture();bookDemo(state,pkg.id,slot.id,undefined,now);
 state.packages.push({id:'duo',customer_id:'other',product_id:'duo-10',status:'active',remaining:10});
 assert.throws(()=>bookDemo(state,'duo',slot.id,'other',now),/fully booked/);assert.equal(state.packages[1].remaining,10);
});
test('Duo uses one credit and one slot for both people',()=>{const {state,pkg,slot}=fixture('duo');bookDemo(state,pkg.id,slot.id,undefined,now);assert.equal(pkg.remaining,9);assert.equal(state.bookings.length,1);});
test('group capacity is six and each customer can book only once',()=>{
 const {state,pkg,slot}=fixture('group');bookDemo(state,pkg.id,slot.id,undefined,now);
 assert.throws(()=>bookDemo(state,pkg.id,slot.id,undefined,now),/already booked/);
 for(let i=1;i<=6;i++){const user=`customer-${i}`;state.packages.push({id:user,customer_id:user,product_id:'group-10',status:'active',remaining:10});if(i<6)bookDemo(state,user,slot.id,user,now);else assert.throws(()=>bookDemo(state,user,slot.id,user,now),/fully booked/);}
 assert.equal(state.bookings.length,6);
});
test('wrong package, inactive package, expired package, foreign owner and blocked times are rejected',()=>{
 const {state,pkg,slot}=fixture();const group=state.slots.find(s=>s.kind==='group'&&Date.parse(s.starts_at)>now);
 assert.throws(()=>bookDemo(state,pkg.id,group.id,undefined,now),/no longer available/);
 assert.throws(()=>bookDemo(state,pkg.id,slot.id,'another-customer',now),/active package/);
 pkg.status='pending';assert.throws(()=>bookDemo(state,pkg.id,slot.id,undefined,now),/active package/);pkg.status='active';
 pkg.expires_at=new Date(now-1).toISOString();assert.equal(availableCredits(pkg,now),false);assert.throws(()=>bookDemo(state,pkg.id,slot.id,undefined,now),/active package/);
 pkg.expires_at=null;slot.is_open=false;assert.throws(()=>bookDemo(state,pkg.id,slot.id,undefined,now),/no longer available/);
});
test('reservations cannot be made after package expiry',()=>{const {state,pkg,slot}=fixture();pkg.expires_at=new Date(Date.parse(slot.starts_at)-1).toISOString();assert.throws(()=>bookDemo(state,pkg.id,slot.id,undefined,now),/before your package expires/);});
test('early cancellation returns credit once',()=>{const {state,pkg,slot}=fixture();const b=bookDemo(state,pkg.id,slot.id,undefined,now);assert.equal(cancelDemo(state,b.id,false,now),true);assert.equal(pkg.remaining,10);assert.throws(()=>cancelDemo(state,b.id,false,now),/already been cancelled/);});
test('late cancellation uses credit, while admin cancellation returns it',()=>{
 const {state,pkg,slot}=fixture();const b=bookDemo(state,pkg.id,slot.id,undefined,now);b.status='confirmed';
 assert.equal(cancelDemo(state,b.id,false,Date.parse(slot.starts_at)-3600000),false);assert.equal(pkg.remaining,9);
 const second=bookDemo(state,pkg.id,slot.id,undefined,now);assert.equal(cancelDemo(state,second.id,true,Date.parse(slot.starts_at)-3600000),true);assert.equal(pkg.remaining,9);
});
test('example slots never overlap and past bookings are rejected',()=>{
 const s=createDemo(new Date(now)).slots.sort((a,b)=>Date.parse(a.starts_at)-Date.parse(b.starts_at));
 for(let i=1;i<s.length;i++)assert.ok(Date.parse(s[i].starts_at)>=Date.parse(s[i-1].ends_at));
 const {state,pkg}=fixture();assert.throws(()=>bookDemo(state,pkg.id,state.slots[0].id,undefined,now),/no longer available/);
});
test('local API reuses a package and atomically rolls back multiple dates when one conflicts',async()=>{
 const storage=new Map();globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
 const api=await import('../src/booking/api.js');
 const id=await api.selectPackage('online-10');assert.equal(await api.selectPackage('online-10'),id);
 const data=await api.snapshot(),dates=data.slots.filter(s=>s.kind==='personal'&&Date.parse(s.starts_at)>Date.now()+86400000);
 await api.reserveDates(id,[dates[0].id]);
 await assert.rejects(()=>api.reserveDates(id,[dates[1].id,dates[0].id]),/already booked/);
 const after=await api.snapshot();assert.equal(after.bookings.length,1);assert.equal(after.packages[0].remaining,9);
 await api.moveBooking(after.bookings[0].id,dates[2].id);const moved=await api.snapshot();assert.equal(moved.bookings[0].slot_id,dates[2].id);assert.equal(moved.packages[0].remaining,9);
 await api.cancelBooking(moved.bookings[0].id,true);assert.equal((await api.snapshot()).packages[0].remaining,10);
});

test('admin can create a named customer without an account and confirm without changing capacity',()=>{
 const {state,slot}=fixture();
 const id=saveAdminDemo(state,{slot_id:slot.id,format:'duo',status:'pending',name:'Maria & Alex',email:'maria@example.com'},now);
 const booking=state.bookings.find(b=>b.id===id);
 assert.equal(state.guest_customers[0].name,'Maria & Alex');assert.equal(booking.package_id,null);assert.equal(booking.credit_used,false);assert.equal(booking.customer_id,null);
 assert.equal(state.bookings.filter(b=>holdsSlot(b.status)).length,1);
 booking.status='confirmed';assert.equal(state.bookings.filter(b=>holdsSlot(b.status)).length,1);
});
test('pending manual bookings block customer reservations and editing does not duplicate guest records',()=>{
 const {state,pkg,slot}=fixture();const id=saveAdminDemo(state,{slot_id:slot.id,format:'person',status:'pending',name:'Maria'},now);
 assert.throws(()=>bookDemo(state,pkg.id,slot.id,undefined,now),/fully booked/);
 const b=state.bookings[0],target=state.slots.find(s=>s.kind==='personal'&&Date.parse(s.starts_at)>Date.parse(slot.starts_at));
 saveAdminDemo(state,{...b,slot_id:target.id,name:'Maria Updated',status:'confirmed'},now);
 assert.equal(state.bookings.length,1);assert.equal(state.guest_customers.length,1);assert.equal(state.guest_customers[0].name,'Maria Updated');
 assert.equal(state.bookings[0].slot_id,target.id);deleteAdminDemo(state,id);assert.equal(state.bookings.length,0);
});
test('admin editing and deleting a package booking allocates and returns credit exactly once',()=>{
 const {state,pkg,slot}=fixture();
 const id=saveAdminDemo(state,{customer_id:'demo-customer',package_id:pkg.id,slot_id:slot.id,format:'online',status:'pending'},now);
 assert.equal(pkg.remaining,9);
 saveAdminDemo(state,{...state.bookings[0],status:'confirmed'},now);assert.equal(pkg.remaining,9);
 deleteAdminDemo(state,id);assert.equal(pkg.remaining,10);assert.throws(()=>deleteAdminDemo(state,id),/not found/);assert.equal(pkg.remaining,10);
});
test('failed admin edits leave credits, guests, and bookings unchanged',()=>{
 const {state,pkg,slot}=fixture();const b=bookDemo(state,pkg.id,slot.id,undefined,now),before=structuredClone(state);
 assert.throws(()=>saveAdminDemo(state,{...b,format:'group',status:'confirmed'},now),/training format/);
 assert.deepEqual(state,before);
 assert.throws(()=>saveAdminDemo(state,{slot_id:slot.id,format:'person',status:'confirmed',name:'Guest'},now),/fully booked/);
 assert.deepEqual(state,before);
});
test('pending requests return credits even inside 24 hours; confirmed late cancellations do not',()=>{
 const {state,pkg,slot}=fixture();const b=bookDemo(state,pkg.id,slot.id,undefined,now);
 assert.equal(b.status,'pending');assert.equal(cancelDemo(state,b.id,false,Date.parse(slot.starts_at)-3600000),true);assert.equal(pkg.remaining,10);
});
test('group capacity includes manually entered and pending customers',()=>{
 const {state,pkg,slot}=fixture('group');
 for(let i=0;i<6;i++)saveAdminDemo(state,{slot_id:slot.id,format:'group',status:i%2?'confirmed':'pending',name:`Guest ${i}`},now);
 assert.throws(()=>saveAdminDemo(state,{slot_id:slot.id,format:'group',status:'confirmed',name:'Seventh guest'},now),/fully booked/);
 assert.throws(()=>bookDemo(state,pkg.id,slot.id,undefined,now),/fully booked/);assert.equal(state.guest_customers.length,6);
});
test('customer snapshots hide guest identities while admin snapshots expose the roster',async()=>{
 const api=await import('../src/booking/api.js');const before=await api.adminSnapshot();
 const free=before.slots.find(s=>s.kind==='personal'&&Date.parse(s.starts_at)>Date.now()+86400000&&!before.bookings.some(b=>b.slot_id===s.id&&holdsSlot(b.status)));
 const id=await api.adminSaveBooking({slot_id:free.id,format:'person',status:'pending',name:'Private Guest'});
 const publicData=await api.snapshot(),adminData=await api.adminSnapshot();
 assert.equal(publicData.guest_customers,undefined);assert.ok(!publicData.bookings.some(b=>b.id===id));assert.equal(publicData.slots.find(s=>s.id===free.id).reserved,1);
 assert.ok(adminData.guest_customers.some(c=>c.name==='Private Guest'));
 await api.adminConfirmBooking(id);assert.equal((await api.adminSnapshot()).bookings.find(b=>b.id===id).status,'confirmed');
 await api.adminDeleteBooking(id);assert.ok(!(await api.adminSnapshot()).bookings.some(b=>b.id===id));
});
