import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Navbar from "./components/Navbar";
import BookingCalendar from "./components/BookingCalendar";
import "./index.css";
import "./App.css";
import "./bookings.css";

const trainingType = new URLSearchParams(window.location.search).get("type") === "in-person" ? "in-person" : "online";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Navbar homePage="./index.html" />
    <main className="booking-page" style={{ minHeight: "calc(100vh - 80px)" }}>
      <div className="booking-inner">
        <a className="price-chip" href="./index.html#pricing">Back to training &amp; pricing</a>
        <div className="eyebrow" style={{ marginTop: 28 }}>Let’s train together</div>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(35px, 5vw, 58px)", fontWeight: 400, margin: "12px 0 24px" }}>Book your training.</h1>
        <BookingCalendar trainingType={trainingType} initialTab={new URLSearchParams(window.location.search).get("tab") === "group" ? "group" : "personal"} />
      </div>
    </main>
  </StrictMode>
);
