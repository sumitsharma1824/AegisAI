"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getAuth, sendSignInLinkToEmail } from "firebase/auth";
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
});

type FormData = z.infer<typeof schema>;

export default function LoginForm() {
    const router = useRouter();
    const [isSent, setIsSent] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { isSubmitting, errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData) => {
        const auth = getAuth(app);
        // The URL we want to redirect to after clicking the link
        const actionCodeSettings = {
            url: window.location.origin + "/authpage?mode=login",
            handleCodeInApp: true,
        };

        try {
            await sendSignInLinkToEmail(auth, data.email, actionCodeSettings);
            window.localStorage.setItem("emailForSignIn", data.email);
            setIsSent(true);
        } catch (error: unknown) {
            console.error("Error sending login link", error);
            alert("Error sending login link: " + (error as Error).message);
        }
    };

    return (
        <Card className="w-full border-zinc-200/50 shadow-sm">
            <CardHeader>
                <CardTitle className="text-2xl font-semibold">Welcome back</CardTitle>
                <CardDescription>
                    {isSent 
                        ? "Check your email for the magic link we just sent to sign in." 
                        : "Enter your email to receive a passwordless magic link to access your account."}
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {!isSent ? (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input 
                                id="email"
                                placeholder="name@example.com" 
                                {...register("email")} 
                                className="border-zinc-200 bg-white"
                            />
                            {errors.email && (
                                <p className="text-sm text-red-500 font-medium">{errors.email.message}</p>
                            )}
                        </div>

                        <Button 
                            type="button"
                            onClick={handleSubmit(onSubmit)}
                            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-medium shadow-sm transition-all" 
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Sending..." : "Send Magic Link"}
                        </Button>
                    </form>
                ) : (
                    <div className="rounded-lg bg-green-50 p-4 border border-green-100 flex flex-col items-center justify-center space-y-2">
                        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm text-green-700 font-medium text-center">
                            Link sent! You can close this window and click the link in your email to sign in.
                        </p>
                    </div>
                )}
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
