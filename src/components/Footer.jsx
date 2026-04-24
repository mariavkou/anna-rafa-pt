import { Dumbbell, Instagram, Facebook, Twitter } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 py-12 px-6 border-t border-slate-900 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Brand */}
        <div>
          <Link to="/" className="flex items-center gap-2 mb-4">
            <Dumbbell size={24} className="text-emerald-500" />
            <span className="text-2xl font-extrabold text-white tracking-tight">
              Fit<span className="text-emerald-500">Pro</span>
            </span>
          </Link>
          <p className="text-sm leading-relaxed max-w-xs">
            Elevating your fitness journey with science-backed training and personalized nutrition protocols.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-emerald-400 transition-colors">Home</Link></li>
            <li><Link to="/about" className="hover:text-emerald-400 transition-colors">About Me</Link></li>
            <li><Link to="/services" className="hover:text-emerald-400 transition-colors">Training Programs</Link></li>
            <li><Link to="/contact" className="hover:text-emerald-400 transition-colors">Book a Call</Link></li>
          </ul>
        </div>

        {/* Socials & Contact */}
        <div>
          <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Connect</h4>
          <div className="flex gap-4 mb-4">
            <a href="#" className="hover:text-emerald-400 transition-colors"><Instagram size={20} /></a>
            <a href="#" className="hover:text-emerald-400 transition-colors"><Facebook size={20} /></a>
            <a href="#" className="hover:text-emerald-400 transition-colors"><Twitter size={20} /></a>
          </div>
          <p className="text-sm">coach@fitpro.com</p>
          <p className="text-sm">Zürich, Switzerland</p>
        </div>

      </div>
      
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-800 text-sm text-center">
        © {new Date().getFullYear()} FitPro Training. All rights reserved.
      </div>
    </footer>
  );
}