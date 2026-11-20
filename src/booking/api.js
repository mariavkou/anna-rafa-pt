import { PRODUCTS, createDemo, bookDemo, cancelDemo, expiryFor, holdsSlot, saveAdminDemo, deleteAdminDemo } from './model.js';
const env=import.meta.env || {};
const url=env.VITE_SUPABASE_URL?.replace(/\/$/,''), key=env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const isLive=Boolean(url && key);
const sessionKey='anna-booking-session-v1',demoKey='anna-booking-preview-v1';
let session=null;
try { session=JSON.parse(sessionStorage.getItem(sessionKey)||'null'); } catch { /* Storage can be disabled. */ }
export const currentUser=()=>session?.user || null;
function saveSession(value) { session=value;try{value?sessionStorage.setItem(sessionKey,JSON.stringify(value)):sessionStorage.removeItem(sessionKey);}catch{/* In-memory session remains usable. */} }
async function request(path,method='GET',body,authenticated=true) {
  if(authenticated && session && session.expires_at*1000<Date.now()+60000) {
    const refreshed=await request('/auth/v1/token?grant_type=refresh_token','POST',{refresh_token:session.refresh_token},false);
    saveSession({...refreshed,expires_at:Math.floor(Date.now()/1000)+refreshed.expires_in});
  }
  const headers={apikey:key,'Content-Type':'application/json'};
  if(authenticated && session) headers.Authorization=`Bearer ${session.access_token}`;
  const response=await fetch(url+path,{method,headers,...(body?{body:JSON.stringify(body)}:{})});
  const data=await response.json().catch(()=>null);
  if(!response.ok) throw new Error(data?.message||data?.msg||data?.error_description||'The booking service could not complete this request.');
  return data;
}
const rpc=(name,body)=>request(`/rest/v1/rpc/${name}`,'POST',body);
export async function authenticate(email,password,signup,name) {
  const data=await request(signup?'/auth/v1/signup':'/auth/v1/token?grant_type=password','POST',{email,password,...(signup?{data:{name}}:{})},false);
  if(data.access_token)saveSession({...data,expires_at:Math.floor(Date.now()/1000)+data.expires_in});
  return Boolean(data.access_token);
}
export async function signOut(){try{if(session)await request('/auth/v1/logout','POST');}finally{saveSession(null);}}
let demo;
function demoState(){
  try{const saved=localStorage.getItem(demoKey);if(saved)demo=JSON.parse(saved);}catch{/* Use the in-memory preview if storage is unavailable. */}
  demo ||= createDemo();demo.products=structuredClone(PRODUCTS);demo.guest_customers ||= [];return demo;
}
function persist(){try{localStorage.setItem(demoKey,JSON.stringify(demo));}catch{/* Usable for this session. */}}
export async function snapshot(){
  if(!isLive){const s=structuredClone(demoState());s.slots.forEach(slot=>slot.reserved=s.bookings.filter(b=>b.slot_id===slot.id&&holdsSlot(b.status)).length);s.bookings=s.bookings.filter(b=>b.customer_id==='demo-customer');s.packages=s.packages.filter(p=>p.customer_id==='demo-customer');s.profiles=s.profiles.filter(p=>p.id==='demo-customer');delete s.guest_customers;return s;}
  const [products,slots,packages,bookings,profiles]=await Promise.all([
    request('/rest/v1/products?select=*&order=kind,sessions'),rpc('calendar_slots',{}),
    session?request('/rest/v1/customer_packages?select=*&order=created_at.desc'):[],
    session?request('/rest/v1/bookings?select=*&order=created_at.desc'):[],
    session?request('/rest/v1/profiles?select=*'):[],
  ]);
  return {products,slots,packages,bookings,profiles};
}
export async function selectPackage(productId){
  if(isLive)return rpc('request_package',{p_product:productId});
  const s=demoState(),p=s.products.find(p=>p.id===productId);
  const existing=s.packages.find(x=>x.product_id===productId && x.status==='active' && x.remaining>0 && (!x.expires_at||Date.parse(x.expires_at)>Date.now()));
  if(existing)return existing.id;
  const pkg={id:crypto.randomUUID(),customer_id:'demo-customer',product_id:productId,status:'active',remaining:p.sessions,expires_at:expiryFor(p),created_at:new Date().toISOString()};
  s.packages.push(pkg);persist();return pkg.id;
}
export async function reserve(packageId,slotId){if(isLive)return rpc('reserve_slot',{p_package:packageId,p_slot:slotId});const result=bookDemo(demoState(),packageId,slotId);persist();return result.id;}
export async function cancelBooking(id,admin){if(isLive)return rpc('cancel_booking',{p_booking:id});const refunded=cancelDemo(demoState(),id,admin);persist();return refunded;}
export async function activatePackage(id){if(isLive)return rpc('activate_package',{p_package:id});const s=demoState(),pkg=s.packages.find(x=>x.id===id),p=s.products.find(x=>x.id===pkg.product_id);pkg.status='active';pkg.expires_at=expiryFor(p);persist();}
export async function saveSlot(slot){
  if(isLive)return rpc('save_calendar_slot',{p_id:slot.id||null,p_start:slot.starts_at,p_kind:slot.kind,p_open:slot.is_open});
  const s=demoState(),start=Date.parse(slot.starts_at),end=start+3600000;
  if(start<=Date.now())throw new Error('Choose a future date and time.');
  if(s.slots.some(x=>x.id!==slot.id && Date.parse(x.starts_at)<end && Date.parse(x.ends_at)>start))throw new Error('This overlaps another calendar slot.');
  const existing=s.slots.find(x=>x.id===slot.id);
  if(existing&&s.bookings.some(b=>b.slot_id===existing.id && holdsSlot(b.status))&&(existing.starts_at!==slot.starts_at||existing.kind!==slot.kind))throw new Error('Move or cancel existing bookings before changing the time or format.');
  const next={...slot,id:slot.id||crypto.randomUUID(),ends_at:new Date(end).toISOString(),capacity:slot.kind==='group'?6:1};
  if(existing)Object.assign(existing,next);else s.slots.push(next);persist();
}
export async function moveBooking(id,target){
  if(isLive)return rpc('move_booking',{p_booking:id,p_target:target});
  const s=demoState(),b=s.bookings.find(x=>x.id===id);
  if(!b||!holdsSlot(b.status))throw new Error('Booking is no longer active.');
  const backup=structuredClone(s),originalStatus=b.status;
  try{cancelDemo(s,id,true);const moved=bookDemo(s,b.package_id,target,b.customer_id);s.bookings=s.bookings.filter(x=>x.id!==moved.id);b.slot_id=target;b.status=originalStatus;b.credit_used=moved.credit_used;persist();}catch(error){demo=backup;throw error;}
}
export async function reserveDates(packageId,slotIds){
  if(isLive)return rpc('reserve_dates',{p_package:packageId,p_slots:slotIds});
  const s=demoState(),backup=structuredClone(s);
  try{for(const id of slotIds)bookDemo(s,packageId,id);persist();}catch(error){demo=backup;throw error;}
}

export async function adminSnapshot(){
  if(!isLive)return structuredClone(demoState());
  const slots=await rpc('admin_calendar_slots',{}); // Authorize before reading admin data.
  const [products,packages,bookings,profiles,guest_customers]=await Promise.all([
    request('/rest/v1/products?select=*&order=kind,sessions'),request('/rest/v1/customer_packages?select=*&order=created_at.desc'),
    request('/rest/v1/bookings?select=*&order=created_at.desc'),request('/rest/v1/profiles?select=*'),request('/rest/v1/guest_customers?select=*&order=name'),
  ]);
  return {products,slots,packages,bookings,profiles,guest_customers};
}
export async function adminSaveBooking(values){
  if(isLive)return rpc('admin_save_booking',{p_booking:values.id||null,p_slot:values.slot_id,p_customer:values.customer_id||null,p_guest:values.guest_customer_id||null,p_name:values.name||'',p_email:values.email||null,p_format:values.format,p_status:values.status,p_package:values.package_id||null});
  const id=saveAdminDemo(demoState(),values);persist();return id;
}
export async function adminConfirmBooking(id){
  if(isLive)return rpc('admin_confirm_booking',{p_booking:id});
  const b=demoState().bookings.find(b=>b.id===id);if(b?.status!=='pending')throw new Error('Only a pending booking can be confirmed.');b.status='confirmed';persist();
}
export async function adminDeleteBooking(id){if(isLive)return rpc('admin_delete_booking',{p_booking:id});deleteAdminDemo(demoState(),id);persist();}
