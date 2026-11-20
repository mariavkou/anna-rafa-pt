import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AdminCalendar from './components/AdminCalendar';
import './index.css';
import './App.css';
import './bookings.css';

createRoot(document.getElementById('root')).render(
  <StrictMode><main className="booking-page admin-page"><div className="booking-inner"><AdminCalendar/></div></main></StrictMode>,
);
