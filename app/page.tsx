"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";

/* ─────────────────────────────────────────────
   Hook: intersection observer for scroll-reveal
───────────────────────────────────────────── */
function useReveal(threshold = 0.1, delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Check if already in viewport on mount
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setVisible(true);
      return;
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          obs.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -50px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold, delay]);
  return { ref, visible };
}

/* ─────────────────────────────────────────────
   Floating particle
───────────────────────────────────────────── */
function Particle({ style }: { style: React.CSSProperties }) {
  return (
    <span
      className="absolute rounded-full pointer-events-none"
      style={{
        width: 6,
        height: 6,
        background: "radial-gradient(circle, #6366f1 0%, transparent 80%)",
        opacity: 0.5,
        ...style,
      }}
    />
  );
}

/* ─────────────────────────────────────────────
   Stat card
───────────────────────────────────────────── */
function StatCard({ value, label, delay }: { value: string; label: string; delay: string }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: delay }}
      className={`flex flex-col items-center gap-2 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
    >
      <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#B21563] to-[#7a0e43]">
        {value}
      </span>
      <span className="text-sm text-zinc-600 text-center max-w-[120px]">{label}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Feature card
───────────────────────────────────────────── */
function FeatureCard({
  icon, title, desc, delay, accent,
}: {
  icon: React.ReactNode; title: string; desc: string; delay: string; accent: string;
}) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: delay }}
      className={`group relative rounded-2xl border border-zinc-300 bg-white backdrop-blur-sm p-6 flex flex-col gap-4 
        transition-all duration-700 hover:-translate-y-2 hover:shadow-2xl hover:border-[#B21563]/30
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
    >
      {/* Gradient glow on hover */}
      <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${accent} pointer-events-none`} />
      <div className="relative z-10 w-12 h-12 rounded-xl bg-[#B21563]/10 flex items-center justify-center text-2xl border border-[#B21563]/20">
        {icon}
      </div>
      <div className="relative z-10">
        <h3 className="font-bold text-zinc-900 text-lg mb-1">{title}</h3>
        <p className="text-zinc-600 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Why-choose row
───────────────────────────────────────────── */
function WhyRow({ icon, title, desc, delay }: { icon: string; title: string; desc: string; delay: string }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: delay }}
      className={`flex gap-4 items-start transition-all duration-700 ${visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`}
    >
      <div className="shrink-0 w-10 h-10 rounded-full bg-[#B21563]/10 border border-[#B21563]/20 flex items-center justify-center text-lg">
        {icon}
      </div>
      <div>
        <h4 className="text-zinc-900 font-semibold">{title}</h4>
        <p className="text-zinc-600 text-sm mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Image placeholder with 3D shadow
───────────────────────────────────────────── */
function ImagePlaceholder({ label, className = "" }: { label?: string; className?: string }) {
  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-zinc-800/60 border border-zinc-300
        shadow-[0_20px_60px_-10px_rgba(178,21,99,0.15),_0_10px_30px_-5px_rgba(0,0,0,0.5)]
        ${className}`}
      style={{ perspective: "800px" }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#B21563]/10 to-transparent pointer-events-none" />
      {/* subtle grid lines */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      {label && (
        <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-zinc-500 font-mono tracking-wider uppercase">
          {label}
        </span>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Sub-components for Reveal
───────────────────────────────────────────── */
function ProblemVisual() {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"}`}
    >
      <ImagePlaceholder label="Awareness Visual" className="w-full h-80" />
    </div>
  );
}

function ProblemText() {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 delay-150 ${visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"}`}
    >
      <span className="text-xs uppercase tracking-widest text-zinc-500 border border-zinc-300 rounded-full px-3 py-1">The Problem</span>
      <h2 className="mt-4 text-3xl md:text-4xl font-extrabold leading-tight">
        A Global Crisis of<br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
          Silence &amp; Isolation
        </span>
      </h2>
      <p className="mt-5 text-zinc-600 leading-relaxed text-base">
        Millions of people live under constant surveillance, unable to reach out for help due to monitored communication channels. Traditional support systems are too visible, too slow, too risky.
      </p>
      <p className="mt-3 text-zinc-600 leading-relaxed text-base">
        <span className="text-zinc-900 font-semibold">SeravaAI</span> steps in — providing a covert, AI-driven lifeline that works even under intense scrutiny, for both men and women.
      </p>
    </div>
  );
}

function WhyChooseSerava() {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
    >
      <span className="text-xs uppercase tracking-widest text-[#B21563] border border-[#B21563]/30 rounded-full px-3 py-1">Reasons</span>
      <h2 className="text-3xl md:text-4xl font-extrabold mt-4">Why Choose SeravaAI</h2>
      <div className="mt-8 flex flex-col gap-6">
        <WhyRow icon="🛡️" title="Discreet and Secure" desc="Built with steganography and privacy at its core — SeravaAI allows anyone to ask for help safely, without raising suspicion." delay="0ms" />
        <WhyRow icon="💬" title="24/7 AI Emotional Support" desc="Compassionate, always-available mental health conversations. No appointments, no judgment, no waiting." delay="100ms" />
        <WhyRow icon="⚖️" title="Legal Empowerment" desc="Instant, plain-language legal guidance on rights, custody, property, and protective orders." delay="200ms" />
        <WhyRow icon="📡" title="Smart Crisis Detection" desc="AI continuously reads emotional cues and escalates automatically — so help comes even when you can't ask." delay="300ms" />
      </div>
    </div>
  );
}

function SupportVisual() {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 delay-200 ${visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"}`}
    >
      <ImagePlaceholder label="Support Visual" className="w-full h-80" />
    </div>
  );
}

function MoodHeader() {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className={`text-center mb-14 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <p className="text-[#B21563] text-sm uppercase tracking-widest mb-3">mood dashboard</p>
      <h2 className="text-4xl md:text-5xl font-extrabold">
        Track. Understand.{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B21563] to-[#7a0e43]">Heal.</span>
      </h2>
      <p className="mt-4 text-zinc-600 max-w-xl mx-auto text-base">
        Log emotions daily. AI detects patterns, warns about downward spirals, and celebrates your wins.
      </p>
    </div>
  );
}

function MoodGraph() {
  const { ref, visible } = useReveal();
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const heights = [60, 35, 75, 50, 80, 45, 90];
  const emojis = ["😐", "😰", "😊", "😔", "😊", "😰", "😊"];
  const barColors = [
    "from-zinc-500 to-zinc-400",     // Neutral
    "from-violet-500 to-violet-400", // Anxious
    "from-[#B21563] to-[#911050]",   // Happy
    "from-blue-500 to-blue-400",     // Sad
    "from-[#B21563] to-[#911050]",   // Happy
    "from-violet-500 to-violet-400", // Anxious
    "from-[#B21563] to-[#911050]",   // Happy
  ];
  return (
    <div
      ref={ref}
      className={`rounded-2xl border border-zinc-300 bg-white backdrop-blur-sm p-8 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      style={{ boxShadow: "0 25px 60px -10px rgba(178,21,99,0.1), 0 10px 30px -5px rgba(0,0,0,0.5)" }}
    >
      <div className="flex items-end justify-between gap-3 h-48">
        {days.map((day, i) => (
          <div key={day} className="flex flex-col items-center justify-end gap-2 flex-1 h-full">
            <span className="text-lg">{emojis[i]}</span>
            <div
              className={`w-full max-w-[48px] rounded-t-lg bg-gradient-to-t ${barColors[i]} transition-all duration-1000`}
              style={{ height: visible ? `${heights[i]}%` : "0%", transitionDelay: `${i * 80}ms` }}
            />
            <span className="text-xs text-zinc-500">{day}</span>
          </div>
        ))}
      </div>
      <div className="mt-6 pt-5 border-t border-zinc-200 flex flex-wrap gap-4 text-sm text-zinc-600">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#B21563] inline-block" /> Happy</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-zinc-500 inline-block" /> Neutral</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-400 inline-block" /> Anxious</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Sad</span>
      </div>
    </div>
  );
}

function HeroSection({ mouse }: { mouse: { x: number; y: number } }) {
  const router = useRouter();
  const heroReveal = useReveal(0.01);
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6 pt-24 pb-16">
      {/* Background blobs */}
      <div className="absolute top-[-15%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#B21563]/10 mix-blend-screen filter blur-[80px] animate-blob" />
      <div className="absolute top-[10%] right-[-15%] w-[45vw] h-[45vw] rounded-full bg-[#911050]/10 mix-blend-screen filter blur-[80px] animate-blob delay-2" />
      <div className="absolute bottom-[-10%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-[#D81B60]/10 mix-blend-screen filter blur-[80px] animate-blob delay-4" />

      {/* Particles */}
      {[...Array(12)].map((_, i) => (
        <Particle
          key={i}
          style={{
            top: `${10 + (i * 7) % 80}%`,
            left: `${5 + (i * 11) % 90}%`,
            animationDelay: `${i * 0.4}s`,
            animationDuration: `${3 + (i % 3)}s`,
          }}
        />
      ))}

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(178,21,99,0.2) 1px,transparent 1px),linear-gradient(90deg,rgba(178,21,99,0.2) 1px,transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Pill badge */}
      <div
        ref={heroReveal.ref}
        className={`mb-8 inline-flex items-center gap-2 rounded-full border border-[#B21563]/30 bg-[#B21563]/10 px-4 py-1.5 text-xs font-medium text-[#B21563] backdrop-blur-sm
          transition-all duration-700 ${heroReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}
      >
        <span className="relative flex h-2 w-2">
          <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-[#B21563] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#B21563]" />
        </span>
        AI-Powered Safety & Emotional Support
      </div>

      {/* Headline */}
      <div
        style={{ transform: `translate(${mouse.x * 0.3}px, ${mouse.y * 0.2}px)` }}
        className={`relative z-10 max-w-5xl text-center transition-all duration-700 ${heroReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      >
        <h1 className="text-6xl md:text-8xl font-extrabold leading-[0.95] tracking-tight">
          Your Guardian{" "}
          <span className="relative inline-block">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B21563] via-[#D81B60] to-[#7a0e43]">
              in the Dark
            </span>
            <span className="absolute -bottom-1 left-0 right-0 h-[3px] rounded bg-gradient-to-r from-indigo-500 to-transparent" />
          </span>
        </h1>
        <p className="mt-6 text-lg md:text-xl text-zinc-600 max-w-2xl mx-auto leading-relaxed">
          SeravaAI combines an empathetic AI therapist, real-time emergency alerts, and smart safety monitoring — all in one discreet, always-on platform.
        </p>
      </div>

      {/* CTA buttons */}
      <div
        className={`mt-10 flex flex-col sm:flex-row gap-4 transition-all duration-700 delay-200 ${heroReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      >
        <Button
          size="lg"
          className="relative overflow-hidden bg-[#B21563] hover:bg-[#911050] text-[#f4f4f5] rounded-full px-10 text-base font-semibold shadow-lg shadow-[#B21563]/40 transition-all hover:scale-105 hover:shadow-[#B21563]/60"
          onClick={() => router.push("/authpage?mode=signup")}
        >
          <span className="relative z-10">Get Started — It's Free</span>
          <span className="absolute inset-0 bg-gradient-to-r from-[#B21563]/0 via-[#B21563]/20 to-[#B21563]/0 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700" />
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="rounded-full px-10 text-base border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-900 backdrop-blur-sm transition-all hover:scale-105"
          onClick={() => router.push("/authpage?mode=login")}
        >
          Login
        </Button>
      </div>

      {/* Hero visual — floating mockup */}
      <div
        className={`mt-20 relative w-full max-w-3xl mx-auto transition-all duration-1000 delay-300 ${heroReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
      >
        <div className="animate-float">
          <ImagePlaceholder label="Dashboard Preview" className="w-full h-72 md:h-96" />
        </div>
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-[#B21563]/20 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-zinc-600 text-xs">
        <span>scroll</span>
        <svg width="16" height="24" viewBox="0 0 16 24" fill="none" className="animate-bounce">
          <rect x="1" y="1" width="14" height="22" rx="7" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="8" cy="7" r="2" fill="currentColor"/>
        </svg>
      </div>
    </section>
  );
}

function StatsSection() {
  const statsReveal = useReveal(0.2);
  return (
    <section
      ref={statsReveal.ref}
      className={`py-20 px-6 border-y border-zinc-200 bg-zinc-50 transition-all duration-700 ${statsReveal.visible ? "opacity-100" : "opacity-0"}`}
    >
      <p className="text-center text-zinc-500 text-sm uppercase tracking-widest mb-12">why it matters</p>
      <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-10 text-center divide-y sm:divide-y-0 sm:divide-x divide-white/5">
        <StatCard value="1 in 3" label="people face domestic violence globally" delay="0ms" />
        <StatCard value="80%" label="abuse survivors suffer mental health issues" delay="100ms" />
        <StatCard value="62%" label="are unaware of their legal rights" delay="200ms" />
      </div>
    </section>
  );
}

function CTASection() {
  const router = useRouter();
  const ctaReveal = useReveal(0.2);
  return (
    <section className="relative py-36 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/20 to-transparent pointer-events-none" />
      <div
        ref={ctaReveal.ref}
        className={`relative z-10 max-w-3xl mx-auto text-center transition-all duration-700 ${ctaReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <p className="text-[#B21563] text-sm uppercase tracking-widest mb-4">join the mission</p>
        <h2 className="text-4xl md:text-6xl font-extrabold leading-tight">
          Break the Silence.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B21563] via-[#D81B60] to-[#7a0e43]">
            Reclaim Your Safety.
          </span>
        </h2>
        <p className="mt-6 text-zinc-600 text-lg leading-relaxed max-w-xl mx-auto">
          Whether you are a survivor, an ally, or an advocate — SeravaAI is here. Together, we can make a difference.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="bg-[#B21563] hover:bg-[#911050] text-[#f4f4f5] rounded-full px-12 text-base font-semibold shadow-lg shadow-[#B21563]/40 transition-all hover:scale-105"
            onClick={() => router.push("/authpage?mode=signup")}
          >
            Get Started Free
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="rounded-full px-12 text-base border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-900 backdrop-blur-sm transition-all hover:scale-105"
            onClick={() => router.push("/authpage?mode=login")}
          >
            Learn More
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   PAGE
═══════════════════════════════════════════ */
export default function Home() {
  const router = useRouter();

  /* mouse parallax for hero */
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      setMouse({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  const [checkingAuth, setCheckingAuth] = useState(true);

  // ── Auto-login check ──
  useEffect(() => {
    const auth = getAuth(app);
    
    // Fallback timeout: if auth takes too long, just show the landing page
    const timer = setTimeout(() => {
      setCheckingAuth(false);
    }, 2500);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user ? "User logged in" : "No user");
      if (user) {
        try {
          const res = await fetch("/api/auth/me", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uid: user.uid }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.user && data.user.isProfileComplete) {
              if (data.user.secretKey) {
                router.push("/notepad");
                return;
              } else {
                router.push("/dashboard");
                return;
              }
            }
          }
        } catch (error) {
          console.error("Auto-redirect failed:", error);
        }
      }
      clearTimeout(timer);
      setCheckingAuth(false);
    });
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [router]);

  return (
    <main className={`min-h-screen bg-white text-zinc-900 font-sans overflow-x-hidden transition-opacity duration-700 ${checkingAuth ? "opacity-0 pointer-events-none" : "opacity-100"}`}>

      {/* ── Global styles injected ── */}
      <style>{`
        

        @keyframes blob {
          0%,100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(30px,-20px) scale(1.07); }
          66% { transform: translate(-20px,20px) scale(0.95); }
        }
        .animate-blob { animation: blob 9s ease-in-out infinite; }
        .delay-2 { animation-delay: 2s; }
        .delay-4 { animation-delay: 4s; }

        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        .pulse-ring { animation: pulse-ring 2s cubic-bezier(0.4,0,0.6,1) infinite; }

        @keyframes float {
          0%,100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }

        @keyframes scan-line {
          0% { top: 0%; }
          100% { top: 100%; }
        }
        .scan-line { animation: scan-line 3s linear infinite; }

        /* subtle noise overlay */
        .noise::after {
          content: '';
          position: fixed; inset: 0; pointer-events: none; z-index: 9999;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          opacity: 0.03;
        }
      `}</style>
      <div className="noise" />

      <HeroSection mouse={mouse} />

      {/* ═══════════════════ STATS ═══════════════════ */}
      <StatsSection />

      {/* ═══════════════════ FEATURES ═══════════════════ */}
      <section className="py-28 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[#B21563] text-sm uppercase tracking-widest mb-3">what seravaai does</p>
          <h2 className="text-4xl md:text-5xl font-extrabold">
            Everything you need,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B21563] to-[#7a0e43]">
              in one shield
            </span>
          </h2>
          <p className="mt-4 text-zinc-600 max-w-xl mx-auto text-base leading-relaxed">
            Designed for anyone who needs support — survivors, advocates, or anyone navigating mental health challenges.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon="🤖"
            title="AI Chatbot Therapist"
            desc="Empathetic, 24/7 conversational support. Detects stress, anxiety, fear, and danger in real-time and responds with compassion or escalates when needed."
            delay="0ms"
            accent="bg-gradient-to-br from-[#B21563]/5 to-transparent"
          />
          <FeatureCard
            icon="📊"
            title="Mood Tracking Dashboard"
            desc="Log daily emotions via chat. AI classifies moods, surfaces trends, and alerts you when patterns suggest a crisis is forming."
            delay="80ms"
            accent="bg-gradient-to-br from-violet-500/5 to-transparent"
          />
          <FeatureCard
            icon="🚨"
            title="Emergency Alert System"
            desc="Add trusted contacts. When danger is detected, SeravaAI instantly notifies them with a discreet, private message — no action needed from you."
            delay="160ms"
            accent="bg-gradient-to-br from-red-500/5 to-transparent"
          />
          <FeatureCard
            icon="📍"
            title="Real-Time Location Safety"
            desc="Share live location with trusted contacts during emergencies. AI suggests nearby safe zones, police stations, and hospitals instantly."
            delay="240ms"
            accent="bg-gradient-to-br from-blue-500/5 to-transparent"
          />
          <FeatureCard
            icon="🧭"
            title="AI Guidance System"
            desc="Not just words — actionable next steps. From breathing exercises to safe-exit plans, SeravaAI walks you through what to do next."
            delay="320ms"
            accent="bg-gradient-to-br from-emerald-500/5 to-transparent"
          />
          <FeatureCard
            icon="🔒"
            title="Covert & Private by Design"
            desc="Built with steganography and end-to-end encryption. Appears as a normal app under surveillance. Your data never leaves your control."
            delay="400ms"
            accent="bg-gradient-to-br from-amber-500/5 to-transparent"
          />
        </div>
      </section>

      {/* ═══════════════════ SPLIT — PROBLEM ═══════════════════ */}
      <section className="py-28 px-6 bg-zinc-50 border-y border-zinc-200">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left: image */}
          <ProblemVisual />

          {/* Right: text */}
          <ProblemText />
        </div>
      </section>

      {/* ═══════════════════ SPLIT — WHY SERAVAAI ═══════════════════ */}
      <section className="py-28 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left: reasons */}
          <WhyChooseSerava />

          {/* Right: image */}
          <SupportVisual />
        </div>
      </section>

      {/* ═══════════════════ MOOD TRACKER PREVIEW ═══════════════════ */}
      <section className="py-28 px-6 bg-zinc-50 border-y border-zinc-200">
        <div className="max-w-5xl mx-auto">
          <MoodHeader />

          {/* Mock bar chart */}
          <MoodGraph />
        </div>
      </section>

      <CTASection />

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="border-t border-zinc-200 py-10 px-6 text-center">
        <p className="text-zinc-600 text-sm">
          © {new Date().getFullYear()} SeravaAI — Your safety, always.
        </p>
      </footer>

    </main>
  );
}