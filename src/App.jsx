import { useEffect } from "react";
import { restoreSectionNavigation } from "./sectionNavigation";
import Navbar from "./components/Navbar";
import "./App.css";
import reference_1 from "./assets/reference-1.webp";
import reference_2 from "./assets/reference-2.webp";
import reference_3 from "./assets/reference-3.jpeg";
import reference_4 from "./assets/reference-4.jpeg";

export default function App() {
  useEffect(restoreSectionNavigation, []);
  return <>
    <Navbar />
<main id="top"><section className="hero"><div className="hero-content"><div className="eyebrow">Strength · Mobility · Balance</div><h1>Move with<br />purpose.</h1><h2>Personal Training<br />Corrective Exercise</h2><em>The Art of Fitness</em><br /><a className="btn" href="./bookings.html">Start Your Journey</a></div></section><section className="values"><div className="value"><b>STRENGTH</b><span>Train with intention</span></div><div className="value"><b>MOBILITY</b><span>Move with freedom</span></div><div className="value"><b>BALANCE</b><span>Feel stronger every day</span></div></section><section className="about" id="about"><div aria-label="Anna Rafailidou training with a dumbbell in the gym" className="portrait" role="img" style={{"backgroundImage": `url(${reference_3})`, "backgroundPosition": "center 42%", "backgroundSize": "cover"}}></div><div className="about-copy"><div className="eyebrow">Meet Anna</div><h2>Movement is<br />a way of life.</h2><div className="line"></div><p className="subtitle">Anna Rafailidou · Personal Trainer & Sport Scientist</p><p>I believe training should be as individual as you are.</p><p>Combining Sports Science, Corrective Exercise, Pilates and Fitness, I create personalized training programs that help you move better, feel stronger and build confidence in your body.</p><p>Whether in person or online, every session is designed around you.</p></div></section><section className="services" id="services"><div className="eyebrow">What I Offer</div><h2>Training designed for you.</h2><p className="intro-line">A thoughtful combination of science, movement and individual attention.</p><div className="cards">
<article className="card"><span className="num">01 — PERSONAL TRAINING</span><h3>Combined & Personalized</h3><p>Every session is designed around you. I combine Fitness, Strength Training, Pilates, Mobility and Corrective Exercise according to your goals, abilities and progress. The focus can evolve from one session to the next.</p></article>
<article className="card"><span className="num">02 — STRENGTH & FITNESS</span><h3>Build Strength. Improve Performance.</h3><p>Progressive strength, cardiovascular and functional training to develop endurance, confidence and performance at your own level.</p></article>
<article className="card"><span className="num">03 — CORRECTIVE EXERCISE</span><h3>Move Better. Feel Stronger.</h3><p>Targeted training to improve mobility, stability, coordination and movement control, with attention to individual muscular imbalances.</p></article>
<article className="card"><span className="num">04 — PILATES MAT</span><h3>Strength. Control. Balance.</h3><p>Precise, mindful exercises for core stability, flexibility, posture and body awareness.</p></article>
<article className="card"><span className="num">05 — MOVEMENT ASSESSMENT · IN PERSON</span><h3>Understand Your Body.</h3><p>An individual, in-person assessment to explore movement patterns, mobility limitations and compensations and guide your training.</p></article>
<article className="card"><span className="num">06 — SEMI-PERSONAL TRAINING</span><h3>Small Groups. Personal Attention.</h3><p>Live small-group sessions with a maximum of six participants, so I can observe your movements, offer corrections and provide individual guidance. Greek-speaking online groups are available.</p></article>
</div></section><section className="approach" id="approach"><div><div className="eyebrow">My Approach</div><h2>Every Body Is Different.<br />Every Program Should Be Too.</h2></div><div><p>Every body is different. I combine Fitness, Pilates, Corrective Exercise, Strength and Mobility according to your movement, abilities and goals. Your training can change as you progress.</p><p>Using movement assessments and individualized training, I focus on improving movement quality, strength, mobility and balance. Your program evolves with your progress.</p><p>Above all, I believe exercise should be a pleasure, not an obligation. My goal is to help you feel confident, enjoy your training and make movement a natural part of your life.</p><div className="quote">Understand Your Body. Find Your Balance. Enjoy Your Training.</div></div></section><section className="mini-gallery"><div className="eyebrow">Movement in everyday life</div><h2>Find your freedom to move.</h2><img alt="Outdoor movement and fitness on a running track" className="gallery-photo" src={reference_4} /></section><section className="price-section" id="pricing"><div className="price-wrap">
<div className="eyebrow">Training & Pricing</div><h2>Choose what works for you.</h2>
<p className="price-intro">Individual coaching, small-group sessions or training at your preferred location. Every program is designed with personal attention.</p>
<div className="price-grid">
<article className="price-card"><div className="price-label">01 · One-to-one · Live Online</div><h3>Online Personal Training</h3><div className="price-desc">Train from anywhere with real-time guidance and movement corrections.</div>
<div className="price-subhead">Individual Personal Training</div>
<table className="price-table"><tbody><tr><td>5 Sessions</td><td>CHF 450</td></tr><tr><td>10 Sessions</td><td>CHF 850</td></tr><tr><td>20 Sessions</td><td>CHF 1’600</td></tr></tbody></table>
<div className="price-subhead">Combination Offer · For Existing Group Members</div><table className="price-table"><tbody><tr><td>10 Individual Personal Training Sessions</td><td><s>CHF 850</s>   CHF 750</td></tr></tbody></table>
<p className="price-note">Exclusive offer for clients already attending Semi-Personal Group Training: save CHF 100 when purchasing a package of 10 individual online Personal Training sessions. Group sessions are booked separately.</p>
<a className="price-chip" href="./bookings.html?type=online">Book Online Personal Training</a></article>
<article className="price-card"><div className="price-label">02 · Individual or Duo · In Person</div><h3>In-Person Training</h3><div className="price-desc">Personalized training at your home or outdoors, alone or together with a partner or friend. 60-minute sessions.</div>
<div className="price-subhead">Individual Personal Training</div><table className="price-table"><tbody><tr><td>Single Session</td><td>CHF 150</td></tr><tr><td>10 Sessions</td><td>CHF 1’400</td></tr><tr><td>20 Sessions</td><td>CHF 2’700</td></tr></tbody></table>
<div className="price-subhead">Duo Personal Training · 2 people</div><table className="price-table"><tbody><tr><td>Single Session</td><td>CHF 200</td></tr><tr><td>10 Sessions</td><td>CHF 1’800</td></tr><tr><td>20 Sessions</td><td>CHF 3’400</td></tr></tbody></table>
<p className="price-note">Duo prices are for both participants together. Starting rates for Thalwil and nearby areas; additional travel fees may apply based on location.</p>
<div className="price-rule"></div><div className="price-subhead">Private Gym or Studio</div><p className="price-desc" style={{"margin": "0"}}>At an agreed training location. Pricing upon request, depending on location and studio fees.</p>
<a className="price-chip" href="./bookings.html?type=in-person">Request In-Person Training</a></article>
</div>
<article className="price-card group-program">
  <div className="price-label">03 · Semi-Personal · Up to 6 people</div>
  <h3>Online Small-Group Training</h3>
  <p className="price-desc">Train together with personal attention. Live, Greek-speaking classes with a maximum of six participants, so I can observe your movements, offer corrections and guide each person.</p>
  <div className="group-grid">
    <div>
      <div className="price-subhead">Group packages · Per person</div>
      <table className="price-table"><tbody>
        <tr><td>10 Classes · Valid 3 months</td><td>CHF 300</td></tr>
        <tr><td>20 Classes · Valid 6 months</td><td>CHF 560</td></tr>
      </tbody></table>
      <a className="price-chip" href="./bookings.html?tab=group">Choose a Group Class</a>
    </div>
    <div>
      <div className="price-subhead">Weekly schedule · Language: Greek</div>
      <p>Monday <b>12:00 &amp; 18:00</b><br />Wednesday <b>12:00</b><br />Friday <b>12:00 &amp; 17:00</b></p>
      <small>Times shown in Switzerland local time.</small>
    </div>
  </div>
  <div className="price-rule"></div>
  <div className="price-subhead">Prefer your own group?</div>
  <p className="price-desc">Train with friends in a private small group, adapted to your goals and abilities. Sessions are arranged individually.</p>
  <a className="price-chip" href="https://www.instagram.com/anna_rafailidou/" rel="noopener noreferrer" target="_blank">Request a Private Group</a>
</article>
<p className="price-note" style={{"marginTop": "20px"}}>Indicative prices for review. Sessions and package terms are confirmed individually.</p>
<div className="group-booking" style={{"marginTop": "24px"}}><div className="eyebrow">BOOKING POLICY</div><h3>24-Hour Cancellation Policy</h3><p>All individual, duo and semi-personal sessions — online or in person — may be cancelled or rescheduled at least 24 hours in advance. Later cancellations and missed sessions are charged in full or deducted from your package.</p></div>
</div></section><section className="closing" id="contact" aria-labelledby="contact-heading">
  <div className="contact-copy">
    <div className="eyebrow">Get in touch</div>
    <h2 id="contact-heading">Have a question? Let’s talk.</h2>
    <p>Not sure which training is right for you? Get in touch with Anna to talk about your goals and find your next step.</p>
  </div>
  <div className="contact-actions">
    <a className="btn" href="https://wa.me/41798636382" target="_blank" rel="noopener noreferrer">WhatsApp</a>
    <a className="btn" href="mailto:a.rafailidou@yahoo.com">Email Anna</a>
    <a className="btn" href="https://www.instagram.com/anna_rafailidou/" target="_blank" rel="noopener noreferrer">Instagram</a>
  </div>
</section></main><footer><strong>ANNA RAFAILIDOU</strong><span>Zurich · Online training</span><span>© 2026 Anna Rafailidou · <a href="https://www.instagram.com/anna_rafailidou/" rel="noopener" target="_blank">Instagram</a></span></footer>
  </>;
}
