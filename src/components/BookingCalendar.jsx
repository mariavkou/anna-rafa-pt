import { useEffect, useState } from 'react';
import * as api from '../booking/api';
import { FORMATS, money, productLabel, dayKey, prettyDate, timeLabel, monday, addDays, availableCredits, compatible, zurichInstant } from '../booking/model';
import './BookingCalendar.css';
import '../booking/calendar.css';

const empty = {products:[],slots:[],packages:[],bookings:[],profiles:[]};

export default function BookingCalendar({trainingType='online',initialTab='personal'}) {
  const [data,setData]=useState(empty),[user,setUser]=useState(api.currentUser()),[loading,setLoading]=useState(true);
  const [format,setFormat]=useState(initialTab==='group'?'group':trainingType==='in-person'?'person':'online');
  const [packageId,setPackageId]=useState(''),[chosen,setChosen]=useState([]),[week,setWeek]=useState(monday());
  const [busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[error,setError]=useState('');
  const [tab,setTab]=useState('customer'),[previewAdmin,setPreviewAdmin]=useState(false),[cancelTarget,setCancelTarget]=useState(null);
  const [slotEdit,setSlotEdit]=useState(null),[moveTarget,setMoveTarget]=useState(null);
  const profile=data.profiles.find(p=>p.id===user?.id),isAdmin=api.isLive?profile?.role==='admin':previewAdmin;
  const customerId=api.isLive?user?.id:'demo-customer';
  const product=id=>data.products.find(p=>p.id===id);
  const slot=id=>data.slots.find(s=>s.id===id);
  const owner=id=>data.profiles.find(p=>p.id===id);
  const reserved=s=>api.isLive?Number(s.reserved):data.bookings.filter(b=>b.slot_id===s.id&&b.status==='confirmed').length;
  const ownPackages=data.packages.filter(p=>p.customer_id===customerId);
  const packages=ownPackages.filter(p=>product(p.product_id)?.kind===format);
  const selectedPackage=packages.find(p=>p.id===packageId);
  const selectedProduct=product(selectedPackage?.product_id);
  const active=availableCredits(selectedPackage);
  const weekDays=Array.from({length:7},(_,i)=>addDays(week,i));
  const weeklySlots=data.slots.filter(s=>weekDays.includes(dayKey(s.starts_at)));
  const refresh=async()=>{const next=await api.snapshot();setData(next);return next;};

  useEffect(()=>{
    let alive=true;
    const load=()=>api.snapshot().then(next=>{if(alive){setData(next);}}).catch(e=>{if(alive)setError(e.message);}).finally(()=>{if(alive)setLoading(false);});
    load();const interval=setInterval(load,15000);window.addEventListener('focus',load);
    return()=>{alive=false;clearInterval(interval);window.removeEventListener('focus',load);};
  },[]);
  async function run(action){setBusy(true);setError('');setNotice('');try{await action();}catch(e){setError(e.message);try{await refresh();}catch{/* Keep the original action error visible. */}}finally{setBusy(false);}}
  function changeFormat(next){setFormat(next);setPackageId('');setChosen([]);setNotice('');}
  async function choosePackage(id){await run(async()=>{const selected=await api.selectPackage(id);await refresh();setPackageId(selected);setChosen([]);setNotice(api.isLive?'Package selected. Anna will activate a new package before you can confirm bookings.':'Preview package ready. Choose one or more dates below.');});}
  function toggleDate(s){
    if(chosen.includes(s.id)){setChosen(chosen.filter(id=>id!==s.id));return;}
    if(!active){setError('Choose an active package first. New live packages need Anna’s activation.');return;}
    if(chosen.length>=selectedPackage.remaining){setError('You have selected all remaining sessions in this package.');return;}
    setError('');setChosen([...chosen,s.id]);
  }
  async function confirmDates(){await run(async()=>{await api.reserveDates(packageId,chosen);setChosen([]);await refresh();setNotice(`${api.isLive?'Booked':'Saved in this preview'}: your dates are reserved and your package balance has been updated.`);});}
  function canPick(s){
    return active&&s.is_open&&Date.parse(s.starts_at)>Date.now()&&compatible(selectedProduct,s)&&reserved(s)<s.capacity&&(!selectedPackage.expires_at||Date.parse(s.starts_at)<Date.parse(selectedPackage.expires_at))&&!data.bookings.some(b=>b.customer_id===customerId&&b.slot_id===s.id&&b.status==='confirmed');
  }
  const upcoming=data.bookings.filter(b=>b.status==='confirmed'&&slot(b.slot_id)&&Date.parse(slot(b.slot_id).starts_at)>Date.now()&&(tab==='admin'||b.customer_id===customerId)).sort((a,b)=>Date.parse(slot(a.slot_id).starts_at)-Date.parse(slot(b.slot_id).starts_at));

  return <div className="booking-calendar calendar-app">
    <div className="mode-note">{api.isLive?'Bookings · Payments are not enabled. New packages are activated by Anna.':'LOCAL PREVIEW · Example availability. Saved only in this browser; no real booking or payment.'}</div>
    {!api.isLive&&<div className="calendar-toolbar"><span>Try booking as a customer, then switch to Anna’s preview calendar.</span><button className="btn" onClick={()=>{setPreviewAdmin(!previewAdmin);setTab(!previewAdmin?'admin':'customer');}}> {previewAdmin?'Return to customer preview':'Preview as Anna'}</button></div>}
    {api.isLive&&!user&&<AccountForm busy={busy} onSubmit={(values)=>run(async()=>{const signed=await api.authenticate(values.email,values.password,values.signup,values.name);setUser(api.currentUser());await refresh();setNotice(signed?'Signed in. Choose your package below.':'Check your email to confirm your account, then sign in here.');})}/>}
    {api.isLive&&user&&<div className="calendar-toolbar"><span>Signed in as {profile?.name||user.email}</span><button className="btn" disabled={busy} onClick={()=>run(async()=>{await api.signOut();setUser(null);setPackageId('');setChosen([]);setTab('customer');await refresh();})}>Sign out</button></div>}
    {isAdmin&&<div className="tabs" role="tablist" aria-label="Booking views">{['customer','admin'].map(t=><button key={t} className={`tab ${tab===t?'active':''}`} role="tab" aria-selected={tab===t} onClick={()=>setTab(t)}>{t==='admin'?'Anna’s calendar':'Customer booking'}</button>)}</div>}
    {error&&<div className="message warn" role="alert">{error}</div>}
    {notice&&<div className="status-note" role="status">{notice}</div>}
    {loading?<p role="status">Loading calendar…</p>:<>
    {tab==='customer'&&<>
      <section className="panel">
        <h2>1. Choose your training</h2>
        <p>Choose a format and package first, then select the dates that suit you. You can book your sessions together or return later for the remaining dates.</p>
        <fieldset className="format-choices"><legend className="visually-hidden">Training format</legend>{FORMATS.map(f=><label key={f.id} className="format-choice"><input type="radio" name="booking-format" checked={format===f.id} onChange={()=>changeFormat(f.id)}/><span><strong>{f.label}</strong><small>{f.detail}</small></span></label>)}</fieldset>
        <h3>Choose your package</h3>
        {packages.length>0&&<div className="existing-packages"><h4>Your packages</h4>{packages.map(p=><button key={p.id} disabled={busy||p.status==='active'&&!availableCredits(p)} className={`package-option ${p.id===packageId?'selected':''}`} aria-pressed={p.id===packageId} onClick={()=>{setPackageId(p.id);setChosen([]);}}>{productLabel(product(p.product_id))} · {p.status==='pending'?'Awaiting Anna’s activation':`${p.remaining} remaining`}{p.expires_at?` · valid until ${prettyDate(p.expires_at)}`:''}</button>)}</div>}
        <div className="package-choices">{data.products.filter(p=>p.kind===format).map(p=><article className={`smallcard ${selectedPackage?.product_id===p.id?'selected':''}`} key={p.id}>
          <span className="pill">{productLabel(p)}</span><strong>{money(p.price)}</strong><p>{p.validity_months?`Valid ${p.validity_months} months from activation`:'Package terms confirmed with Anna'}{format==='duo'?' · Total for both participants':''}</p>
          <button className="btn primary" disabled={busy||(api.isLive&&!user)} onClick={()=>choosePackage(p.id)}>{selectedPackage?.product_id===p.id?'Selected':api.isLive?'Select package':'Select preview package'}</button>
        </article>)}</div>
        {api.isLive&&!user&&<p className="status-note">Sign in or create an account above to select your package.</p>}
        {format==='online'&&<p className="status-note">Existing Online Group members attending at least twice weekly may qualify for the 10-session Online Personal package at CHF 750. Contact Anna to arrange this offer.</p>}
        {(format==='person'||format==='duo')&&<p className="status-note">Private gym or studio training is arranged individually, with pricing upon request depending on location and studio fees. Travel fees may apply outside Thalwil and nearby areas.</p>}
        {format==='group'&&<p className="status-note">Greek-speaking classes · up to 6 people. One reservation uses one class. All times are in Switzerland local time.</p>}
      </section>
      <section className="panel" aria-labelledby="choose-dates">
        <h2 id="choose-dates">2. Choose your dates</h2>
        {!selectedPackage?<p className="status-note">Select a package above to unlock the calendar.</p>:<p className="status-note">{selectedPackage.status==='pending'?'Your package is awaiting activation by Anna. You can browse availability; date selection unlocks after activation.':`${selectedPackage.remaining} sessions remaining · ${chosen.length} selected. You do not have to book them all at once.`}</p>}
        <WeekNavigation week={week} setWeek={setWeek}/>
        <div className="calendar-scroll"><div className="date-grid">{weekDays.map(day=><div className="calendar-day" key={day}><h3>{prettyDate(`${day}T12:00Z`)}</h3>{weeklySlots.filter(s=>dayKey(s.starts_at)===day&&(format==='group'?s.kind==='group':s.kind==='personal')).map(s=>{
          const own=data.bookings.some(b=>b.slot_id===s.id&&b.customer_id===customerId&&b.status==='confirmed');
          const full=reserved(s)>=s.capacity;
          return <button key={s.id} className={`date-slot ${chosen.includes(s.id)?'selected':''}`} disabled={busy||!canPick(s)} aria-pressed={chosen.includes(s.id)} onClick={()=>toggleDate(s)}><strong>{timeLabel(s.starts_at)}</strong><small>{own?'Already booked':!s.is_open?'Unavailable':Date.parse(s.starts_at)<=Date.now()?'Past':full?'Fully booked':format==='group'?`${s.capacity-reserved(s)} places left`:'Available'}</small></button>;
        })}{!weeklySlots.some(s=>dayKey(s.starts_at)===day&&(format==='group'?s.kind==='group':s.kind==='personal'))&&<small>No sessions</small>}</div>)}</div></div>
        <p className="foot">60-minute sessions · Times shown in Europe/Zurich · Availability is checked again when you confirm.</p>
        {chosen.length>0&&<div className="reservation-summary"><h3>Your selected dates</h3><ul>{chosen.map(id=>{const s=slot(id);return s&&<li key={id}>{prettyDate(s.starts_at)} at {timeLabel(s.starts_at)}<button className="text-action" onClick={()=>setChosen(chosen.filter(x=>x!==id))} disabled={busy}>Remove</button></li>;})}</ul><p>{selectedPackage.remaining-chosen.length} sessions will remain in this package.</p><button className="btn primary" disabled={busy||!active} onClick={confirmDates}>{busy?'Saving…':`${api.isLive?'Confirm':'Save preview'} ${chosen.length} ${chosen.length===1?'booking':'bookings'}`}</button></div>}
      </section>
    </>}
    {tab==='admin'&&isAdmin&&<>
      <section className="panel"><h2>Anna’s calendar</h2><p>Individual and Duo bookings share your personal availability. Group classes reserve the entire hour, with up to six customer places.</p><div className="calendar-toolbar"><button className="btn primary" onClick={()=>setSlotEdit({kind:'personal',is_open:true})}>Add availability</button><button className="btn" disabled={busy} onClick={()=>run(refresh)}>Refresh calendar</button></div><WeekNavigation week={week} setWeek={setWeek}/><div className="calendar-scroll"><div className="date-grid">{weekDays.map(day=><div className="calendar-day" key={day}><h3>{prettyDate(`${day}T12:00Z`)}</h3>{weeklySlots.filter(s=>dayKey(s.starts_at)===day).map(s=><button className={`date-slot ${!s.is_open?'closed':''}`} key={s.id} onClick={()=>setSlotEdit(s)}><strong>{timeLabel(s.starts_at)}</strong><small>{s.kind==='group'?'Group':'Personal / Duo'} · {reserved(s)}/{s.capacity}</small><small>{s.is_open?'Open':'Blocked'}</small></button>)}</div>)}</div></div></section>
      {slotEdit&&<SlotEditor key={slotEdit.id||"new"} slot={slotEdit} busy={busy} onClose={()=>setSlotEdit(null)} onSave={values=>run(async()=>{await api.saveSlot(values);await refresh();setSlotEdit(null);setNotice('Availability saved.');})}/>}
      <section className="panel"><h2>Package requests</h2><p>Activate packages after agreeing the terms with each customer. Payments are handled separately for now.</p>{data.packages.filter(p=>p.status==='pending').map(p=><div className="booking-row" key={p.id}><div><strong>{owner(p.customer_id)?.name||owner(p.customer_id)?.email||'Customer'}</strong><p>{FORMATS.find(f=>f.id===product(p.product_id)?.kind)?.label} · {productLabel(product(p.product_id))} · {money(product(p.product_id).price)}</p></div><button className="btn primary" disabled={busy} onClick={()=>run(async()=>{await api.activatePackage(p.id);await refresh();setNotice('Package activated. The customer can now book dates.');})}>Activate package</button></div>)}{!data.packages.some(p=>p.status==='pending')&&<p className="status-note">No packages awaiting activation.</p>}</section>
    </>}
    <section className="panel"><h2>{tab==='admin'?'Upcoming bookings':'My bookings'}</h2><p className="foot">Cancel at least 24 hours before a session to return the credit. Later cancellations use the session. Anna’s cancellations always return the credit.</p>{upcoming.length===0&&<p className="status-note">No upcoming bookings.</p>}{upcoming.map(b=>{const s=slot(b.slot_id),pkg=data.packages.find(p=>p.id===b.package_id),p=product(pkg?.product_id);return <div className="booking-row" key={b.id}><div><strong>{prettyDate(s.starts_at)} · {timeLabel(s.starts_at)}</strong><p>{FORMATS.find(f=>f.id===p?.kind)?.label}{tab==='admin'?` · ${owner(b.customer_id)?.name||owner(b.customer_id)?.email||'Customer'}`:''}</p></div><div className="row">{tab==='admin'&&<button className="btn" disabled={busy} onClick={()=>setMoveTarget(b)}>Move</button>}<button className="btn" disabled={busy} onClick={()=>setCancelTarget(b)}>Cancel booking</button></div></div>;})}</section>
    {cancelTarget&&<div className="panel confirmation" role="region" aria-label="Confirm cancellation"><h3>Cancel this booking?</h3><p>{tab==='admin'||Date.parse(slot(cancelTarget.slot_id).starts_at)-Date.now()>=86400000?'One session will return to the package.':'This is within 24 hours. The session will still be deducted from the package.'}</p><div className="row"><button className="btn" disabled={busy} onClick={()=>setCancelTarget(null)}>Keep booking</button><button className="btn primary" disabled={busy} onClick={()=>run(async()=>{const refund=await api.cancelBooking(cancelTarget.id,tab==='admin');setCancelTarget(null);await refresh();setNotice(refund?'Booking cancelled. One credit returned.':'Booking cancelled. The session was used under the 24-hour policy.');})}>Confirm cancellation</button></div></div>}
    {moveTarget&&<MoveEditor booking={moveTarget} slots={data.slots} product={product(data.packages.find(p=>p.id===moveTarget.package_id)?.product_id)} reserved={reserved} busy={busy} onClose={()=>setMoveTarget(null)} onMove={id=>run(async()=>{await api.moveBooking(moveTarget.id,id);setMoveTarget(null);await refresh();setNotice('Booking moved. Package balance unchanged.');})}/>}
    <section className="panel"><h3>Questions? Contact Anna</h3><div className="row"><a className="btn primary" href="https://wa.me/41798636382" target="_blank" rel="noopener noreferrer">WhatsApp</a><a className="btn" href="mailto:a.rafailidou@yahoo.com">Email Anna</a><a className="btn" href="https://www.instagram.com/anna_rafailidou/" target="_blank" rel="noopener noreferrer">Instagram</a></div></section>
    </>}
  </div>;
}
function WeekNavigation({week,setWeek}){return <div className="calendar-toolbar week-navigation"><button className="btn" onClick={()=>setWeek(addDays(week,-7))}>Previous week</button><strong>{prettyDate(`${week}T12:00Z`)} – {prettyDate(`${addDays(week,6)}T12:00Z`)}</strong><button className="btn" onClick={()=>setWeek(addDays(week,7))}>Next week</button></div>;}
function AccountForm({onSubmit,busy}){
 const [signup,setSignup]=useState(false);
 return <section className="panel"><h2>{signup?'Create your account':'Sign in to book'}</h2><p>Your account keeps your packages and bookings together.</p><form onSubmit={e=>{e.preventDefault();const values=Object.fromEntries(new FormData(e.currentTarget));onSubmit({...values,signup});}}>{signup&&<label>Your name<input name="name" autoComplete="name" required maxLength={120}/></label>}<div className="formgrid"><label>Email<input name="email" type="email" autoComplete="email" required/></label><label>Password<input name="password" type="password" autoComplete={signup?'new-password':'current-password'} minLength={8} required/></label></div><div className="row"><button className="btn primary" disabled={busy}>{signup?'Create account':'Sign in'}</button><button className="text-action" type="button" disabled={busy} onClick={()=>setSignup(!signup)}>{signup?'Already have an account? Sign in':'Create an account'}</button></div></form></section>;
}
function SlotEditor({slot,busy,onClose,onSave}){
 const day=slot.starts_at?dayKey(slot.starts_at):dayKey(new Date()),time=slot.starts_at?timeLabel(slot.starts_at):'09:00';
 const [validation,setValidation]=useState('');
 return <section className="panel" key={slot.id||'new'}><h3>{slot.id?'Edit availability':'Add availability'}</h3><p>Times are in Switzerland local time. All sessions last 60 minutes. A blocked slot keeps existing bookings but accepts no new ones.</p><form key={slot.id||'new'} onSubmit={e=>{e.preventDefault();const v=Object.fromEntries(new FormData(e.currentTarget));try{const starts_at=zurichInstant(v.day,v.time);setValidation('');onSave({...slot,starts_at,kind:v.kind,is_open:v.open==='on'});}catch(err){setValidation(err.message);}}}><div className="formgrid"><label>Date<input name="day" type="date" defaultValue={day} required/></label><label>Time<input name="time" type="time" defaultValue={time} required/></label><label>Format<select name="kind" defaultValue={slot.kind}><option value="personal">Personal / Duo</option><option value="group">Group · 6 places</option></select></label></div><label className="checkbox-label"><input type="checkbox" name="open" defaultChecked={slot.is_open}/>Open for bookings</label>{validation&&<p role="alert">{validation}</p>}<div className="row"><button className="btn primary" disabled={busy}>Save availability</button><button type="button" className="btn" disabled={busy} onClick={onClose}>Close</button></div></form></section>;
}
function MoveEditor({booking,slots,product,reserved,busy,onClose,onMove}){return <section className="panel"><h3>Move this booking</h3><form onSubmit={e=>{e.preventDefault();onMove(new FormData(e.currentTarget).get('target'));}}><label>New time<select name="target" required defaultValue=""><option value="" disabled>Choose a date</option>{slots.filter(s=>s.id!==booking.slot_id&&s.is_open&&Date.parse(s.starts_at)>Date.now()&&compatible(product,s)&&reserved(s)<s.capacity).map(s=><option key={s.id} value={s.id}>{prettyDate(s.starts_at)} · {timeLabel(s.starts_at)}</option>)}</select></label><div className="row"><button className="btn primary" disabled={busy}>Move booking</button><button className="btn" type="button" disabled={busy} onClick={onClose}>Keep original time</button></div></form></section>;}
