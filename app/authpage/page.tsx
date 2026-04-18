"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
import { getAuth, isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { app } from "@/lib/firebase";

function AuthContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get("mode") || "login";
  const [activeTab, setActiveTab] = useState(mode);
  const [checkingLink, setCheckingLink] = useState(false);

  useEffect(() => {
    setActiveTab(mode);
  }, [mode]);

  useEffect(() => {
    const auth = getAuth(app);
    if (isSignInWithEmailLink(auth, window.location.href)) {
      setCheckingLink(true);
      let email = window.localStorage.getItem("emailForSignIn");
      if (!email) {
        email = window.prompt("Please provide your email for confirmation");
      }
      
      if (email) {
        signInWithEmailLink(auth, email, window.location.href)
          .then(async (result) => {
            window.localStorage.removeItem("emailForSignIn");
            
            // Sync with backend before redirecting
            await fetch("/api/auth/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ uid: result.user.uid, email: result.user.email }),
            });
            
            router.push("/dashboard");
          })
          .catch((error) => {
            console.error("Error signing in with email link", error);
            alert("Error signing in. The link might be expired.");
            setCheckingLink(false);
          });
      } else {
        setCheckingLink(false);
      }
    }
  }, [router]);

  if (checkingLink) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50 dark:bg-[#09090b]">
        <p className="text-zinc-500 animate-pulse">Completing sign in...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-50 dark:bg-[#09090b] p-4">
      <div className="w-full max-w-md">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <LoginForm />
          </TabsContent>
          
          <TabsContent value="signup">
            <SignupForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center">Loading...</div>}>
      <AuthContent />
    </Suspense>
  );
}
