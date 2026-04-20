"use client";

import { useState } from "react";
import { getAuth } from "firebase/auth";

export default function EmergencyButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [countdown, setCountdown] = useState<number | null>(null);
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);
  const [mode, setMode] = useState<"default" | "ai" | null>(null);

  // 🔁 Sequential fallback
  const sendSequentialSMS = async (contacts: string[], message: string) => {
    for (let i = 0; i < contacts.length; i++) {
      const number = contacts[i];
      window.location.href = `sms:${number}?body=${message}`;
      await new Promise((res) => setTimeout(res, 4000));
    }
  };

  // 📞 CALL
  const handleCall = async () => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        alert("User not logged in");
        return;
      }

      const res = await fetch("/api/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "call",
          uid: currentUser.uid
        })
      });

      const data = await res.json();

      if (data.type === "call") {
        window.location.href = `tel:${data.number}`;
      }

      setOpen(false);
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  // 📩 SMS
  const handleSMS = async (useAI: boolean = false) => {
    setLoading(true);

    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      alert("User not logged in");
      setLoading(false);
      return;
    }

    try {
      await fetch("/api/chat/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: currentUser.uid,
          triggerSummary: true,
          aiResponse: "EMERGENCY_TRIGGERED",
          stressLevel: "high"
        })
      });
    } catch {}

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const location = `https://maps.google.com/?q=${latitude},${longitude}`;

          const res = await fetch("/api/emergency", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "sms",
              location,
              uid: currentUser.uid,
              useAI
            })
          });

          const data = await res.json();

          if (data.success) {
            const contacts: string[] = data.contacts || [];
            const message = encodeURIComponent(data.message || "");

            const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
            const numbers = contacts.join(",");

            const smsUrl = isIOS
              ? `sms:${numbers}&body=${message}`
              : `sms:${numbers}?body=${message}`;

            window.location.href = smsUrl;

            setTimeout(() => {
              if (contacts.length > 1) {
           
                  sendSequentialSMS(contacts, message);
                
              }
            }, 2000);
          }
        } catch {
          alert("Something went wrong");
        }

        setLoading(false);
        setTimeout(() => setOpen(false), 400);
      },
      () => {
        alert("Location permission denied");
        setLoading(false);
      }
    );
  };

  // ⏳ Countdown
  const startCountdown = (selectedMode: "default" | "ai") => {
    setMode(selectedMode);

    let time = 5;
    setCountdown(time);
    navigator.vibrate?.(200);

    const id = setInterval(() => {
      time--;

      if (time === 0) {
        clearInterval(id);
        setCountdown(null);
        handleSMS(selectedMode === "ai");
        setMode(null);
      } else {
        setCountdown(time);
      }
    }, 1000);

    setTimerId(id);
  };

  const cancelCountdown = () => {
    if (timerId) clearInterval(timerId);
    setCountdown(null);
    setMode(null);
  };

  return (
    <>
      {/* Floating Button */}
      <div className="tooltip-container mb-3">
        <button
          className="help-button transition-transform hover:scale-105 active:scale-95"
          onClick={() => setOpen(true)}
        >
          Need Help?
        </button>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">

          {/* Modal Card */}
          <div className="w-[320px] rounded-2xl p-6 bg-card text-card-foreground border border-border shadow-xl animate-[fadeIn_0.25s_ease]">

            <h2 className="text-lg font-semibold mb-5">
              Select action
            </h2>

            <div className="flex flex-col gap-3">

              {/* CALL */}
              <button
                onClick={handleCall}
                className="w-full py-2.5 rounded-xl bg-secondary text-secondary-foreground transition hover:opacity-80 active:scale-95"
              >
                📞 Emergency Call
              </button>

              {/* INFORM BUTTON */}
              {countdown === null && mode === null && (
                <button
                  onClick={() => setMode("default")}
                  className="
                    w-full py-2.5 rounded-xl text-white font-medium
                    bg-gradient-to-r from-red-500 to-pink-500
                    hover:from-red-600 hover:to-pink-600
                    transition-all duration-200
                    hover:scale-[1.02] active:scale-95
                  "
                >
                  Inform Contacts
                </button>
              )}

              {/* MODE SELECT */}
              {mode !== null && countdown === null && (
                <div className="flex gap-2 animate-[slideIn_0.2s_ease]">

                  <button
                    onClick={() => startCountdown("default")}
                    className="flex-1 py-2.5 rounded-xl bg-secondary text-secondary-foreground transition hover:opacity-80"
                  >
                    Default
                  </button>

                  <button
                    onClick={() => startCountdown("ai")}
                    className="flex-1 py-2.5 rounded-xl text-white bg-purple-500 hover:bg-purple-600 transition shadow-md"
                  >
                    AI
                  </button>

                </div>
              )}

              {/* COUNTDOWN */}
              {countdown !== null && (
                <div className="relative w-full overflow-hidden rounded-xl animate-[fadeIn_0.2s_ease]">

                  <button
                    onClick={cancelCountdown}
                    className="
                      w-full py-2.5 bg-destructive text-white
                      animate-pulse shadow-lg shadow-red-500/30
                    "
                  >
                    Sending in {countdown}s — Cancel
                  </button>

                  <div
                    className="absolute bottom-0 left-0 h-1 bg-white/40"
                    style={{
                      width: `${(countdown / 5) * 100}%`,
                      transition: "width 1s linear"
                    }}
                  />
                </div>
              )}

              {/* CANCEL */}
              <button
                onClick={() => {
                  setOpen(false);
                  setMode(null);
                }}
                className="text-muted-foreground text-sm hover:text-foreground transition"
              >
                Cancel
              </button>

            </div>
          </div>
        </div>
      )}
    </>
  );
}