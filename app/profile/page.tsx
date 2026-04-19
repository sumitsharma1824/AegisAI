"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const schema = z.object({
    name: z.string().min(2, "Name is required"),
    age: z.string().min(1, "Age is required"),
    gender: z.enum(["Male", "Female", "Other"], { message: "Gender is required" }),
    maritalStatus: z.enum(["Yes", "No"], { message: "Marital status is required" }),
    secretKey: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ProfilePage() {
    const router = useRouter();
    const [uid, setUid] = useState<string | null>(null);
    const [profilePic, setProfilePic] = useState("");
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [enableSecretKey, setEnableSecretKey] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [contacts, setContacts] = useState<string[]>([]);
const [contactInput, setContactInput] = useState("");
const [emergencyMessage, setEmergencyMessage] = useState("");
const addContact = () => {
  const formatted = contactInput.trim(); // 🔥 FIX

  if (!formatted) return;

  if (!formatted.startsWith("+")) {
    alert("Use format +91XXXXXXXXXX");
    return;
  }

  if (formatted.length < 10) {
    alert("Invalid number");
    return;
  }

  if (contacts.includes(formatted)) {
    alert("Already added");
    return;
  }

  if (contacts.length >= 3) {
    alert("Max 3 contacts allowed");
    return;
  }

  setContacts((prev) => [...prev, formatted]);
  setContactInput("");
};

const removeContact = (index: number) => {
  setContacts((prev) => prev.filter((_, i) => i !== index));
};

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const timestamp = Math.round((new Date).getTime() / 1000);
            const res = await fetch("/api/cloudinary/sign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paramsToSign: { timestamp } })
            });
            const { signature } = await res.json();

            const formData = new FormData();
            formData.append("file", file);
            formData.append("api_key", process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!);
            formData.append("timestamp", timestamp.toString());
            formData.append("signature", signature);

            const uploadRes = await fetch(
                `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, 
                { method: "POST", body: formData }
            );

            const data = await uploadRes.json();
            if(data.secure_url) {
                setProfilePic(data.secure_url);
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("Failed to upload image.");
        } finally {
            setIsUploading(false);
        }
    };

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { isSubmitting, errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const secretKeyWatch = watch("secretKey");

    useEffect(() => {
        const auth = getAuth(app);
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push("/authpage");
            } else {
                setUid(user.uid);
                
                try {
                    const res = await fetch("/api/auth/me", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ uid: user.uid }),
                    });
                    
                    if (res.ok) {
                        const data = await res.json();
                       if (data.user && data.user.isProfileComplete) {
  setIsEditing(true);

  reset({
    name: data.user.name || "",
    age: data.user.age || "",
    gender: data.user.gender || undefined,
    maritalStatus: data.user.maritalStatus || undefined,
    secretKey: data.user.secretKey || "",
  });

  if (data.user.profilePicUrl) {
    setProfilePic(data.user.profilePicUrl);
  }

  if (data.user.secretKey) {
    setEnableSecretKey(true);
  }

  // 🔥 ADD THIS
  setContacts(data.user.trustedContacts || []);
  setEmergencyMessage(data.user.emergencyMessage || "");
}
                    }
                } catch (error) {
                    console.error("Failed to load existing profile:", error);
                }
            }
            setLoadingAuth(false);
        });
        return () => unsubscribe();
    }, [router, reset]);

    const generateSecretKey = () => {
        const key = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
        setValue("secretKey", key);
    };

    const copyToClipboard = () => {
        if (secretKeyWatch) {
            navigator.clipboard.writeText(secretKeyWatch);
            alert("Secret Key copied to clipboard!");
        }
    };

    const onSubmit = async (data: FormData) => {
        if (!uid) return;

        try {
            const res = await fetch("/api/auth/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...data, uid, profilePicUrl: profilePic,  trustedContacts: contacts,     
  emergencyMessage: emergencyMessage }),
            });

          const result = await res.json();
console.log("PROFILE RESPONSE:", result);

if (!res.ok) throw new Error(result.error || "Failed to save profile");

            router.push("/dashboard");
        } catch (error: unknown) {
            console.error(error);
            alert("Error saving profile: " + (error as Error).message);
        }
    };

    if (loadingAuth) return <div className="h-screen flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <Card className="shadow-lg border-zinc-200/60">
                    <CardHeader className="text-center pb-8 border-b border-zinc-100">
                        <CardTitle className="text-3xl font-bold text-zinc-900">
                            {isEditing ? "Edit Your Profile" : "Complete Your Profile"}
                        </CardTitle>
                        <CardDescription className="text-zinc-500 mt-2">
                            {isEditing 
                                ? "Update your details below." 
                                : "Please provide your details to set up your account on AegisAI."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-8">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            
                            {/* Profile Picture Upload */}
                            <div className="flex flex-col items-center justify-center space-y-4 mb-8">
                                <Avatar className="h-28 w-28 border-4 border-white shadow-xl">
                                    <AvatarImage src={profilePic} />
                                    <AvatarFallback className="bg-zinc-100 text-zinc-400">Pic</AvatarFallback>
                                </Avatar>
                                
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    onChange={handleFileUpload} 
                                />
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                >
                                    {isUploading ? "Uploading..." : "Upload Photo"}
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <Input placeholder="E.g. Jane Doe" {...register("name")} />
                                    {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label>Age</Label>
                                    <Input type="number" placeholder="E.g. 25" {...register("age")} />
                                    {errors.age && <p className="text-xs text-red-500">{errors.age.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label>Gender</Label>
                                    <Select onValueChange={(v) => setValue("gender", v as "Male" | "Female" | "Other")}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Female">Female</SelectItem>
                                            <SelectItem value="Male">Male</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.gender && <p className="text-xs text-red-500">{errors.gender.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label>Marital Status</Label>
                                    <Select onValueChange={(v) => setValue("maritalStatus", v as "Yes" | "No")}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Married?" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Yes">Yes</SelectItem>
                                            <SelectItem value="No">No</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.maritalStatus && <p className="text-xs text-red-500">{errors.maritalStatus.message}</p>}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-zinc-100">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <Label className="text-base font-semibold mb-1 block">Secret Key Security</Label>
                                        <p className="text-sm text-zinc-500">Enable an extra layer of security for accessing the dashboard.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer" 
                                            checked={enableSecretKey}
                                            onChange={(e) => {
                                                setEnableSecretKey(e.target.checked);
                                                if (!e.target.checked) setValue("secretKey", "");
                                            }}
                                        />
                                        <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-900"></div>
                                    </label>
                                </div>
                                
                                {enableSecretKey && (
                                    <div className="flex gap-2 animate-in fade-in slide-in-from-top-2">
                                        <Input placeholder="Enter or generate secret key" {...register("secretKey")} className="font-mono bg-zinc-50" />
                                        <Button type="button" variant="outline" onClick={generateSecretKey}>
                                            Generate
                                        </Button>
                                        <Button type="button" variant="secondary" onClick={copyToClipboard}>
                                            Copy
                                        </Button>
                                    </div>
                                )}
                            </div>
{/* 🔥 Trusted Contacts Section */}
<div className="pt-6 border-t border-zinc-100">
  <Label className="text-base font-semibold mb-2 block">
    Trusted Contacts
  </Label>

  {/* Input */}
  <div className="flex gap-2 mb-3">
    <Input
      placeholder="+91XXXXXXXXXX"
      value={contactInput}
      onChange={(e) => setContactInput(e.target.value)}
    />
    <Button
      type="button"
      onClick={addContact}
      disabled={!contactInput}
    >
      Add
    </Button>
  </div>

  {/* Contact List */}
  <div className="space-y-2 mb-4">
    {contacts.map((c, i) => (
      <div
        key={i}
         className="flex justify-between items-center bg-white dark:bg-zinc-800/50 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700"
      >
        <span className="text-sm text-zinc-800 dark:text-zinc-200">{c}</span>
        <button
          type="button"
          onClick={() => removeContact(i)}
          className="text-red-500 text-sm"
        >
          Remove
        </button>
      </div>
    ))}
  </div>

  {/* Message */}
  <Label className="text-sm mb-1 block">
    Emergency Message
  </Label>

  <textarea
    value={emergencyMessage}
    onChange={(e) => setEmergencyMessage(e.target.value)}
    placeholder="I need help"
   className="
    w-full
    rounded-xl
    border border-zinc-200 dark:border-zinc-700
    bg-white dark:bg-zinc-900/60
    text-zinc-900 dark:text-zinc-200
    placeholder:text-zinc-400 dark:placeholder:text-zinc-500
    p-3
    text-sm
    resize-none
    min-h-[100px]
    focus:outline-none
    focus:ring-2
    focus:ring-zinc-400 dark:focus:ring-zinc-500
    focus:border-zinc-400 dark:focus:border-zinc-500
    transition
    duration-200
  "
  />
</div>

                            <div className="flex gap-4 mt-8">
                                {isEditing && (
                                    <Button 
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.push("/dashboard")}
                                        className="flex-1 py-6 rounded-xl font-semibold border-zinc-200"
                                    >
                                        Cancel
                                    </Button>
                                )}
                                <Button 
                                    type="button"
                                    onClick={handleSubmit(onSubmit)}
                                    className={`${isEditing ? "flex-1" : "w-full"} bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-6 rounded-xl transition-all`}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Saving..." : isEditing ? "Update Profile" : "Save Profile & Continue"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
