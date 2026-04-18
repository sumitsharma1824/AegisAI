"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { app } from "@/lib/firebase";

import {
    Card,
    CardContent,
    CardHeader,
    CardDescription,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const schema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export default function LoginForm() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { isSubmitting, errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData) => {
        const auth = getAuth(app);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
            
            // Auto-sync into MongoDB in case the user exists in Firebase but was wiped from DB.
            await fetch("/api/auth/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    uid: userCredential.user.uid, 
                    email: userCredential.user.email 
                }),
            });

            router.push("/dashboard");
        } catch (error: unknown) {
            console.error("Error signing in", error);
            alert("Error signing in: " + (error as Error).message);
        }
    };

    return (
        <Card className="w-full border-zinc-200/50 shadow-sm">
            <CardHeader>
                <CardTitle className="text-2xl font-semibold">Welcome back</CardTitle>
                <CardDescription>
                    Enter your email and password to access your account.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                            id="email"
                            type="email"
                            placeholder="name@example.com" 
                            {...register("email")} 
                            className="border-zinc-200 bg-white"
                        />
                        {errors.email && (
                            <p className="text-sm text-red-500 font-medium">{errors.email.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                            <Input 
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password" 
                                {...register("password")} 
                                className="border-zinc-200 bg-white pr-10"
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 focus:outline-none"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" /></svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                )}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="text-sm text-red-500 font-medium">{errors.password.message}</p>
                        )}
                    </div>

                    <Button 
                        type="button"
                        onClick={handleSubmit(onSubmit)}
                        className="w-full bg-[#B21563] hover:bg-[#911050] text-[#f4f4f5] font-medium shadow-sm transition-all" 
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Signing in..." : "Login"}
                    </Button>
                </form>
            </CardContent>

            <CardFooter className="justify-center text-sm text-zinc-500 pt-2 border-t border-zinc-100">
                Don&apos;t have an account?
                <button
                    onClick={() => router.push("/authpage?mode=signup")}
                    className="ml-1 font-medium text-zinc-900 hover:underline"
                >
                    Sign up
                </button>
            </CardFooter>
        </Card>
    );
}