"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { app } from "@/lib/firebase";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter,
    CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export default function SignupForm() {
    const router = useRouter();

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
            const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
            
            // Basic User Initialization in MongoDB
            await fetch("/api/auth/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    uid: userCredential.user.uid, 
                    email: userCredential.user.email 
                }),
            });

            // Redirect to profile setup page
            router.push("/profile");
        } catch (error: unknown) {
            console.error(error);
            alert("Signup failed: " + (error as Error).message);
        }
    };

    return (
        <Card className="w-full border-zinc-200/50 shadow-sm">
            <CardHeader>
                <CardTitle className="text-2xl font-semibold">Create account</CardTitle>
                <CardDescription>Enter your details below to create your account.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input 
                            id="signup-email"
                            placeholder="name@example.com" 
                            {...register("email")} 
                            className="border-zinc-200 bg-white"
                        />
                        {errors.email && (
                            <p className="text-sm text-red-500 font-medium">{errors.email.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input
                            id="signup-password"
                            type="password"
                            placeholder="Create a password"
                            {...register("password")}
                            className="border-zinc-200 bg-white"
                        />
                        {errors.password && (
                            <p className="text-sm text-red-500 font-medium">{errors.password.message}</p>
                        )}
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="signup-confirmPassword">Confirm Password</Label>
                        <Input
                            id="signup-confirmPassword"
                            type="password"
                            placeholder="Confirm your password"
                            {...register("confirmPassword")}
                            className="border-zinc-200 bg-white"
                        />
                        {errors.confirmPassword && (
                            <p className="text-sm text-red-500 font-medium">{errors.confirmPassword.message}</p>
                        )}
                    </div>

                    <Button 
                        type="button"
                        onClick={handleSubmit(onSubmit)}
                        className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-medium shadow-sm transition-all" 
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Creating account..." : "Continue"}
                    </Button>
                </form>
            </CardContent>

            <CardFooter className="justify-center text-sm text-zinc-500 pt-2 border-t border-zinc-100">
                Already have an account?
                <button
                    onClick={() => router.push("/authpage?mode=login")}
                    className="ml-1 font-medium text-zinc-900 hover:underline"
                >
                    Login
                </button>
            </CardFooter>
        </Card>
    );
}
