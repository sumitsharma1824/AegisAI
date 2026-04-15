"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EvidenceSection from "@/components/dashboard/EvidenceSection";
import ChatbotSection from "@/components/dashboard/ChatbotSection";

interface UserRecord {
    name?: string;
    profilePicUrl?: string;
    secretKey?: string;
    isProfileComplete?: boolean;
}

export default function DashboardPage() {
    const router = useRouter();
    const [userRecord, setUserRecord] = useState<UserRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [showKeyModal, setShowKeyModal] = useState(false);
    const [enteredKey, setEnteredKey] = useState("");
    const [keyError, setKeyError] = useState(false);

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

                if (!res.ok) throw new Error("Failed to fetch user");
                
                const data = await res.json();
                
                if (!data.user.isProfileComplete) {
                    router.push("/profile");
                    return;
                }

                setUserRecord(data.user);
                
                if (data.user.secretKey) {
                    setShowKeyModal(true);
                }
            } catch (error) {
                console.error(error);
                router.push("/authpage");
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    const handleVerifyKey = () => {
        if (userRecord && enteredKey === userRecord.secretKey) {
            setShowKeyModal(false);
        } else {
            setKeyError(true);
        }
    };

    const handleLogout = async () => {
        const auth = getAuth(app);
        await signOut(auth);
        router.push("/authpage");
    };

    if (loading) {
        return <div className="h-screen flex items-center justify-center font-medium">Loading Dashboard...</div>;
    }

    if (!userRecord) return null;

    return (
        <div className="min-h-screen bg-zinc-50 relative">
            <Dialog open={showKeyModal} onOpenChange={() => {}}>
                <DialogContent className="sm:max-w-md [&>button]:hidden">
                    <DialogHeader>
                        <DialogTitle>Authentication Required</DialogTitle>
                        <DialogDescription>
                            Please enter your secret key to access the dashboard.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col space-y-4 py-4">
                        <Input 
                            type="password"
                            placeholder="Enter Secret Key" 
                            value={enteredKey} 
                            onChange={(e) => {
                                setEnteredKey(e.target.value);
                                setKeyError(false);
                            }} 
                            className={keyError ? "border-red-500" : ""}
                        />
                        {keyError && <p className="text-sm text-red-500">Incorrect secret key.</p>}
                        <div className="flex justify-end space-x-2">
                            <Button variant="ghost" onClick={handleLogout}>Logout</Button>
                            <Button onClick={handleVerifyKey} className="bg-zinc-900 text-white hover:bg-zinc-800">
                                Verify
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Dashboard Content */}
            <div className={`transition-all duration-300 ${showKeyModal ? "blur-md pointer-events-none" : ""}`}>
                {/* Header */}
                <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative group cursor-pointer" onClick={() => router.push("/profile")}>
                            <Avatar className="h-10 w-10 border-2 border-transparent transition-all group-hover:border-blue-500">
                                <AvatarImage src={userRecord.profilePicUrl} />
                                <AvatarFallback className="bg-zinc-100">{userRecord.name?.charAt(0) || "U"}</AvatarFallback>
                            </Avatar>
                            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white text-[10px]">Edit</span>
                            </div>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-zinc-900">AegisAI Dashboard</h1>
                            <p className="text-sm text-zinc-500">Welcome back, {userRecord.name}</p>
                        </div>
                    </div>

                    <Button variant="outline" size="sm" onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200">
                        Logout
                    </Button>
                </header>

                {/* Main Content Area */}
                <main className="p-6 max-w-5xl mx-auto space-y-6">
                    <Tabs defaultValue="evidence" className="w-full">
                        <div className="flex justify-center w-full mb-8">
                            <TabsList className="grid grid-cols-2 w-full max-w-xs h-12 bg-white border border-zinc-200 rounded-full p-1 shadow-sm">
                                <TabsTrigger value="evidence" className="rounded-full data-[state=active]:bg-zinc-900 data-[state=active]:text-white transition-all text-sm font-medium">Evidence</TabsTrigger>
                                <TabsTrigger value="chatbot" className="rounded-full data-[state=active]:bg-zinc-900 data-[state=active]:text-white transition-all text-sm font-medium">Chatbot</TabsTrigger>
                            </TabsList>
                        </div>
                        
                        <TabsContent value="evidence" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                            <EvidenceSection />
                        </TabsContent>
                        
                        <TabsContent value="chatbot" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                            <ChatbotSection />
                        </TabsContent>
                    </Tabs>
                </main>
            </div>
        </div>
    );
}
