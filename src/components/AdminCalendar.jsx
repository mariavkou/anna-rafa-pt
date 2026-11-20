import { useEffect, useState } from 'react';
import * as api from '../booking/api';
import { FORMATS, productLabel, money, dayKey, prettyDate, timeLabel, monday, addDays, holdsSlot, zurichInstant } from '../booking/model';
import './BookingCalendar.css';
import '../booking/calendar.css';
import '../booking/admin.css';

const EMPTY={products:[],slots:[],packages:[],bookings:[],profiles:[],guest_customers:[]};

export default function AdminCalendar(){
  const [user,setUser]=useState(api.currentUser()),[preview,setPreview]=useState(false);
  const [data,setData]=useState(EMPTY),[authorized,setAuthorized]=useState(false),[loading,setLoading]=useState(false);
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
  const [week,setWeek]=useState(monday()),[details,setDetails]=useState('');
  const [editing,setEditing]=useState(null),[slotEdit,setSlotEdit]=useState(null),[action,setAction]=useState(null);
  const [filter,setFilter]=useState('upcoming'),[search,setSearch]=useState('');
  const product=id=>data.products.find(p=>p.id===id);
  const slot=id=>data.slots.find(s=>s.id===id);
  const name=b=>b.guest_customer_id?data.guest_customers.find(c=>c.id===b.guest_customer_id)?.name||'Customer':data.profiles.find(p=>p.id===b.customer_id)?.name||data.profiles.find(p=>p.id===b.customer_id)?.email||'Customer';
  const format=b=>b.format||product(data.packages.find(p=>p.id===b.package_id)?.product_id)?.kind||'person';
  const roster=id=>data.bookings.filter(b=>b.slot_id===id&&holdsSlot(b.status));
  const count=s=>roster(s.id).length;
  async function refresh(){const next=await api.adminSnapshot();setData(next);setAuthorized(true);return next;}
  async function run(fn){setBusy(true);setError('');setMessage('');try{await fn();}catch(e){setError(e.message);}finally{setBusy(false);}}
  useEffect(()=>{
    if(api.isLive?!user:!preview){setAuthorized(false);return;}
    let alive=true;
    setLoading(true);
    const load=()=>api.adminSnapshot().then(next=>{if(alive){setData(next);setAuthorized(true);}}).catch(e=>{if(alive){setError(e.message);setAuthorized(false);setData(EMPTY);}}).finally(()=>{if(alive)setLoading(false);});
    load();const timer=setInterval(load,15000);window.addEventListener('focus',load);
    return()=>{alive=false;clearInterval(timer);window.removeEventListener('focus',load);};
  },[user?.id,preview]);
  const days=Array.from({length:7},(_,i)=>addDays(week,i));
  const filtered=data.bookings.filter(b=>{
    const s=slot(b.slot_id);if(!s)return false;
    return (filter==='all'||filter==='upcoming'&&holdsSlot(b.status)&&Date.parse(s.starts_at)>Date.now()||filter===b.status)&&`${name(b)} ${FORMATS.find(f=>f.id===format(b))?.label}`.toLowerCase().includes(search.toLowerCase());
  }).sort((a,b)=>Date.parse(slot(a.slot_id).starts_at)-Date.parse(slot(b.slot_id).starts_at));
  function actions(b){return <div className="row admin-row-actions">
    {b.status==='pending'&&<button className="btn primary" disabled={busy} onClick={()=>run(async()=>{await api.adminConfirmBooking(b.id);await refresh();setMessage('Booking confirmed.');})}>Confirm</button>}
    {holdsSlot(b.status)&&<button className="btn" disabled={busy} onClick={()=>setEditing({...b,format:format(b)})}>Edit</button>}
    {holdsSlot(b.status)&&<button className="btn" disabled={busy} onClick={()=>setAction({kind:'cancel',booking:b})}>Cancel</button>}
    <button className="btn danger-action" disabled={busy} onClick={()=>setAction({kind:'delete',booking:b})}>Delete</button>
  </div>;}
  useEffect(()=>{if(editing)document.getElementById('booking-editor-heading')?.scrollIntoView({block:'start'});},[editing]);
  useEffect(()=>{if(slotEdit)document.getElementById('admin-slot-editor')?.scrollIntoView({block:'start'});},[slotEdit]);
  const selectedSlot=slot(details);
  return <div className="booking-calendar calendar-app admin-app">
    <div className="admin-topbar"><div><div className="eyebrow">Anna Rafailidou · Administration</div><h1>Anna’s calendar</h1></div><div className="row"><a className="btn" href="./bookings.html">Customer booking page</a>{authorized&&<button className="btn" disabled={busy} onClick={()=>run(async()=>{try{if(api.isLive)await api.signOut();}finally{setAuthorized(false);setData(EMPTY);setUser(null);setPreview(false);setEditing(null);setDetails('');setSlotEdit(null);setAction(null);}})}>{api.isLive?'Sign out':'Close preview'}</button>}</div></div>
    {!api.isLive&&<div className="mode-note">LOCAL PREVIEW · Real password protection requires connecting Supabase. This preview uses only this browser’s sample data.</div>}
    {error&&<div className="message warn" role="alert">{error}</div>}
    {message&&<p className="status-note" role="status">{message}</p>}
    {!api.isLive&&!preview&&<section className="panel admin-login"><h2>Admin sign-in</h2><p>Connect Supabase to enable Anna’s email and password sign-in. Until then, try the workspace with local sample data.</p><fieldset disabled className="preview-login-fields"><label>Email<input type="email" autoComplete="off" placeholder="Anna’s account email"/></label><label>Password<input type="password" autoComplete="off" placeholder="Supabase connection required"/></label><button className="btn primary" disabled>Sign in</button></fieldset><button className="btn" onClick={()=>setPreview(true)}>Open local admin preview</button></section>}
    {api.isLive&&!authorized&&!loading&&<section className="panel admin-login"><h2>Admin sign-in</h2><p>Use Anna’s email and password. Only an account with the admin role can open this workspace.</p><form onSubmit={e=>{e.preventDefault();const v=Object.fromEntries(new FormData(e.currentTarget));run(async()=>{await api.authenticate(v.email,v.password,false);setUser(api.currentUser());await refresh();});}}><label>Email<input name="email" type="email" autoComplete="username" required/></label><label>Password<input name="password" type="password" autoComplete="current-password" required/></label><button className="btn primary" disabled={busy}>Sign in</button></form></section>}
    {loading&&!authorized&&<p role="status">Checking admin access…</p>}
    {authorized&&<>
      <div className="admin-stats"><span><strong>{data.bookings.filter(b=>b.status==='pending').length}</strong> Awaiting confirmation</span><span><strong>{data.bookings.filter(b=>b.status==='confirmed'&&Date.parse(slot(b.slot_id)?.starts_at)>Date.now()).length}</strong> Upcoming confirmed</span><span><strong>{data.guest_customers.length}</strong> Saved customer records</span></div>
      <section className="panel"><div className="calendar-toolbar"><div><h2>Weekly calendar</h2><p className="foot">Switzerland local time · Hover a slot for customer names, or open it for the full list.</p></div><div className="row"><button className="btn primary" disabled={busy} onClick={()=>setEditing({format:'person',status:'confirmed'})}>Create booking</button><button className="btn" disabled={busy} onClick={()=>setSlotEdit({kind:'personal',is_open:true})}>Add availability</button><button className="btn" disabled={busy} onClick={()=>run(refresh)}>Refresh</button></div></div>
        <div className="calendar-toolbar"><button className="btn" onClick={()=>setWeek(addDays(week,-7))}>Previous week</button><strong>{prettyDate(`${week}T12:00Z`)} – {prettyDate(`${addDays(week,6)}T12:00Z`)}</strong><button className="btn" onClick={()=>setWeek(addDays(week,7))}>Next week</button></div>
        <div className="calendar-scroll"><div className="date-grid">{days.map(day=><div className="calendar-day" key={day}><h3>{prettyDate(`${day}T12:00Z`)}</h3>{data.slots.filter(s=>dayKey(s.starts_at)===day).sort((a,b)=>Date.parse(a.starts_at)-Date.parse(b.starts_at)).map(s=>{
          const people=roster(s.id),hover=people.length?people.map(b=>`${name(b)} · ${b.status}`).join('\n'):'No customers in this slot';
          return <button key={s.id} className={`date-slot ${!s.is_open?'closed':''} ${details===s.id?'selected':''}`} disabled={busy} title={hover} aria-label={`${prettyDate(s.starts_at)} ${timeLabel(s.starts_at)}, ${s.kind}, ${count(s)} of ${s.capacity}. ${hover}`} onClick={()=>setDetails(s.id)}><strong>{timeLabel(s.starts_at)}</strong><small>{s.kind==='group'?'Group':'Personal / Duo'} · {count(s)}/{s.capacity}</small><small>{s.is_open?people.some(b=>b.status==='pending')?'Pending requests':'Open':'Blocked'}</small></button>;
        })}</div>)}</div></div>
      </section>
      {selectedSlot&&<section className="panel slot-details" aria-labelledby="slot-details-heading"><div className="calendar-toolbar"><h2 id="slot-details-heading">{prettyDate(selectedSlot.starts_at)} · {timeLabel(selectedSlot.starts_at)}</h2><button className="text-action" onClick={()=>setDetails('')}>Close slot</button></div><p>{selectedSlot.kind==='group'?'Online group':'Personal / Duo'} · {count(selectedSlot)}/{selectedSlot.capacity} places held · {selectedSlot.is_open?'Open':'Blocked'}</p>{roster(details).map(b=><div className="booking-row" key={b.id}><div><strong>{name(b)}</strong><p>{FORMATS.find(f=>f.id===format(b))?.label} · {b.status==='pending'?'Awaiting confirmation':'Confirmed'}</p></div>{actions(b)}</div>)}{roster(details).length===0&&<p className="status-note">No customers booked in this slot.</p>}<div className="row"><button className="btn primary" disabled={busy||count(selectedSlot)>=selectedSlot.capacity||!selectedSlot.is_open||Date.parse(selectedSlot.starts_at)<=Date.now()} onClick={()=>setEditing({slot_id:details,format:selectedSlot.kind==='group'?'group':'person',status:'confirmed'})}>Add customer booking</button><button className="btn" disabled={busy} onClick={()=>setSlotEdit(selectedSlot)}>Edit availability</button></div></section>}
      {slotEdit&&<AdminSlotForm key={slotEdit.id||'new'} slot={slotEdit} busy={busy} onClose={()=>setSlotEdit(null)} onSave={values=>run(async()=>{await api.saveSlot(values);await refresh();setSlotEdit(null);setMessage('Availability saved.');})}/>}
      {editing&&<AdminBookingForm key={editing.id||`new-${editing.slot_id||''}`} booking={editing} data={data} busy={busy} count={count} onClose={()=>setEditing(null)} onSave={values=>run(async()=>{await api.adminSaveBooking(values);await refresh();setEditing(null);setMessage('Booking saved.');})}/>}
      {action&&<section className="panel confirmation" aria-label="Confirm booking change"><h2>{action.kind==='delete'?'Delete this booking?':'Cancel this booking?'}</h2><p>{name(action.booking)} · {prettyDate(slot(action.booking.slot_id).starts_at)} at {timeLabel(slot(action.booking.slot_id).starts_at)}</p><p>{action.kind==='delete'?'This permanently removes the booking record. Any reserved package credit is returned once.':'This keeps a cancelled record and returns any reserved package credit.'}</p><div className="row"><button className="btn" disabled={busy} onClick={()=>setAction(null)}>Keep booking</button><button className="btn primary" disabled={busy} onClick={()=>run(async()=>{if(action.kind==='delete')await api.adminDeleteBooking(action.booking.id);else await api.cancelBooking(action.booking.id,true);await refresh();setAction(null);setMessage('Booking updated.');})}>{action.kind==='delete'?'Delete booking':'Cancel booking'}</button></div></section>}
      <section className="panel"><h2>All bookings</h2><div className="formgrid"><label>Search customer<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Customer name"/></label><label>Show<select value={filter} onChange={e=>setFilter(e.target.value)}><option value="upcoming">Upcoming bookings</option><option value="all">All bookings, including history</option><option value="pending">Awaiting confirmation</option><option value="confirmed">Confirmed</option><option value="cancelled">Cancelled</option></select></label></div>{filtered.map(b=><div className="booking-row" key={b.id}><div><strong>{name(b)}</strong><p>{prettyDate(slot(b.slot_id).starts_at)} · {timeLabel(slot(b.slot_id).starts_at)} · {FORMATS.find(f=>f.id===format(b))?.label}</p><span className={`booking-status ${b.status}`}>{b.status==='pending'?'Awaiting confirmation':b.status}</span></div>{actions(b)}</div>)}{filtered.length===0&&<p className="status-note">No bookings match this view.</p>}</section>
      <section className="panel"><h2>Package requests</h2><p>Confirm the customer’s terms and eligibility before activating a package.</p>{data.packages.filter(p=>p.status==='pending').map(p=><div className="booking-row" key={p.id}><div><strong>{data.profiles.find(c=>c.id===p.customer_id)?.name||data.profiles.find(c=>c.id===p.customer_id)?.email||'Customer'}</strong><p>{FORMATS.find(f=>f.id===product(p.product_id)?.kind)?.label} · {productLabel(product(p.product_id))} · {money(product(p.product_id).price)}</p></div><button className="btn primary" disabled={busy} onClick={()=>run(async()=>{await api.activatePackage(p.id);await refresh();setMessage('Package activated.');})}>Activate package</button></div>)}{!data.packages.some(p=>p.status==='pending')&&<p className="status-note">No package requests.</p>}</section>
    </>}
  </div>;
}

function AdminBookingForm({booking,data,busy,count,onSave,onClose}){
  const [who,setWho]=useState(booking.customer_id?`account:${booking.customer_id}`:booking.guest_customer_id?`guest:${booking.guest_customer_id}`:'new');
  const guest=data.guest_customers.find(c=>c.id===booking.guest_customer_id);
  const [name,setName]=useState(guest?.name||''),[email,setEmail]=useState(guest?.email||'');
  const [format,setFormat]=useState(booking.format||'person'),[slotId,setSlotId]=useState(booking.slot_id||''),[packageId,setPackageId]=useState(booking.package_id||'');
  const accountId=who.startsWith('account:')?who.slice(8):null;
  const packages=data.packages.filter(p=>p.customer_id===accountId&&p.status==='active'&&(p.remaining>0||p.id===booking.package_id)&&data.products.find(x=>x.id===p.product_id)?.kind===format);
  const choices=data.slots.filter(s=>(format==='group')===(s.kind==='group')&&(s.id===booking.slot_id||s.is_open&&Date.parse(s.starts_at)>Date.now())).sort((a,b)=>Date.parse(a.starts_at)-Date.parse(b.starts_at));
  return <section className="panel admin-editor" aria-labelledby="booking-editor-heading"><h2 id="booking-editor-heading">{booking.id?'Edit booking':'Create a booking'}</h2><p>Choose an existing customer or add a name yourself. A customer login is not required for manually entered names.</p><form onSubmit={e=>{e.preventDefault();const values=Object.fromEntries(new FormData(e.currentTarget));onSave({...booking,slot_id:slotId,format,status:values.status,customer_id:accountId,guest_customer_id:who.startsWith('guest:')?who.slice(6):null,name,email,package_id:packageId||null});}}>
    <label>Customer<select value={who} onChange={e=>{const value=e.target.value;setWho(value);setPackageId('');const record=data.guest_customers.find(c=>`guest:${c.id}`===value);setName(record?.name||'');setEmail(record?.email||'');}}><option value="new">Add a customer name</option><optgroup label="Registered customers">{data.profiles.filter(p=>p.role!=='admin').map(p=><option key={p.id} value={`account:${p.id}`}>{p.name||p.email}</option>)}</optgroup><optgroup label="Saved customer names">{data.guest_customers.map(c=><option key={c.id} value={`guest:${c.id}`}>{c.name}</option>)}</optgroup></select></label>
    {!accountId&&<div className="formgrid"><label>Customer name{format==='duo'?'s · include both participants':''}<input value={name} onChange={e=>setName(e.target.value)} required maxLength={150} placeholder={format==='duo'?'e.g. Maria & Alex':'Full name'}/></label><label>Email · optional<input value={email} onChange={e=>setEmail(e.target.value)} type="email"/></label></div>}
    {who.startsWith('guest:')&&<p className="foot">Changing this saved customer’s name updates their other bookings too.</p>}
    <div className="formgrid"><label>Training format<select value={format} onChange={e=>{setFormat(e.target.value);setSlotId('');setPackageId('');}}>{FORMATS.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</select></label><label>Status<select name="status" defaultValue={booking.status||'confirmed'}><option value="pending">Awaiting confirmation</option><option value="confirmed">Confirmed</option></select></label></div>
    <label>Date and time · Switzerland<select value={slotId} onChange={e=>setSlotId(e.target.value)} required><option value="" disabled>Choose an available slot</option>{choices.map(s=><option key={s.id} value={s.id} disabled={s.id!==booking.slot_id&&count(s)>=s.capacity}>{prettyDate(s.starts_at)} · {timeLabel(s.starts_at)} · {count(s)}/{s.capacity}{count(s)>=s.capacity&&s.id!==booking.slot_id?' · Full':''}</option>)}</select></label>
    {choices.length===0&&<p className="status-note">Add availability for this format before creating the booking.</p>}
    {accountId&&<label>Package credit<select value={packageId} onChange={e=>setPackageId(e.target.value)}><option value="">Manual booking · do not deduct a package credit</option>{packages.map(p=><option key={p.id} value={p.id}>{productLabel(data.products.find(x=>x.id===p.product_id))} · {p.remaining} remaining</option>)}</select></label>}
    <p className="status-note">{packageId?'One session will be allocated to this booking. Editing or confirming it will not deduct the same credit twice.':'This is a manual booking. No package credit will be deducted.'} Pending bookings also hold their place in the calendar.</p>
    <div className="row"><button className="btn primary" disabled={busy}>Save booking</button><button type="button" className="btn" disabled={busy} onClick={onClose}>Close editor</button></div>
  </form></section>;
}

function AdminSlotForm({slot,busy,onSave,onClose}){
  const [error,setError]=useState('');
  return <section className="panel admin-editor" id="admin-slot-editor"><h2>{slot.id?'Edit availability':'Add availability'}</h2><p>All sessions last 60 minutes. Blocking a slot prevents new reservations and keeps its existing bookings.</p><form onSubmit={e=>{e.preventDefault();const v=Object.fromEntries(new FormData(e.currentTarget));try{setError('');onSave({...slot,starts_at:zurichInstant(v.day,v.time),kind:v.kind,is_open:v.open==='on'});}catch(err){setError(err.message);}}}><div className="formgrid"><label>Date<input name="day" type="date" defaultValue={slot.starts_at?dayKey(slot.starts_at):dayKey(new Date())} required/></label><label>Time · Switzerland<input name="time" type="time" defaultValue={slot.starts_at?timeLabel(slot.starts_at):'09:00'} required/></label><label>Format<select name="kind" defaultValue={slot.kind}><option value="personal">Personal / Duo</option><option value="group">Online group · 6 places</option></select></label></div><label className="checkbox-label"><input type="checkbox" name="open" defaultChecked={slot.is_open}/>Open for bookings</label>{error&&<p role="alert">{error}</p>}<div className="row"><button className="btn primary" disabled={busy}>Save availability</button><button className="btn" type="button" disabled={busy} onClick={onClose}>Close editor</button></div></form></section>;
}
