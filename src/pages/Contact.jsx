import { Mail, Phone, MapPin, Send } from "lucide-react";

export default function Contact() {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 py-16 px-6 flex items-center">
      <div className="max-w-6xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center">
        
        {/* Left Side: Info */}
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
            Let's get to work.
          </h1>
          <p className="text-lg text-slate-600 mb-10 leading-relaxed">
            Ready to transform your body and your life? Fill out the form below to book your free 15-minute discovery call. We'll discuss your goals, your struggles, and exactly how I can help you crush them.
          </p>

          <div className="space-y-6">
            <div className="flex items-center gap-4 text-slate-700">
              <div className="bg-emerald-100 p-3 rounded-full text-emerald-600"><Mail size={20} /></div>
              <span className="font-medium">coach@fitpro.com</span>
            </div>
            <div className="flex items-center gap-4 text-slate-700">
              <div className="bg-emerald-100 p-3 rounded-full text-emerald-600"><Phone size={20} /></div>
              <span className="font-medium">+41 79 123 45 67</span>
            </div>
            <div className="flex items-center gap-4 text-slate-700">
              <div className="bg-emerald-100 p-3 rounded-full text-emerald-600"><MapPin size={20} /></div>
              <span className="font-medium">Iron Gym, Zürich 8000</span>
            </div>
          </div>
        </div>

        {/* Right Side: The Form */}
        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-slate-100">
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">First Name</label>
                <input type="text" className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" placeholder="John" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Last Name</label>
                <input type="text" className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" placeholder="Doe" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">Email Address</label>
              <input type="email" className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" placeholder="john@example.com" />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">What is your primary goal?</label>
              <select className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all appearance-none">
                <option value="">Select a goal...</option>
                <option value="fat-loss">Fat Loss</option>
                <option value="muscle-gain">Muscle Gain</option>
                <option value="strength">Strength & Power</option>
                <option value="general">General Fitness & Health</option>
              </select>
            </div>

            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 shadow-lg">
              Request Consultation <Send size={18} />
            </button>
            <p className="text-xs text-slate-500 text-center mt-4">No commitment required. I'll reach out within 24 hours.</p>
          </form>
        </div>

      </div>
    </div>
  );
}