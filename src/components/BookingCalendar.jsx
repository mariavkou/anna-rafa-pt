import { useEffect, useRef } from "react";
import markup from "./booking-calendar.html?raw";
import { initializeBookingCalendar } from "./bookingCalendarDemo";
import "./BookingCalendar.css";

export default function BookingCalendar({ trainingType = "online" }) {
  const container = useRef(null);

  useEffect(() => {
    const root = container.current;
    // This trusted, bundled template keeps the supplied prototype self-contained.
    root.innerHTML = markup;
    const selectedType = root.querySelector(`input[name="type"][value="${trainingType === "in-person" ? "In-Person Personal Training" : "Online Personal Training"}"]`);
    if (selectedType) selectedType.checked = true;
    initializeBookingCalendar(root);
    return () => root.replaceChildren();
  }, [trainingType]);

  return <div className="booking-calendar" ref={container} />;
}
