"use client";
import Emergencybutton from "@/components/Emergencybutton";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "next-themes";
import { Moon, Sun, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import EvidenceSection from "@/components/dashboard/EvidenceSection";
import ChatbotSection from "@/components/dashboard/ChatbotSection";
import StressMeter from "@/components/dashboard/StressMeter";
import EmergencySection from "@/components/dashboard/EmergencySection";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserRecord {
  uid: string;
  name?: string;
  profilePicUrl?: string;
  secretKey?: string;
  isProfileComplete?: boolean;
  summaryMap?: Record<string, string>;
  dominantEmotion?: string;
  avgStress?: number;
  riskTrend?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [userRecord, setUserRecord] = useState<UserRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("evidence");
  const { theme, setTheme } = useTheme();
  const [isUnlocked, setIsUnlocked] = useState(false);

  // ── Clear flag ONLY on tab close/refresh, NOT on navigation ──
  useEffect(() => {
    const handleUnload = () => {
      sessionStorage.removeItem("aegis_unlocked");
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/authpage");
        return;
      }

      try {
        const res = await fetch("/api/auth/me", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: user.uid }),
        });

        if (!res.ok) {
          const errText = await res.text();
          try {
            const errData = JSON.parse(errText);
            throw new Error(
              `Failed to fetch user: ${errData.error || errText}`
            );
          } catch {
            throw new Error(`Failed to fetch user: ${errText}`);
          }
        }

        const data = await res.json();

        if (!data.user.isProfileComplete) {
          router.push("/profile");
          return;
        }

        if (data.user.secretKey) {
          const stealthUnlocked = sessionStorage.getItem("aegis_unlocked");
          if (stealthUnlocked !== "true") {
            router.push("/notepad");
            return;
          }
          setIsUnlocked(true);
        } else {
          setIsUnlocked(true);
        }

        setUserRecord(data.user);
      } catch (error) {
        console.error(error);
        router.push("/authpage");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    sessionStorage.removeItem("aegis_unlocked");
    const auth = getAuth(app);
    await signOut(auth);
    router.push("/authpage");
  };

  // ── Loading State ──
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center font-medium">
        Loading Dashboard...
      </div>
    );
  }

  if (!userRecord || !isUnlocked) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 relative text-zinc-900 dark:text-zinc-100">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className={`transition-all duration-300 flex flex-col h-screen h-[100dvh] overflow-hidden`}
      >
        {/* Header */}
        <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div
              className="relative group cursor-pointer"
              onClick={() => router.push("/profile")}
            >
              <Avatar className="h-10 w-10 border-2 border-transparent transition-all group-hover:border-blue-500">
                <AvatarImage src={userRecord.profilePicUrl} />
                <AvatarFallback className="bg-zinc-100">
                  {userRecord.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-[10px]">Edit</span>
              </div>
            </div>
            <div className="hidden md:block">
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                AegisAI Dashboard
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Welcome back, {userRecord.name}
              </p>
            </div>
          </div>

          <div className="flex justify-center flex-1">
            {/* Desktop Tabs */}
            <TabsList className="hidden md:grid grid-cols-4 w-full max-w-md h-10 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full p-1 shadow-sm">
              <TabsTrigger
                value="evidence"
                className="rounded-full data-active:!bg-[#B21563] data-active:!text-white hover:text-[#B21563] transition-all text-sm font-medium"
              >
                Evidence
              </TabsTrigger>
              <TabsTrigger
                value="stress"
                className="rounded-full data-active:!bg-[#B21563] data-active:!text-white hover:text-[#B21563] transition-all text-sm font-medium"
              >
                Stress
              </TabsTrigger>
              <TabsTrigger
                value="chatbot"
                className="rounded-full data-active:!bg-[#B21563] data-active:!text-white hover:text-[#B21563] transition-all text-sm font-medium"
              >
                Chatbot
              </TabsTrigger>
              <TabsTrigger
                value="emergency"
                className="rounded-full data-active:!bg-[#B21563] data-active:!text-white hover:text-[#B21563] transition-all text-sm font-medium"
              >
                Emergency
              </TabsTrigger>
            </TabsList>

            {/* Mobile Dropdown */}
            <div className="md:hidden">
              <Select
                value={activeTab}
                onValueChange={(val) => val && setActiveTab(val)}
              >
                <SelectTrigger className="w-[140px] bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-full">
                  <SelectValue placeholder="Select Section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="evidence">Evidence</SelectItem>
                  <SelectItem value="stress">Stress</SelectItem>
                  <SelectItem value="chatbot">Chatbot</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-zinc-600 dark:text-zinc-400"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-950/30 dark:hover:border-red-900 px-3 md:px-4"
            >
              <LogOut className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Logout</span>
            </Button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className={`flex-1 w-full flex flex-col min-h-0 ${activeTab === "chatbot" ? "p-0 md:p-4" : "p-2 md:p-4"} mx-auto`}>
          <TabsContent
            value="evidence"
            className="mt-0 h-full overflow-y-auto focus-visible:outline-none focus-visible:ring-0"
          >
            <EvidenceSection uid={userRecord.uid} />
          </TabsContent>
          <TabsContent
            value="stress"
            className="mt-0 h-full overflow-y-auto focus-visible:outline-none focus-visible:ring-0"
          >
            <StressMeter uid={userRecord.uid} />
          </TabsContent>
          <TabsContent
            value="chatbot"
            className="mt-0 h-full flex flex-col focus-visible:outline-none focus-visible:ring-0"
          >
            <ChatbotSection userRecord={userRecord as any} uid={userRecord.uid} />
          </TabsContent>
          <TabsContent
            value="emergency"
            className="mt-0 h-full overflow-y-auto focus-visible:outline-none focus-visible:ring-0"
          >
            <EmergencySection />
          </TabsContent>
        </main>
      </Tabs>
      <Emergencybutton activeTab={activeTab} />
    </div>
  );
}