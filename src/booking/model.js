export const holdsSlot = status => status === 'pending' || status === 'confirmed';
export const ZONE = 'Europe/Zurich';
export const FORMATS = [
  { id: 'online', label: 'Online Individual', detail: 'One-to-one via Zoom' },
  { id: 'person', label: 'In-Person Individual', detail: 'Home or outdoors' },
  { id: 'duo', label: 'In-Person Duo', detail: 'Two people · prices cover both' },
  { id: 'group', label: 'Online Group', detail: 'Greek-speaking · maximum 6 people' },
];
export const PRODUCTS = [
  ['online-5','online',5,450,null], ['online-10','online',10,850,null], ['online-20','online',20,1600,null], ['online-10-member','online',10,750,null],
  ['person-1','person',1,150,null], ['person-10','person',10,1400,null], ['person-20','person',20,2700,null],
  ['duo-1','duo',1,200,null], ['duo-10','duo',10,1800,null], ['duo-20','duo',20,3400,null],
  ['group-10','group',10,300,3], ['group-20','group',20,560,6],
].map(([id,kind,sessions,price,validity_months]) => ({id,kind,sessions,price,validity_months}));
export const money = value => new Intl.NumberFormat('de-CH', {style:'currency', currency:'CHF', maximumFractionDigits:0}).format(value);
export const productLabel = p => `${p.sessions} ${p.kind === 'group' ? 'Classes' : p.sessions === 1 ? 'Session' : 'Sessions'}${p.id === 'online-10-member' ? ' · Group Members' : ''}`;
export const dayKey = value => new Intl.DateTimeFormat('en-CA', { timeZone: ZONE, year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date(value));
export const prettyDate = value => new Intl.DateTimeFormat('en-GB', {timeZone: ZONE, weekday:'short', day:'numeric', month:'short'}).format(new Date(value));
export const timeLabel = value => new Intl.DateTimeFormat('en-GB', {timeZone: ZONE, hour:'2-digit', minute:'2-digit',hourCycle:'h23'}).format(new Date(value));
export function addDays(day, count) {
  const date = new Date(`${day}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + count); return date.toISOString().slice(0,10);
}
export function monday(now = new Date()) {
  const day = dayKey(now); const weekday = new Date(`${day}T12:00Z`).getUTCDay(); return addDays(day,-((weekday+6)%7));
}
// Convert Zurich wall-clock input without relying on the customer's browser timezone.
export function zurichInstant(day, time) {
  const input = `${day}T${time}:00`;
  const wall = Date.parse(`${input}Z`);
  if (!Number.isFinite(wall)) throw new Error('Choose a valid date and time.');
  let candidate = wall;
  const formatter = new Intl.DateTimeFormat('sv-SE', {timeZone:ZONE, year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
  for (let i=0; i<3; i++) candidate += wall-Date.parse(`${formatter.format(candidate).replace(' ','T')}Z`);
  if (formatter.format(candidate).replace(' ','T') !== input) throw new Error('This time does not exist in Switzerland because the clocks change.');
  return new Date(candidate).toISOString();
}
export function expiryFor(product, now = new Date()) {
  if (!product.validity_months) return null;
  const date = new Date(now), original = date.getUTCDate();
  date.setUTCDate(1); date.setUTCMonth(date.getUTCMonth()+product.validity_months);
  const last = new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)).getUTCDate();
  date.setUTCDate(Math.min(original,last)); return date.toISOString();
}
export function availableCredits(pkg, now = Date.now()) {
  return pkg?.status === 'active' && pkg.remaining > 0 && (!pkg.expires_at || Date.parse(pkg.expires_at) > now);
}
export function compatible(product, slot) { return (product.kind === 'group') === (slot.kind === 'group'); }
export function createDemo(now = new Date()) {
  const start = monday(now), slots=[];
  const group = [[0,12],[0,18],[2,12],[4,12],[4,17]];
  for(let w=0;w<6;w++) for(let d=0;d<5;d++) for(const hour of [9,10,11,12,14,15,16,17,18]) {
    const day = addDays(start,w*7+d), starts_at=zurichInstant(day,`${hour.toString().padStart(2,'0')}:00`);
    const isGroup=group.some(([gd,gh])=>gd===d && gh===hour);
    slots.push({id:`${day}-${hour}`,starts_at,ends_at:new Date(Date.parse(starts_at)+3600000).toISOString(),kind:isGroup?'group':'personal',capacity:isGroup?6:1,is_open:true});
  }
  return {products:PRODUCTS,slots,packages:[],bookings:[],guest_customers:[],profiles:[{id:'demo-customer',name:'Preview customer',email:'preview@example.com'}]};
}
export function bookDemo(state, packageId, slotId, customerId='demo-customer', now=Date.now()) {
  const pkg=state.packages.find(p=>p.id===packageId && p.customer_id===customerId);
  const slot=state.slots.find(s=>s.id===slotId);
  const product=state.products.find(p=>p.id===pkg?.product_id);
  if(!availableCredits(pkg,now)) throw new Error('Choose an active package with remaining sessions.');
  if(!slot || !slot.is_open || Date.parse(slot.starts_at)<=now || !compatible(product,slot)) throw new Error('This time is no longer available for this package.');
  if(pkg.expires_at && Date.parse(slot.starts_at)>=Date.parse(pkg.expires_at)) throw new Error('Choose a date before your package expires.');
  const active=state.bookings.filter(b=>holdsSlot(b.status));
  if(active.some(b=>b.slot_id===slotId && b.customer_id===customerId)) throw new Error('You already booked this class.');
  if(active.filter(b=>b.slot_id===slotId).length>=slot.capacity) throw new Error('This time is now fully booked. Choose another.');
  pkg.remaining--;
  const booking={id:crypto.randomUUID(),slot_id:slotId,package_id:pkg.id,customer_id:customerId,status:'pending',format:product.kind,credit_used:true,created_at:new Date(now).toISOString()};
  state.bookings.push(booking); return booking;
}
export function cancelDemo(state, bookingId, admin=false, now=Date.now()) {
  const b=state.bookings.find(x=>x.id===bookingId);
  if(!b || !holdsSlot(b.status)) throw new Error('This booking has already been cancelled.');
  const slot=state.slots.find(s=>s.id===b.slot_id);
  const refund=Boolean(b.package_id && b.credit_used !== false && (admin || b.status==='pending' || Date.parse(slot.starts_at)-now>=86400000));
  b.status='cancelled';
  b.credit_used=false;
  if(refund) state.packages.find(p=>p.id===b.package_id).remaining++;
  return refund;
}

// Admin lifecycle operations share one model with the local preview's API tests.
export function saveAdminDemo(state, values, now=Date.now()) {
  const old=values.id?state.bookings.find(b=>b.id===values.id):null;
  if(values.id && (!old || !holdsSlot(old.status))) throw new Error('Only pending or confirmed bookings can be edited.');
  const slot=state.slots.find(s=>s.id===values.slot_id);
  if(!slot || (!old || old.slot_id!==slot.id) && (!slot.is_open || Date.parse(slot.starts_at)<=now)) throw new Error('Choose an open future slot.');
  if(!['online','person','duo','group'].includes(values.format) || !['pending','confirmed'].includes(values.status)) throw new Error('Choose a valid format and status.');
  if((values.format==='group')!==(slot.kind==='group')) throw new Error('The slot does not match the training format.');
  const others=state.bookings.filter(b=>b.id!==old?.id && holdsSlot(b.status) && b.slot_id===slot.id);
  if(others.length>=slot.capacity) throw new Error('This slot is fully booked.');
  let guestId=values.guest_customer_id||null;
  if(values.customer_id) {
    if(!state.profiles.some(p=>p.id===values.customer_id && p.role!=='admin')) throw new Error('Choose a customer account.');
    guestId=null;
  } else {
    if(!values.name?.trim() || values.name.trim().length>150) throw new Error('Enter a customer name of up to 150 characters.');
    if(guestId && !state.guest_customers.some(c=>c.id===guestId)) throw new Error('Customer record not found.');
    guestId ||= crypto.randomUUID();
  }
  if(others.some(b=>values.customer_id?b.customer_id===values.customer_id:b.guest_customer_id===guestId)) throw new Error('This customer already has a booking in this slot.');
  const oldPkg=state.packages.find(p=>p.id===old?.package_id);
  const refund=old && old.credit_used!==false && oldPkg;
  const pkg=values.package_id?state.packages.find(p=>p.id===values.package_id):null;
  if(values.package_id) {
    const p=state.products.find(p=>p.id===pkg?.product_id);
    const balance=pkg?.remaining+(refund && oldPkg.id===pkg?.id?1:0);
    if(!pkg || pkg.customer_id!==values.customer_id || p?.kind!==values.format || pkg.status!=='active' || balance<1) throw new Error('Choose an active package for this customer and format with a remaining credit.');
    if(pkg.expires_at && Date.parse(slot.starts_at)>=Date.parse(pkg.expires_at)) throw new Error('Choose a date before the package expires.');
  }
  if(!values.customer_id){
    state.guest_customers ||= [];
    const guest=state.guest_customers.find(c=>c.id===guestId);
    if(guest)Object.assign(guest,{name:values.name.trim(),email:values.email?.trim()||null});
    else state.guest_customers.push({id:guestId,name:values.name.trim(),email:values.email?.trim()||null});
  }
  if(refund)oldPkg.remaining++;
  if(pkg)pkg.remaining--;
  const booking={...(old||{}),id:old?.id||crypto.randomUUID(),customer_id:values.customer_id||null,guest_customer_id:guestId,package_id:pkg?.id||null,slot_id:slot.id,format:values.format,status:values.status,credit_used:Boolean(pkg),created_at:old?.created_at||new Date(now).toISOString()};
  if(old)Object.assign(old,booking);else state.bookings.push(booking);
  return booking.id;
}
export function deleteAdminDemo(state,id){
  const b=state.bookings.find(b=>b.id===id);
  if(!b)throw new Error('Booking not found.');
  if(holdsSlot(b.status)&&b.package_id&&b.credit_used!==false)state.packages.find(p=>p.id===b.package_id).remaining++;
  state.bookings=state.bookings.filter(b=>b.id!==id);
}
