import { Link } from "react-router-dom";
import { ArrowRight, Activity, Dumbbell, HeartPulse, Quote, MapPin, Video, Calendar, AlertCircle } from "lucide-react";
import heroBg from "../assets/background-hero.jpg"; 
import heroPs from "../assets/person-hero.jpg";

export default function Home() {
  return (
    <div className="w-full flex flex-col bg-zinc-50">
      
      {/* --- HERO SECTION --- */}
      <section className="relative bg-zinc-900 text-white overflow-hidden min-h-[85vh] flex items-center">
        {/* Background Overlay: Reduced opacity to 50% so the photo is much more visible */}
        <div className="absolute inset-0 bg-zinc-950/50 z-10"></div>
        <img 
          // Image placeholder: Female trainer stretching/pilates vibe
          src={heroBg}
          alt="Anna Rafa PT - Forma" 
          // Increased opacity to 80% and removed blend mode to make it clearer
          className="absolute inset-0 w-full h-full object-cover z-0 opacity-80"
        />

        <div className="relative z-20 max-w-5xl mx-auto px-6 py-20 flex flex-col items-center text-center">
          <span className="text-purple-300 font-bold tracking-widest uppercase text-xs mb-6">
            Anna Rafa PT
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
            Forma <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-rose-300 font-light italic">
              The Art of Fitness
            </span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-200 max-w-2xl mb-10 font-light leading-relaxed">
            Every body is different. <br className="hidden md:block"/> Every session is designed for you.
          </p>
          <Link 
            to="/contact" 
            className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-3.5 rounded-full font-semibold text-base flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 shadow-lg shadow-purple-500/20"
          >
            Book Your Session <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* --- ABOUT SECTION --- */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative">
            {/* Lighter, softer offset box */}
            <div className="absolute inset-0 bg-purple-50 rounded-3xl translate-x-4 translate-y-4 -z-10"></div>
            <img 
              // Changed to a Pilates-focused photo next to the description
              src={heroPs}
              alt="Pilates Training with Anna" 
              className="rounded-3xl shadow-lg w-full object-cover aspect-[4/5]"
            />
          </div>
          <div className="space-y-5">
            <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Beyond traditional fitness.</h2>
            <p className="text-base text-zinc-600 leading-relaxed">
              I’m <strong className="text-zinc-900 font-semibold">Anna Rafailidou</strong>, a certified Personal Trainer based in Switzerland, with a background in Sport Science.
            </p>
            <p className="text-base text-zinc-600 leading-relaxed">
              I use a personalized training approach that combines fitness, Pilates, and corrective exercise, either integrated or applied separately, depending on your needs.
            </p>
            <p className="text-base text-zinc-600 leading-relaxed">
              I don’t follow generic programs — every session is designed based on your body, your movement, and your individual needs.
            </p>
            <div className="border-l-2 border-purple-400 pl-5 py-1 mt-6">
              <p className="text-lg font-medium text-zinc-800 italic leading-relaxed">
                "I help you build a body that is not only strong, but also balanced, functional, and pain-free."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- APPROACH & SERVICES --- */}
      <section className="py-20 px-6 bg-zinc-900 text-white">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">A Personalized Approach</h2>
            <p className="text-zinc-300 text-base leading-relaxed mb-4">
              Not every client comes to train for the same reason. Some want to get stronger. Some want to move without pain. Others want to correct years of poor movement habits.
            </p>
            <p className="text-purple-300 text-lg font-medium">That’s why every session is different.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { title: "Corrective Exercise", icon: HeartPulse, desc: "Fix muscular imbalances and learn proper movement patterns." },
              { title: "Strength Training", icon: Dumbbell, desc: "Build functional strength customized to your body's capabilities." },
              { title: "Pilates (Mat)", icon: Activity, desc: "Core control, alignment, and deep muscular endurance." },
              { title: "Mobility & Flexibility", icon: Activity, desc: "Move freely and safely while maintaining overall performance." },
              { title: "Weight Loss", icon: HeartPulse, desc: "Sustainable strategies to achieve a balanced, healthy body." },
            ].map((service, idx) => (
              <div key={idx} className="bg-zinc-800/50 border border-zinc-800 p-6 rounded-2xl hover:border-purple-400/50 transition-colors">
                <service.icon className="text-purple-400 w-8 h-8 mb-4" />
                <h3 className="text-lg font-semibold mb-2">{service.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">Each session adapts to how your body moves and responds.</p>
              </div>
            ))}
          </div>

          {/* Important Notice */}
          <div className="mt-10 bg-zinc-800/30 border border-zinc-700/50 p-5 rounded-xl flex gap-3 items-start max-w-2xl mx-auto">
            <AlertCircle className="text-purple-400 shrink-0 mt-0.5 w-5 h-5" />
            <p className="text-xs text-zinc-300 leading-relaxed">
              <strong className="text-white font-medium">Important:</strong> Corrective exercise is part of a training approach and may be combined with medical or physiotherapy treatment when needed.
            </p>
          </div>

        </div>
      </section>

      {/* --- REAL EXAMPLES (TESTIMONIALS/CASE STUDIES) --- */}
      <section className="py-20 px-6 bg-zinc-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 text-center mb-12">Real Results. Real Movement.</h2>
          <div className="grid md:grid-cols-3 gap-6">
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100 relative">
              <Quote className="text-purple-50 w-12 h-12 absolute top-4 right-4" />
              <div className="relative z-10 pt-6">
                <p className="text-zinc-600 text-base leading-relaxed mb-6 font-medium">
                  "Improved squat technique by correcting muscular imbalances and learning proper movement patterns."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 text-xs font-bold">C</div>
                  <span className="font-semibold text-sm text-zinc-900">Adult Client</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100 relative">
              <Quote className="text-purple-50 w-12 h-12 absolute top-4 right-4" />
              <div className="relative z-10 pt-6">
                <p className="text-zinc-600 text-base leading-relaxed mb-6 font-medium">
                  "Improved mobility and flexibility while maintaining strength and overall athletic performance."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 text-xs font-bold">A</div>
                  <span className="font-semibold text-sm text-zinc-900">Adult Client</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100 relative">
              <Quote className="text-purple-50 w-12 h-12 absolute top-4 right-4" />
              <div className="relative z-10 pt-6">
                <p className="text-zinc-600 text-base leading-relaxed mb-6 font-medium">
                  "Improved posture and body awareness through guided, age-appropriate corrective exercise."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 text-xs font-bold">Y</div>
                  <span className="font-semibold text-sm text-zinc-900">Youth Client</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- LOGISTICS & SCHEDULE --- */}
      <section className="py-20 px-6 bg-white border-t border-zinc-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">Training Options</h2>
            <p className="text-zinc-500 text-base">Flexible solutions to fit your lifestyle and location.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Online */}
            <div className="bg-zinc-50 rounded-2xl p-8 border border-zinc-100">
              <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center shadow-sm mb-5 text-purple-500">
                <Video size={24} />
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 mb-3">Online Training</h3>
              <p className="text-sm text-zinc-600 mb-6 leading-relaxed">
                Train from your own space with full guidance, professional form correction, and ultimate flexibility.
              </p>
              <div className="bg-white p-4 rounded-xl border border-zinc-100">
                <div className="flex items-center gap-2 text-zinc-900 text-sm font-semibold mb-1">
                  <Calendar className="text-purple-400 w-4 h-4" /> Schedule
                </div>
                <p className="text-sm text-zinc-600">Monday – Wednesday – Friday</p>
              </div>
            </div>

            {/* In Person */}
            <div className="bg-zinc-50 rounded-2xl p-8 border border-zinc-100">
              <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center shadow-sm mb-5 text-purple-500">
                <MapPin size={24} />
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 mb-3">In-Person Training</h3>
              <p className="text-sm text-zinc-600 mb-6 leading-relaxed">
                Available in the Zurich area, including Thalwil and surrounding locations. Sessions take place primarily in selected gym locations, or private sessions at your home upon request.
              </p>
              <div className="bg-white p-4 rounded-xl border border-zinc-100">
                <div className="flex items-center gap-2 text-zinc-900 text-sm font-semibold mb-1">
                  <Calendar className="text-purple-400 w-4 h-4" /> Schedule
                </div>
                <p className="text-sm text-zinc-600 mb-1">Tuesday – Thursday – Saturday</p>
                <p className="text-[10px] text-purple-500 font-semibold uppercase tracking-wider">*Saturday sessions are limited</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- CLOSING CTA --- */}
      <section className="py-20 px-6 bg-zinc-900 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-purple-900/5 z-0"></div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-5 tracking-tight leading-snug">
            Train with intention.<br/>
            Move better.<br/>
            Feel stronger.
          </h2>
          
          <div className="my-8">
            <p className="text-xl text-purple-300 font-medium italic mb-1">A healthy mind in a healthy body.</p>
            <p className="text-lg text-zinc-400 font-serif">Νους υγιής εν σώματι υγιεί.</p>
          </div>

          <Link 
            to="/contact" 
            className="inline-flex bg-purple-500 hover:bg-purple-600 text-white px-8 py-3.5 rounded-full font-semibold text-base items-center justify-center transition-all hover:-translate-y-0.5 shadow-lg shadow-purple-500/20"
          >
            Book Your Session
          </Link>
        </div>
      </section>

    </div>
  );
}