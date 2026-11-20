import { useState } from "react";
import { handleSectionNavigation } from "../sectionNavigation";

export default function Navbar({ homePage = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <header onClick={handleSectionNavigation}>
      <a className="brand" href={`${homePage}#top`} onClick={() => setIsOpen(false)}>
        ANNA RAFAILIDOU<small>PERSONAL TRAINING · CORRECTIVE EXERCISE</small>
      </a>
      <button className="menu" type="button" aria-label={isOpen ? "Close navigation" : "Open navigation"}
        aria-controls="main-navigation" aria-expanded={isOpen} onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? "×" : "☰"}
      </button>
      <nav id="main-navigation" className={isOpen ? "open" : ""} aria-label="Main navigation"
        onClick={() => setIsOpen(false)} onKeyDown={(event) => { if (event.key === "Escape") setIsOpen(false); }}>
        <a href={`${homePage}#top`}>Home</a><a href={`${homePage}#about`}>About</a><a href={`${homePage}#services`}>Services</a>
        <a href={`${homePage}#pricing`}>Pricing</a>
        <a href="https://www.instagram.com/anna_rafailidou/" rel="noopener noreferrer" target="_blank">Get in Touch</a>
      </nav>
    </header>
  );
}
