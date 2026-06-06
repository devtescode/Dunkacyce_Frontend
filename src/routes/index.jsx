import {
  ArrowRight, Clock, MapPin, ShieldCheck, Flame, Star,
  ChevronRight, Utensils, Zap, Users, CheckCircle, Menu, X
} from "lucide-react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dunnkayce — Hot Campus Meals, Delivered to Your Hostel" },
      {
        name: "description",
        content:
          "Order limited-slot meals delivered straight to your hostel room at Elizade University. Pay with Paystack or Moniepoint.",
      },
    ],
  }),
  component: Landing,
});

const SAMPLE_MEALS = [
  { name: "Jollof Rice + Chicken", price: "₦1,200", tag: "🔥 Most ordered", img: "🍛" },
  { name: "Fried Rice + Fish", price: "₦1,300", tag: "⭐ Fan favourite", img: "🍚" },
  { name: "Amala + Ewedu", price: "₦900", tag: "💚 Local special", img: "🫕" },
  { name: "Spaghetti + Egg", price: "₦800", tag: "⚡ Quick fill", img: "🍝" },
];

const TESTIMONIALS = [
  { name: "Tobi A.", hostel: "MH2", text: "Saved me during exam week. Hot food in 10 mins 🔥" },
  { name: "Chisom E.", hostel: "FH1", text: "No more walking to the cafeteria. This is the one." },
  { name: "Damilola O.", hostel: "FH3", text: "Jollof rice was 🔥 and it arrived still warm!" },
];

const FOOD_COMBOS = [
  {
    name: "Amala & Ewedu",
    price: "₦1,500 - ₦3,000",
    img: "https://imgs.search.brave.com/oUPwaIZwIRwIg5E6deEtL7ZNwvZZwWbX4cDSgH9HJg0/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9yb29r/emtpdGNoZW4uY29t/L3dwLWNvbnRlbnQv/dXBsb2Fkcy8yMDIz/LzAzL0V3ZWR1LUdi/ZWdpcmktQm93bC04/MDAuanBn",
  },
  {
    name: "Jollof Rice & Chicken",
    price: "₦2,000 - ₦3,500",
    img: "https://imgs.search.brave.com/A2JhFdWk82nHRCSoL1PlGSifxgNVvxjN-OvT-cdXnTE/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90aHVt/YnMuZHJlYW1zdGlt/ZS5jb20vYi92aWJy/YW50LW92ZXJoZWFk/LXNob3Qtc2hvd2Nh/c2VzLWRlbGljaW91/cy1wbGF0ZS1qb2xs/b2YtcmljZS1wb3B1/bGFyLXdlc3QtYWZy/aWNhbi1kaXNoLXBh/aXJlZC1ncmlsbGVk/LWNoaWNrZW4tbGVn/LXF1YXJ0ZXItNDE2/MTg0NTQ1LmpwZw",
  },
  // {
  //   name: "Beans & Plantain",
  //   price: "₦800 - ₦1,100",
  //   img: "https://images.unsplash.com/photo-1601050690597-df0568f70950",
  // },
];

function Landing() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [foodIndex, setFoodIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFoodIndex((prev) => (prev + 1) % FOOD_COMBOS.length);
    }, 20000); // 20 seconds

    return () => clearInterval(interval);
  }, []);

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("*")
        .eq("id", 1)
        .single();
      return data;
    },
  });

  const dailyLimit = settings?.global_daily_limit ?? 50;
  const navigate = useNavigate();

  const goSignup = () => navigate({ to: "/signup", replace: true });
  const goLogin = () => navigate({ to: "/login", replace: true });
  const goMenu = () => navigate({ to: "/menu", replace: true });

  return (
    <div className="min-h-screen bg-amber-50 text-stone-900 font-sans">
      {/* ══════════ NAV ══════════ */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-stone-200/60 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <span className="font-black text-xl tracking-tight text-stone-900 shrink-0">
            Dunn<span className="text-orange-500">kayce</span>
          </span>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-500">
            {/* <button onClick={goMenu}       className="hover:text-stone-900 transition-colors">Menu</button> */}
            <a href="#how-it-works" className="hover:text-stone-900 transition-colors">How it works</a>
            <a href="#reviews" className="hover:text-stone-900 transition-colors">Reviews</a>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <button
              onClick={goLogin}
              className="text-sm text-stone-500 hover:text-stone-900 transition-colors px-4 py-2 rounded-lg hover:bg-stone-100"
            >
              Log in
            </button>
            <button
              onClick={goSignup}
              className="text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.97] shadow-sm shadow-orange-200"
            >
              Sign up free
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-stone-100 transition-colors text-stone-600"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-stone-100 px-6 py-4 flex flex-col gap-3">
            <button onClick={() => { goMenu(); setMobileOpen(false); }}
              className="text-sm font-medium text-stone-600 text-left py-2 hover:text-stone-900">Menu</button>
            <a href="#how-it-works" onClick={() => setMobileOpen(false)}
              className="text-sm font-medium text-stone-600 py-2 hover:text-stone-900">How it works</a>
            <a href="#reviews" onClick={() => setMobileOpen(false)}
              className="text-sm font-medium text-stone-600 py-2 hover:text-stone-900">Reviews</a>
            <div className="flex gap-2 pt-2 border-t border-stone-100">
              <button onClick={goLogin}
                className="flex-1 text-sm font-semibold border border-stone-200 text-stone-700 py-2.5 rounded-xl hover:bg-stone-50 transition-colors">
                Log in
              </button>
              <button onClick={goSignup}
                className="flex-1 text-sm font-bold bg-orange-500 text-white py-2.5 rounded-xl hover:bg-orange-600 transition-colors">
                Sign up
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ══════════ HERO ══════════ */}
      <section className="relative pt-27 pb-24 px-6 overflow-hidden bg-amber-50">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[420px] bg-orange-300/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-0 w-[300px] h-[300px] bg-yellow-300/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-0">

          <div className="flex flex-col lg:flex-row items-center lg:items-center gap-10 lg:gap-12">

            {/* LEFT TEXT SECTION */}
            <div className="flex-1 text-center lg:text-left">

              <div className="inline-flex items-center gap-2 bg-orange-100 border border-orange-200 text-orange-600 text-[10px] sm:text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-5 sm:mb-6">
                <Flame className="w-3 h-3" />
                Elizade University
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl tracking-tighter leading-[0.95] mb-5 sm:mb-6 text-stone-900">
                FUEL YOUR
                <span className="text-orange-500 ml-3">STUDY</span>
                <br />
                SESSION
              </h1>

              <p className="text-stone-500 text-base sm:text-lg leading-relaxed max-w-md mx-auto lg:mx-0 mb-4 sm:mb-5">
                Fresh campus meals delivered straight to your hostel door.
              </p>

              {/* BUTTONS */}
              <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
                <button
                  onClick={goMenu}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3.5 rounded-xl transition-all text-sm shadow-md shadow-orange-200"
                >
                  ORDER NOW <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={goSignup}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border-2 border-stone-300 hover:border-stone-400 text-stone-700 hover:text-stone-900 font-semibold px-6 py-3.5 rounded-xl transition-all text-sm bg-white hover:bg-stone-50"
                >
                  Create Account
                </button>
              </div>

              {/* STATS */}
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mt-5 justify-center lg:justify-start">

                <div className="flex -space-x-2">
                  {["T", "C", "D", "M"].map((l, i) => (
                    <div
                      key={i}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange-100 border-2 border-amber-50 flex items-center justify-center text-[10px] sm:text-[11px] font-bold text-orange-600"
                    >
                      {l}
                    </div>
                  ))}
                </div>

                <span className="text-stone-500 text-sm text-center lg:text-left">
                  <span className="text-stone-900 font-bold">200+</span> students fed this week
                </span>
              </div>

            </div>

            {/* RIGHT FOOD CARD */}
            <div className="w-full lg:w-auto flex justify-center lg:justify-end">

              <div className="w-full sm:w-[320px] sm:h-[320px] lg:w-[460px] lg:h-[460px]  bg-white border border-stone-200 rounded-2xl p-4 shadow-sm overflow-hidden transition-all duration-500">

                <img
                  src={FOOD_COMBOS[foodIndex].img}
                  alt={FOOD_COMBOS[foodIndex].name}
                  className="w-full h-54 sm:h-88 object-cover rounded-xl transition-all duration-500"
                />

                <div className="mt-4 text-center">
                  <div className="text-xs text-gray-500 uppercase tracking-widest">
                    Today’s Special
                  </div>

                  <div className="font-bold text-gray-900 mt-1 text-sm sm:text-base">
                    {FOOD_COMBOS[foodIndex].name}
                  </div>

                  <div className="text-orange-500 font-semibold text-sm mt-1">
                    {FOOD_COMBOS[foodIndex].price}
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ══════════ MARQUEE ══════════ */}
      <div className="border-y border-orange-100 bg-orange-500 py-3 overflow-hidden">
        <div className="flex animate-[marquee_22s_linear_infinite] whitespace-nowrap">
          {[...Array(4)].map((_, r) =>
            ["🍛 Jollof Rice", "🍚 Fried Rice", "🫕 Amala & Ewedu", "🍝 Spaghetti", "🥘 Beans & Plantain", "🍗 Chicken"].map((m, i) => (
              <span key={`${r}-${i}`} className="text-sm text-white/80 font-semibold px-8">
                {m} <span className="text-white/30 mx-2">·</span>
              </span>
            ))
          )}
        </div>
      </div>

      {/* ══════════ FEATURES ══════════ */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { icon: <Clock className="w-5 h-5" />, title: "Daily Fresh", desc: "Cooked from scratch every morning. No leftovers, no shortcuts.", iconBg: "bg-orange-100 text-orange-600" },
            { icon: <MapPin className="w-5 h-5" />, title: "Hostel-to-Door", desc: "We deliver to MH1, MH2, FH1, FH2 and FH3. Just give us your room.", iconBg: "bg-sky-100 text-sky-600" },
            { icon: <ShieldCheck className="w-5 h-5" />, title: "Pay Your Way", desc: "Paystack for instant. Moniepoint transfer with admin verification.", iconBg: "bg-emerald-100 text-emerald-600" },
          ].map((f, i) => (
            <div key={i} className="bg-white border border-stone-200 rounded-2xl p-6 hover:shadow-md hover:border-stone-300 transition-all">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${f.iconBg} mb-4`}>
                {f.icon}
              </div>
              <h3 className="font-bold text-base mb-2 text-stone-900">{f.title}</h3>
              <p className="text-stone-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ MENU PREVIEW ══════════ */}
      <section className="bg-stone-100 border-y border-stone-200 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-orange-500 text-xs font-bold uppercase tracking-widest mb-2">Today's Menu</p>
              <h2 className="text-3xl font-black tracking-tight text-stone-900">WHAT'S COOKING</h2>
            </div>
            <button onClick={goMenu} className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-orange-500 font-semibold transition-colors">
              View full menu <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {SAMPLE_MEALS.map((meal, i) => (
              <div
                key={i}
                onClick={goMenu}
                className="bg-white border border-stone-200 rounded-2xl p-5 hover:border-orange-300 hover:shadow-md transition-all group cursor-pointer"
              >
                <div className="text-4xl mb-4">{meal.img}</div>
                <div className="text-[11px] text-stone-400 mb-2 font-medium">{meal.tag}</div>
                <div className="font-bold text-sm mb-1 leading-tight text-stone-800">{meal.name}</div>
                <div className="text-orange-500 font-black text-base">{meal.price}</div>
                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs font-bold text-orange-500 inline-flex items-center gap-1">
                    Order <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-orange-500 text-xs font-bold uppercase tracking-widest mb-3">How it works</p>
          <h2 className="text-3xl font-black tracking-tight text-stone-900">FOUR STEPS, ONE HOT MEAL.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: <Users className="w-5 h-5" />, text: "Sign up with your name, phone & gender" },
            { icon: <Utensils className="w-5 h-5" />, text: "Pick your meals before slots run out" },
            { icon: <Zap className="w-5 h-5" />, text: "Choose hostel + room, pay with Paystack or Moniepoint" },
            { icon: <MapPin className="w-5 h-5" />, text: "We deliver to your door — track status live" },
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-4 bg-white border border-stone-200 rounded-2xl p-6 hover:border-orange-200 hover:shadow-sm transition-all">
              <div className="flex-shrink-0 flex flex-col items-center gap-2">
                <span className="text-orange-300 font-black text-2xl leading-none">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="text-orange-400">{s.icon}</div>
              </div>
              <p className="text-stone-600 text-sm leading-relaxed pt-1">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ TESTIMONIALS ══════════ */}
      <section id="reviews" className="bg-stone-100 border-y border-stone-200 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-orange-500 text-xs font-bold uppercase tracking-widest mb-3">Reviews</p>
            <h2 className="text-3xl font-black tracking-tight text-stone-900">STUDENTS LOVE IT</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-white border border-stone-200 rounded-2xl p-6 hover:shadow-sm transition-all">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, s) => (
                    <Star key={s} className="w-3.5 h-3.5 fill-orange-400 text-orange-400" />
                  ))}
                </div>
                <p className="text-stone-600 text-sm leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-xs font-black text-orange-600">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-800">{t.name}</div>
                    <div className="text-[11px] text-stone-400">{t.hostel}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ CTA BANNER ══════════ */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="relative bg-orange-500 rounded-3xl px-8 py-16 text-center overflow-hidden shadow-xl shadow-orange-200">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.18),_transparent)]" />
          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">
              HUNGRY RIGHT NOW?
            </h2>
            <p className="text-orange-100 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
              Don't waste time walking to the cafeteria. Order in seconds and we'll be at your door.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={goSignup}
                className="inline-flex items-center gap-2 bg-white text-orange-600 font-black px-7 py-3.5 rounded-xl text-sm hover:bg-orange-50 transition-colors shadow-sm"
              >
                Get Started Free <ArrowRight className="w-4 h-4" />
              </button>
              {/* <button
                onClick={goMenu}
                className="inline-flex items-center gap-2 border-2 border-white/40 text-white font-bold px-7 py-3.5 rounded-xl text-sm hover:border-white/70 hover:bg-white/10 transition-all"
              >
                Browse Menu
              </button> */}
            </div>
            <div className="flex items-center justify-center gap-6 mt-8 flex-wrap">
              {["No hidden fees", "Live order tracking", "10-min delivery"].map((p, i) => (
                <div key={i} className="flex items-center gap-1.5 text-orange-100 text-xs font-medium">
                  <CheckCircle className="w-3.5 h-3.5" /> {p}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}