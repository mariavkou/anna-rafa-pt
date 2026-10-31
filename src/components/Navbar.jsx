import { useState } from "react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <header>
      <a className="brand" href="#top" onClick={() => setIsOpen(false)}>
        ANNA RAFAILIDOU<small>PERSONAL TRAINING · CORRECTIVE EXERCISE</small>
      </a>
      <button className="menu" type="button" aria-label={isOpen ? "Close navigation" : "Open navigation"}
        aria-controls="main-navigation" aria-expanded={isOpen} onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? "×" : "☰"}
      </button>
      <nav id="main-navigation" className={isOpen ? "open" : ""} aria-label="Main navigation"
        onClick={() => setIsOpen(false)} onKeyDown={(event) => { if (event.key === "Escape") setIsOpen(false); }}>
        <a href="#top">Home</a><a href="#about">About</a><a href="#services">Services</a>
        <a href="#booking">Book a Session</a>
        <a className="btn" href="https://www.instagram.com/anna_rafailidou/" rel="noopener noreferrer" target="_blank">Get in Touch ↗</a>
      </nav>
    </header>
  );
}
