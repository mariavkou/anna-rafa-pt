import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";

export default function App() {
  return (
    <Router>
      {/* We use a flex-col layout to ensure the footer always pushes to the bottom */}
      <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
        <Navbar />
        
        <main className="flex-grow w-full">
          <Routes>
            <Route path="/" element={<Home />} />
            {/* We will build these next! */}
            {/* <Route path="/about" element={<About />} /> */}
            {/* <Route path="/services" element={<Services />} /> */}
            {/* <Route path="/contact" element={<Contact />} /> */}
          </Routes>
        </main>

        {/* <Footer /> */}
      </div>
    </Router>
  );
}