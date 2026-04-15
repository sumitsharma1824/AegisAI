"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-blue-100/50 mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-pink-100/50 mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-purple-100/50 mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 max-w-4xl w-full px-6 flex flex-col items-center text-center space-y-8">


        {/* Hero Text */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-zinc-900 drop-shadow-sm">
            Empowering Safety with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">AegisAI</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-600 max-w-2xl mx-auto leading-relaxed">
            A comprehensive platform designed to provide immediate assistance, evidence recording, and intelligent support for women&apos;s safety.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full sm:w-auto">
          <Button 
            size="lg" 
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-8 text-lg shadow-md shadow-indigo-600/20 transition-all hover:scale-105"
            onClick={() => router.push("/authpage?mode=signup")}
          >
            Get Started
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="rounded-full px-8 text-lg border-zinc-200 bg-white/80 hover:bg-zinc-100 shadow-sm backdrop-blur-sm transition-all hover:scale-105"
            onClick={() => router.push("/authpage?mode=login")}
          >
            Login
          </Button>
        </div>

        {/* Features preview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-16 w-full max-w-3xl">
          {[
            { title: "24/7 Chatbot", desc: "Intelligent support anytime you need it." },
            { title: "Secure Evidence", desc: "Safely store and manage incident data." },
            { title: "Encrypted Keys", desc: "Privacy assured with your own secret key." }
          ].map((feature, i) => (
            <div key={i} className="flex flex-col items-center bg-white/60 backdrop-blur-md p-6 rounded-2xl border border-white outline outline-1 outline-zinc-200/50 shadow-sm">
              <h3 className="font-semibold text-zinc-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-zinc-500 text-center">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
