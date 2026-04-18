"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Plus, Search, PanelLeft, Paperclip, ArrowUp, Zap, Heart, CheckCircle, Clock, Users, Shield, MessageSquare, Bot, X } from "lucide-react";
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
  isLoaded: boolean; // Whether full messages have been fetched from DB
}

interface UserRecord {
  name?: string;
  age?: string;
  gender?: string;
  maritalStatus?: string;
  profilePicUrl?: string;
}

interface ChatbotSectionProps {
  userRecord: UserRecord;
  uid: string;
}

// --- Mood Constants ---
const MOOD_EMOJIS = [
  { emoji: "😄", label: "Great", weight: 0 },
  { emoji: "🙂", label: "Good", weight: 1 },
  { emoji: "😐", label: "Okay", weight: 2 },
  { emoji: "😕", label: "Not great", weight: 3 },
  { emoji: "😢", label: "Sad", weight: 4 },
  { emoji: "😭", label: "Terrible", weight: 5 },
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

function mapEmotionToEmoji(emotion: string): string {
  const key = emotion.toLowerCase().trim();
  return EMOTION_TO_EMOJI[key] || "😐";
}

export default function ChatbotSection({ userRecord, uid }: ChatbotSectionProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Mood State ---
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [moodModalDismissed, setMoodModalDismissed] = useState(false);
  const [selectedMoodAnimation, setSelectedMoodAnimation] = useState<string | null>(null);

  const activeChat = chatSessions.find(c => c.id === activeChatId);
  const messages = activeChat?.messages || [];

  // --- Create a fresh new chat session ---
  const createNewChat = useCallback(() => {
    const newId = Date.now().toString();
    const newSession: ChatSession = { id: newId, title: "New Chat", messages: [], isLoaded: true };
    setChatSessions(prev => [newSession, ...prev]);
    setActiveChatId(newId);
    return newId;
  }, []);

  // --- Fetch all chat session headers from DB on mount ---
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
              isLoaded: false, // Messages not yet fetched
            }));
            setChatSessions(loadedSessions);
          }
        }
      } catch (err) {
        console.error("Failed to fetch chat sessions:", err);
      }

      // Always start with a fresh new chat regardless of history
      const newId = Date.now().toString();
      setChatSessions(prev => [
        { id: newId, title: "New Chat", messages: [], isLoaded: true },
        ...prev
      ]);
      setActiveChatId(newId);
    };

    fetchSessions();
  }, [uid]);

  // --- Fetch messages for a specific session when it becomes active ---
  useEffect(() => {
    if (!uid || !activeChatId) return;

    const session = chatSessions.find(s => s.id === activeChatId);
    if (!session || session.isLoaded) return;

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
          
          setChatSessions(prev => prev.map(s =>
            s.id === activeChatId 
              ? { ...s, messages: mapped, isLoaded: true, title: data.title || s.title }
              : s
          ));
        }
      } catch (err) {
        console.error("Failed to fetch chat messages:", err);
      }
    };

    fetchMessages();
  }, [uid, activeChatId, chatSessions]);

  // --- Show mood modal on first load ---
  useEffect(() => {
    if (!moodModalDismissed && uid) {
      setShowMoodModal(true);
    }
  }, [uid, moodModalDismissed]);

  // --- Record a mood event ---
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

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("Selected file:", file.name);
    }
  };

  const handleNewChat = () => {
    createNewChat();
    setSearchQuery("");
    if (!sidebarOpen) setSidebarOpen(true);
  };

  const presetQuestions = [
    { text: "Are you safe right now?", icon: <Shield className="w-4 h-4 text-emerald-500" /> },
    { text: "How has your day been today?", icon: <Clock className="w-4 h-4 text-blue-500" /> },
    { text: "What happened recently to make you feel this way?", icon: <Zap className="w-4 h-4 text-amber-500" /> },
    { text: "Is this a recurring issue or the first time?", icon: <CheckCircle className="w-4 h-4 text-purple-500" /> },
    { text: "Is there someone nearby you trust to talk to?", icon: <Users className="w-4 h-4 text-cyan-500" /> },
    { text: "Would you like to discuss your next steps or options?", icon: <Heart className="w-4 h-4 text-rose-500" /> },
  ];

  // --- Save a single message to the DB for the active chat session ---
  const saveMessageToDb = async (msg: Message, title?: string) => {
    try {
      await fetch("/api/chat", {
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
    } catch (err) {
      console.error("Failed to save message to DB:", err);
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { sender: "user", message: text, timestamp: new Date() };
  
    // Determine if this is the first message (set the chat title)
    const isFirstMessage = messages.length === 0;
    const newTitle = isFirstMessage ? text.slice(0, 30) + (text.length > 30 ? "..." : "") : undefined;

    // Save to DB with title if first message
    saveMessageToDb(userMsg, newTitle);
    
    setChatSessions((prev) => prev.map(chat => {
      if (chat.id === activeChatId) {
        return { 
          ...chat, 
          title: newTitle || chat.title,
          messages: [...chat.messages, userMsg] 
        };
      }
      return chat;
    }));

    setInputValue("");
    setIsTyping(true);

    try {
      const userInfoParts = [];
      if (userRecord.age) userInfoParts.push(`Age: ${userRecord.age}`);
      if (userRecord.gender) userInfoParts.push(`Gender: ${userRecord.gender}`);
      if (userRecord.maritalStatus) userInfoParts.push(`Marital Status: ${userRecord.maritalStatus}`);
      const userInfoStr = userInfoParts.join(", ") || "No additional profile info provided.";

      const history = messages
        .filter(msg => !msg.isError)
        .map(msg => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.message
        }));

      const res = await fetch("https://stress-ai-service-n783.onrender.com/analyze-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: `${uid}-${activeChatId}`,
          user_info: userInfoStr,
          message: text,
          history: history,
          memory_summary: "" 
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
        timestamp: new Date() 
      };

      saveMessageToDb(botMsg);

      setChatSessions((prev) => prev.map(chat => 
        chat.id === activeChatId ? { ...chat, messages: [...chat.messages, botMsg] } : chat
      ));

      // Save Analysis results
      if (data.stress_score !== undefined) {
        fetch("/api/chat/analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid,
            aiResponse: data.response,
            stressLevel: data.risk || "low",
            legalAdvice: "Analysis based on stress risk level: " + (data.risk || "low")
          }),
        }).catch(err => console.error("Failed to save analysis:", err));
      }

      // AI Emotion → Mood Tracking
      if (data.emotions && Array.isArray(data.emotions) && data.emotions.length > 0) {
        for (const emotion of data.emotions) {
          const mappedEmoji = mapEmotionToEmoji(emotion);
          recordMood(mappedEmoji, "ai");
        }
      }

      console.log("Chat Analysis:", { 
        emotions: data.emotions, 
        stress_score: data.stress_score, 
        risk: data.risk 
      });

    } catch (error: any) {
      console.error("Chatbot Error:", error);
      
      let rescuedMessage = "I encountered an error connecting to my safety service. Please try again soon.";
      const errorStr = error.toString();

      if (errorStr.includes("RESOURCE_EXHAUSTED") || errorStr.includes("429")) {
        rescuedMessage = "⏳ The AI service has reached its daily request limit. Please try again later or ask your admin to upgrade the API plan.";
      } else if (errorStr.includes("AI returned malformed JSON") && errorStr.includes("model response:")) {
        const parts = errorStr.split("model response:");
        if (parts.length > 1) {
          rescuedMessage = parts[1].trim()
            .replace(/\\n/g, ' ')
            .replace(/^"/, '')
            .replace(/"$/, '')
            .replace(/}$/, '')
            .trim();
        }
      }

      const errorMsg: Message = { 
        sender: "bot", 
        message: rescuedMessage, 
        timestamp: new Date(),
        isError: true
      };
      
      setChatSessions((prev) => prev.map(chat => 
        chat.id === activeChatId ? { ...chat, messages: [...chat.messages, errorMsg] } : chat
      ));
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const filteredChats = chatSessions.filter(chat => chat.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex h-[calc(100vh-120px)] w-full rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121212] shadow-sm">
      
      {/* ====== MOOD CHECK-IN MODAL ====== */}
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

      {/* Sidebar */}
      <div className={`${sidebarOpen ? "w-64" : "w-16"} flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0a0a0a] flex flex-col transition-all duration-300 overflow-hidden`}>
        <div className={`p-4 flex items-center ${sidebarOpen ? "justify-between" : "justify-center"}`}>
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold text-lg">
                <div className="p-1 rounded bg-[#B21563]">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                Chat
              </div>
            </>
          ) : (
            <div className="p-1 rounded bg-[#B21563] cursor-pointer" onClick={() => setSidebarOpen(true)}>
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
          )}
        </div>
        
        <div className={`px-4 pb-4 flex flex-col ${sidebarOpen ? 'gap-3' : 'gap-4 items-center'}`}>
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
            <>
              <Button onClick={() => setSidebarOpen(true)} size="icon" variant="ghost" className="w-10 h-10 rounded-full text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/50 self-center shrink-0 transition-colors" title="Search">
                <Search className="w-5 h-5" />
              </Button>
              <Button onClick={handleNewChat} size="icon" className="w-10 h-10 rounded-xl bg-[#B21563] hover:bg-[#911050] text-white self-center shrink-0 shadow-sm transition-all hover:scale-105 active:scale-95" title="New Chat">
                <Plus className="w-5 h-5" />
              </Button>
            </>
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
                  className={`px-3 py-2 text-sm rounded-md cursor-pointer truncate transition-colors ${activeChatId === chat.id ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"}`}
                >
                  {chat.title}
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#121212] relative">
        <div className="absolute top-4 left-4 z-10">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <PanelLeft className="w-5 h-5" />
          </Button>
        </div>

        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 mt-12">
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-8 tracking-tight">Good afternoon</h1>
            
            <div className="w-full max-w-2xl relative">
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
              <div className="relative flex items-center w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 rounded-xl px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-[#B21563]/50 transition-all">
                <Paperclip onClick={handleAttachmentClick} className="w-5 h-5 text-zinc-400 mr-2 cursor-pointer hover:text-zinc-600 dark:hover:text-zinc-300" />
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend(inputValue)}
                  placeholder="Type your message here..."
                  className="flex-1 bg-transparent border-none outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500"
                />
                <Button 
                  size="icon" 
                  className={`ml-2 h-8 w-8 rounded-md transition-colors ${
                    inputValue.trim() ? "bg-[#B21563] text-white hover:bg-[#911050]" : "bg-black text-white dark:bg-white dark:text-black pointer-events-none opacity-50"
                  }`}
                  onClick={() => handleSend(inputValue)}
                >
                  <ArrowUp className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 mt-6 justify-center">
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
          <>
            <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6 pt-16">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-4 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.sender === "bot" && (
                    <Avatar className="w-8 h-8 rounded shrink-0 bg-[#B21563]">
                      <Bot className="w-5 h-5 m-auto text-white" />
                    </Avatar>
                  )}
                  <div 
                    className={`px-4 py-3 max-w-[80%] rounded-2xl ${
                      msg.sender === "user" 
                        ? "bg-[#B21563] text-white rounded-tr-sm" 
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tl-sm border border-zinc-200 dark:border-zinc-700"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.message}</p>
                  </div>
                  {msg.sender === "user" && (
                    <Avatar className="w-8 h-8 rounded shrink-0 bg-zinc-200 dark:bg-zinc-700">
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
                  <div className="px-4 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl rounded-tl-sm border border-zinc-200 dark:border-zinc-700 flex items-center gap-1">
                    <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121212]">
              <div className="max-w-4xl mx-auto relative flex items-center w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 rounded-xl px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-[#B21563]/50 transition-all">
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                <Paperclip onClick={handleAttachmentClick} className="w-5 h-5 text-zinc-400 mr-2 cursor-pointer hover:text-zinc-600 dark:hover:text-zinc-300" />
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend(inputValue)}
                  placeholder="Type your message here..."
                  className="flex-1 bg-transparent border-none outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500"
                />
                <Button 
                  size="icon" 
                  className={`ml-2 h-8 w-8 rounded-md transition-colors ${
                    inputValue.trim() ? "bg-[#B21563] text-white hover:bg-[#911050]" : "bg-black text-white dark:bg-white dark:text-black pointer-events-none opacity-50"
                  }`}
                  onClick={() => handleSend(inputValue)}
                >
                  <ArrowUp className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
