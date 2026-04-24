import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Services", path: "/services" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-zinc-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* LOGO */}
        <Link to="/" className="flex items-center group">
          <span className="text-2xl font-bold text-zinc-900 tracking-tight">
            Anna<span className="text-purple-500 font-light italic">Rafa</span>
          </span>
        </Link>

        {/* DESKTOP LINKS */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              to={link.path}
              className={`text-sm font-semibold transition-colors ${
                location.pathname === link.path 
                  ? "text-purple-500" 
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              {link.name}
            </Link>
          ))}
          <Link 
            to="/contact" 
            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            Book Free Call
          </Link>
        </div>

        {/* MOBILE MENU BUTTON */}
        <button 
          className="md:hidden text-zinc-900 p-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

      </div>

      {/* MOBILE DROPDOWN */}
      {isOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-zinc-100 shadow-xl py-4 px-6 flex flex-col gap-4 animate-in slide-in-from-top-2">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              to={link.path}
              onClick={() => setIsOpen(false)}
              className="text-lg font-semibold text-zinc-700 py-2 border-b border-zinc-50 hover:text-purple-500 transition-colors"
            >
              {link.name}
            </Link>
          ))}
          <Link 
            to="/contact" 
            onClick={() => setIsOpen(false)}
            className="bg-purple-500 hover:bg-purple-600 text-white text-center px-6 py-3.5 rounded-xl text-lg font-semibold mt-2 transition-colors"
          >
            Book Free Call
          </Link>
        </div>
      )}
    </nav>
  );
}