"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Plus, Search, PanelLeft, ArrowUp, Zap, Heart,
  CheckCircle, Clock, Users, Shield, MessageSquare, Bot, X, Menu, Mic, MicOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Message {
  sender: "user" | "bot";
  message: string;
  timestamp: Date;
  isError?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  isLoaded: boolean;
}

interface UserRecord {
  name?: string;
  age?: string;
  gender?: string;
  maritalStatus?: string;
  profilePicUrl?: string;
  summaryMap?: Record<string, string>;
  dominantEmotion?: string;
  avgStress?: number;
  riskTrend?: string;
}

interface ChatbotSectionProps {
  userRecord: UserRecord;
  uid: string;
}

// --- Mood Constants ---
const MOOD_EMOJIS = [
  { emoji: "😄", label: "Great",     weight: 0 },
  { emoji: "🙂", label: "Good",      weight: 1 },
  { emoji: "😐", label: "Okay",      weight: 2 },
  { emoji: "😕", label: "Not great", weight: 3 },
  { emoji: "😢", label: "Sad",       weight: 4 },
  { emoji: "😭", label: "Terrible",  weight: 5 },
];

// --- AI Emotion → Emoji Mapper ---
const EMOTION_TO_EMOJI: Record<string, string> = {
  joy: "😄", happiness: "😄", excited: "😄", grateful: "😄", love: "😄",
  calm: "🙂", content: "🙂", hopeful: "🙂", relief: "🙂", positive: "🙂",
  neutral: "😐", bored: "😐", confused: "😐", uncertain: "😐",
  anxiety: "😕", worry: "😕", frustrated: "😕", stressed: "😕", nervous: "😕",
  sadness: "😢", lonely: "😢", disappointed: "😢", hurt: "😢", guilt: "😢",
  fear: "😭", anger: "😭", despair: "😭", helpless: "😭", terror: "😭", panic: "😭",
};

// --- Sub-components ---
interface MessageInputProps {
  inputValue: string;
  setInputValue: (val: string) => void;
  onSend: () => void;
  isListening: boolean;
  toggleVoiceTyping: () => void;
}

function MessageInput({ inputValue, setInputValue, onSend, isListening, toggleVoiceTyping }: MessageInputProps) {
  const triggerEmergency = () => {
    window.dispatchEvent(new CustomEvent("aegis-trigger-emergency"));
  };

  return (
    <>
      {/* Desktop View: Pill Style */}
      <div className="hidden md:flex max-w-4xl mx-auto relative items-center w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 rounded-xl px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-[#B21563]/50 transition-all">
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => e.key === "Enter" && onSend()}
          placeholder="Type your message here..."
          className="flex-1 bg-transparent border-none outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500"
        />
        <div className="flex items-center gap-2 ml-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleVoiceTyping}
            className={`h-8 w-8 rounded-md transition-all ${isListening ? "text-red-500 bg-red-50 dark:bg-red-900/20 animate-pulse" : "text-black dark:text-zinc-100 bg-transparent hover:text-[#B21563] dark:hover:text-[#B21563] hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
            title={isListening ? "Stop Voice Typing" : "Voice Typing"}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
          <Button
            size="icon"
            className={`h-8 w-8 rounded-md transition-colors ${
              inputValue.trim()
                ? "bg-[#B21563] text-white hover:bg-[#911050]"
                : "bg-black text-white dark:bg-white dark:text-black pointer-events-none opacity-50"
            }`}
            onClick={onSend}
          >
            <ArrowUp className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Mobile View: High Box Style */}
      <div className="md:hidden flex flex-col w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-5 shadow-sm mb-4">
        <textarea
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder="Type your message here..."
          className="w-full bg-transparent border-none outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 resize-none h-[70px] pt-1 text-base"
        />
        <div className="flex justify-between items-center mt-3 pt-2">
          <button 
            onClick={triggerEmergency}
            className="text-[#B21563] font-medium text-lg hover:opacity-80 active:scale-95 transition-all"
          >
            Need Help?
          </button>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleVoiceTyping}
              className={`p-2 transition-all ${isListening ? "text-red-500 animate-pulse" : "text-zinc-600 dark:text-zinc-100"}`}
            >
              {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
            <button
              onClick={onSend}
              disabled={!inputValue.trim()}
              className={`p-2.5 rounded-xl transition-all ${
                inputValue.trim() 
                  ? "bg-[#B21563] text-white shadow-md active:scale-90" 
                  : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600"
              }`}
            >
              <ArrowUp className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function mapEmotionToEmoji(emotion: string): string {
  const key = emotion.toLowerCase().trim();
  return EMOTION_TO_EMOJI[key] || "😐";
}

export default function ChatbotSection({ userRecord, uid }: ChatbotSectionProps) {
  const [sidebarOpen, setSidebarOpen]     = useState(true);
  const [chatSessions, setChatSessions]   = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId]   = useState<string>("");
  const [searchQuery, setSearchQuery]     = useState("");
  const [inputValue, setInputValue]       = useState("");
  const [isTyping, setIsTyping]           = useState(false);

  // Default sidebar to closed on mobile
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Voice Recognition States
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // ── Refs for avoiding stale closures without extra deps ──────────────────
  const chatSessionsRef = useRef<ChatSession[]>([]);   // mirrors chatSessions
  const fetchedChatIds  = useRef<Set<string>>(new Set()); // gate: never re-fetch

  // Keep mirror ref in sync
  useEffect(() => {
    chatSessionsRef.current = chatSessions;
  }, [chatSessions]);

  // --- Mood State ---
  const [showMoodModal, setShowMoodModal]             = useState(false);
  const [moodModalDismissed, setMoodModalDismissed]   = useState(false);
  const [selectedMoodAnimation, setSelectedMoodAnimation] = useState<string | null>(null);

  const activeChat = chatSessions.find(c => c.id === activeChatId);
  const messages   = activeChat?.messages || [];

  // ── Create a fresh local chat session ────────────────────────────────────
  const createNewChat = useCallback(() => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: "New Chat",
      messages: [],
      isLoaded: true,
    };
    // Pre-mark so the fetch effect never tries to load it from DB
    fetchedChatIds.current.add(newId);
    setChatSessions(prev => [newSession, ...prev]);
    setActiveChatId(newId);
    return newId;
  }, []);

  // ── 1. Fetch session headers on mount (runs once) ─────────────────────────
  useEffect(() => {
    if (!uid) return;

    const fetchSessions = async () => {
      try {
        const res = await fetch(`/api/chat?uid=${uid}`);
        if (res.ok) {
          const data = await res.json();
          if (data.sessions && data.sessions.length > 0) {
            const loadedSessions: ChatSession[] = data.sessions.map((s: any) => ({
              id: s.chatId,
              title: s.title || "Untitled Chat",
              messages: [],
              isLoaded: false,
            }));
            setChatSessions(loadedSessions);
          }
        }
      } catch (err) {
        console.error("Failed to fetch chat sessions:", err);
      }

      // Always open on a fresh new chat
      const newId = Date.now().toString();
      fetchedChatIds.current.add(newId); // pre-mark as loaded
      setChatSessions(prev => [
        { id: newId, title: "New Chat", messages: [], isLoaded: true },
        ...prev,
      ]);
      setActiveChatId(newId);
    };

    fetchSessions();
  }, [uid]); // ← uid only — runs exactly once

  // ── 2. Fetch messages when user clicks a history session ──────────────────
  //    NO chatSessions in deps — reads via ref instead
  useEffect(() => {
    if (!uid || !activeChatId) return;

    // Gate: already fetched → skip
    if (fetchedChatIds.current.has(activeChatId)) return;

    // Read current sessions via ref (avoids chatSessions as dep)
    const session = chatSessionsRef.current.find(s => s.id === activeChatId);

    // Brand-new local session or already loaded → skip
    if (!session || session.isLoaded) {
      fetchedChatIds.current.add(activeChatId);
      return;
    }

    // Mark BEFORE async call → prevents any double-fetch race
    fetchedChatIds.current.add(activeChatId);

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chat?uid=${uid}&chatId=${activeChatId}`);
        if (res.ok) {
          const data = await res.json();
          const mapped: Message[] = (data.messages || []).map((m: any) => ({
            sender: m.sender,
            message: m.message,
            timestamp: new Date(m.timestamp),
          }));

          setChatSessions(prev =>
            prev.map(s =>
              s.id === activeChatId
                ? { ...s, messages: mapped, isLoaded: true, title: data.title || s.title }
                : s
            )
          );
        }
      } catch (err) {
        console.error("Failed to fetch chat messages:", err);
      }
    };

    fetchMessages();
  }, [uid, activeChatId]); // ← chatSessions intentionally NOT here

  // ── Show mood modal once per session ─────────────────────────────────────
  useEffect(() => {
    if (!moodModalDismissed && uid) {
      setShowMoodModal(true);
    }
  }, [uid, moodModalDismissed]);

  // ── Record a mood event ───────────────────────────────────────────────────
  const recordMood = useCallback(async (emoji: string, source: "manual" | "ai") => {
    try {
      await fetch("/api/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, emoji, source }),
      });
    } catch (err) {
      console.error("Failed to save mood:", err);
    }
  }, [uid]);

  const handleMoodSelect = (emoji: string) => {
    setSelectedMoodAnimation(emoji);
    recordMood(emoji, "manual");
    setTimeout(() => {
      setShowMoodModal(false);
      setMoodModalDismissed(true);
      setSelectedMoodAnimation(null);
    }, 600);
  };

  const handleNewChat = () => {
    createNewChat();
    setSearchQuery("");
    if (!sidebarOpen) setSidebarOpen(true);
  };

  // ── Voice Typing Implementation ───────────────────────────────────────────
  const toggleVoiceTyping = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript;
          }
        }
        if (transcript) {
          setInputValue(prev => prev + (prev.endsWith(" ") || prev === "" ? "" : " ") + transcript);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      console.error("Speech recognition start error:", err);
      setIsListening(false);
    }
  }, [isListening]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const presetQuestions = [
    { text: "Are you safe right now?",                            icon: <Shield      className="w-4 h-4 text-emerald-500" /> },
    { text: "How has your day been today?",                       icon: <Clock       className="w-4 h-4 text-blue-500"    /> },
    { text: "What happened recently to make you feel this way?",  icon: <Zap         className="w-4 h-4 text-amber-500"   /> },
    { text: "Is this a recurring issue or the first time?",       icon: <CheckCircle className="w-4 h-4 text-purple-500"  /> },
    { text: "Is there someone nearby you trust to talk to?",      icon: <Users       className="w-4 h-4 text-cyan-500"    /> },
    { text: "Would you like to discuss your next steps or options?", icon: <Heart    className="w-4 h-4 text-rose-500"    /> },
  ];

  // ── Save a single message to DB ───────────────────────────────────────────
  const saveMessageToDb = async (msg: Message, title?: string) => {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          chatId: activeChatId,
          message: msg.message,
          sender: msg.sender,
          timestamp: msg.timestamp,
          ...(title ? { title } : {}),
        }),
      });
      if (!res.ok) {
        const errBody = await res.text();
        console.error("DB save failed:", res.status, errBody);
      }
    } catch (err) {
      console.error("Failed to save message to DB:", err);
    }
  };

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { sender: "user", message: text, timestamp: new Date() };

    const isFirstMessage = messages.length === 0;
    const newTitle = isFirstMessage
      ? text.slice(0, 30) + (text.length > 30 ? "..." : "")
      : undefined;

    saveMessageToDb(userMsg, newTitle);

    setChatSessions(prev =>
      prev.map(chat =>
        chat.id === activeChatId
          ? { ...chat, title: newTitle || chat.title, messages: [...chat.messages, userMsg] }
          : chat
      )
    );

    setInputValue("");
    setIsTyping(true);

    try {
      const userInfoParts: string[] = [];
      if (userRecord.age)           userInfoParts.push(`Age: ${userRecord.age}`);
      if (userRecord.gender)        userInfoParts.push(`Gender: ${userRecord.gender}`);
      if (userRecord.maritalStatus) userInfoParts.push(`Marital Status: ${userRecord.maritalStatus}`);
      const userInfoStr = userInfoParts.join(", ") || "No additional profile info provided.";

      const history = messages
        .filter(msg => !msg.isError)
        .map(msg => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.message,
        }));

      const res = await fetch("https://stress-ai-service-n783.onrender.com/analyze-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: `${uid}-${activeChatId}`,
          user_info: userInfoStr,
          message: text,
          history,
          memory_summary: userRecord.summaryMap 
            ? Object.entries(userRecord.summaryMap)
                .sort((a,b) => b[0].localeCompare(a[0])) // latest first
                .slice(0, 3) // last 3 days
                .map(([date, text]) => `${date}: ${text}`)
                .join("\n")
            : "",
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("API Error Response:", errorText);
        throw new Error(`API call failed: ${res.status} ${errorText}`);
      }

      const data = await res.json();

      const botMsg: Message = {
        sender: "bot",
        message: data.response || "I'm sorry, I couldn't process that request.",
        timestamp: new Date(),
      };

      saveMessageToDb(botMsg);

      setChatSessions(prev =>
        prev.map(chat =>
          chat.id === activeChatId
            ? { ...chat, messages: [...chat.messages, botMsg] }
            : chat
        )
      );

      // Save analysis
      if (data.stress_score !== undefined || data.response) {
        fetch("/api/chat/analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid,
            userMessage: text,
            aiResponse: data.response,
            stressScore: data.stress_score,
            stressLevel: data.risk || "low",
            riskTrend: data.risk_trend || "stable",
            triggerSummary: false,
            legalAdvice: "Analysis based on stress risk level: " + (data.risk || "low"),
          }),
        }).catch(err => console.error("Failed to save analysis:", err));
      }

      // AI Emotion → Mood Tracking
      if (Array.isArray(data.emotions) && data.emotions.length > 0) {
        for (const emotion of data.emotions) {
          recordMood(mapEmotionToEmoji(emotion), "ai");
        }
      }

      console.log("Chat Analysis:", {
        emotions: data.emotions,
        stress_score: data.stress_score,
        risk: data.risk,
      });

    } catch (error: any) {
      console.error("Chatbot Error:", error);

      let rescuedMessage = "I encountered an error connecting to my safety service. Please try again soon.";
      const errorStr = error.toString();

      if (errorStr.includes("RESOURCE_EXHAUSTED") || errorStr.includes("429")) {
        rescuedMessage = "⏳ The AI service has reached its daily request limit. Please try again later.";
      } else if (errorStr.includes("AI returned malformed JSON") && errorStr.includes("model response:")) {
        const parts = errorStr.split("model response:");
        if (parts.length > 1) {
          rescuedMessage = parts[1].trim()
            .replace(/\\n/g, " ")
            .replace(/^"/, "").replace(/"$/, "").replace(/}$/, "")
            .trim();
        }
      }

      const errorMsg: Message = {
        sender: "bot",
        message: rescuedMessage,
        timestamp: new Date(),
        isError: true,
      };

      setChatSessions(prev =>
        prev.map(chat =>
          chat.id === activeChatId
            ? { ...chat, messages: [...chat.messages, errorMsg] }
            : chat
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const filteredChats = chatSessions.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full w-full rounded-none md:rounded-2xl overflow-hidden border-none md:border md:border-zinc-200 dark:md:border-zinc-800 bg-white dark:bg-[#121212] md:shadow-sm">

      {/* ── Mood Modal ── */}
      {showMoodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-8 max-w-md w-full mx-4 animate-in zoom-in-95 duration-300">
            <button
              onClick={() => { setShowMoodModal(false); setMoodModalDismissed(true); }}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#B21563] to-[#E91E8C] flex items-center justify-center shadow-lg shadow-[#B21563]/20">
                <Heart className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                How is your day going?
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Select how you&apos;re feeling right now
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {MOOD_EMOJIS.map(({ emoji, label }) => (
                <button
                  key={emoji}
                  onClick={() => handleMoodSelect(emoji)}
                  className={`group relative flex flex-col items-center gap-2 py-4 px-3 rounded-xl border transition-all duration-200
                    ${selectedMoodAnimation === emoji
                      ? "bg-[#B21563]/10 dark:bg-[#B21563]/20 border-[#B21563] scale-110 shadow-lg shadow-[#B21563]/20"
                      : "border-zinc-200 dark:border-zinc-700 hover:border-[#B21563]/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:scale-105 active:scale-95"
                    }`}
                >
                  <span className={`text-3xl transition-transform duration-200 ${selectedMoodAnimation === emoji ? "animate-bounce" : "group-hover:scale-110"}`}>
                    {emoji}
                  </span>
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    {label}
                  </span>
                </button>
              ))}
            </div>

            <p className="text-center text-xs text-zinc-400 mt-5">
              Your response helps us understand your wellbeing better
            </p>
          </div>
        </div>
      )}

      {/* ── Sidebar ── */}
      <div className={`
        ${sidebarOpen 
          ? "w-full absolute inset-0 z-30 bg-white dark:bg-[#0a0a0a] flex flex-col" 
          : "hidden"} 
        md:relative md:flex md:flex-col md:transition-all md:duration-300 md:overflow-hidden md:border-r border-zinc-200 dark:border-zinc-800
        ${sidebarOpen ? "md:w-64" : "md:w-16"}
        flex-shrink-0 transition-all duration-300
      `}>
        <div className={`p-4 flex items-center ${sidebarOpen ? "justify-between" : "justify-center"}`}>
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold text-lg">
                <div className="p-1 rounded bg-[#B21563]">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                Chat
              </div>
              {/* Close button for mobile overlay */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden text-zinc-500" 
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </>
          ) : (
            <div className="cursor-pointer" onClick={() => setSidebarOpen(true)}>
              {/* Show Hamburger on mobile when collapsed, otherwise logo */}
              <div className="md:hidden">
                <Menu className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
              </div>
              <div className="hidden md:block p-1 rounded bg-[#B21563]">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
            </div>
          )}
        </div>

        <div className={`px-4 pb-4 flex flex-col ${sidebarOpen ? "gap-3" : "gap-4 items-center"}`}>
          {sidebarOpen ? (
            <>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-200 dark:bg-zinc-800 border-none rounded-md py-2 pl-9 pr-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#B21563]"
                  placeholder="Search history..."
                />
              </div>
              <Button onClick={handleNewChat} className="w-full bg-[#B21563] hover:bg-[#911050] text-white flex gap-2 items-center justify-center rounded-lg">
                <Plus className="w-4 h-4" />
                New chat
              </Button>
            </>
          ) : (
            <div className="hidden md:flex flex-col gap-4 items-center">
              <Button onClick={() => setSidebarOpen(true)} size="icon" variant="ghost" className="w-10 h-10 rounded-full text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/50 self-center shrink-0 transition-colors" title="Search">
                <Search className="w-5 h-5" />
              </Button>
              <Button onClick={handleNewChat} size="icon" className="w-10 h-10 rounded-xl bg-[#B21563] hover:bg-[#911050] text-white self-center shrink-0 shadow-sm transition-all hover:scale-105 active:scale-95" title="New Chat">
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {sidebarOpen && (
            <>
              <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 px-2 pt-2 pb-1">Recent</div>
              {filteredChats.map(chat => (
                <div
                  key={chat.id}
                  onClick={() => setActiveChatId(chat.id)}
                  className={`px-3 py-2 text-sm rounded-md cursor-pointer truncate transition-colors ${
                    activeChatId === chat.id
                      ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  {chat.title}
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* ── Main Chat Area ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#121212] relative h-full">
        {/* Mobile Hamburger Button - Top Left */}
        {!sidebarOpen && (
          <div className="md:hidden absolute top-2 left-2 z-20">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="text-zinc-600 dark:text-zinc-400 h-9 w-9 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        )}

        <div className="absolute top-4 left-4 z-10 hidden md:block">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <PanelLeft className="w-5 h-5" />
          </Button>
        </div>

        {/* Messages List / Empty State area - Scrollable */}
        <div className="flex-1 overflow-y-auto scroll-smooth">
          {messages.length === 0 ? (
            <div className="min-h-full flex flex-col items-center justify-center p-6 pt-20 md:pt-6 bg-white dark:bg-[#121212]">
              <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-8 tracking-tight text-center">
                Good afternoon
              </h1>

              <div className="w-full max-w-2xl flex flex-col items-center">
                {/* Preset Questions */}
                <div className="flex flex-wrap gap-2 my-6 justify-center">
                  {presetQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(q.text)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      {q.icon}
                      {q.text}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 py-8 md:p-8 md:pt-16 space-y-6">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 md:gap-4 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.sender === "bot" && (
                    <Avatar className="w-8 h-8 md:w-10 md:h-10 rounded shrink-0 bg-[#B21563]">
                      <Bot className="w-5 h-5 md:w-6 md:h-6 m-auto text-white" />
                    </Avatar>
                  )}
                  <div className={`px-4 py-3 max-w-[85%] md:max-w-[80%] rounded-2xl ${
                    msg.sender === "user"
                      ? "bg-[#B21563] text-white rounded-tr-sm shadow-sm"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tl-sm border border-zinc-200 dark:border-zinc-700 shadow-sm"
                  }`}>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.message}</p>
                  </div>
                  {msg.sender === "user" && (
                    <Avatar className="w-8 h-8 md:w-10 md:h-10 rounded shrink-0 bg-zinc-200 dark:bg-zinc-700">
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-4 justify-start">
                  <Avatar className="w-8 h-8 rounded shrink-0 bg-[#B21563]">
                    <Bot className="w-5 h-5 m-auto text-white" />
                  </Avatar>
                  <div className="px-4 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl rounded-tl-sm border border-zinc-200 dark:border-zinc-700 flex items-center gap-1 shadow-sm">
                    <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Sticky Input Area */}
        <div className="p-4 md:p-6 bg-white dark:bg-[#121212] border-t border-zinc-200 dark:border-zinc-800 w-full max-w-4xl mx-auto">
          <MessageInput 
            inputValue={inputValue}
            setInputValue={setInputValue}
            onSend={() => handleSend(inputValue)}
            isListening={isListening}
            toggleVoiceTyping={toggleVoiceTyping}
          />
        </div>
      </div>
    </div>
  );
}