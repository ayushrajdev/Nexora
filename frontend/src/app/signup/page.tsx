"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flame, Mail, Lock, User, Github, Chrome } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { authService } from "@/services/auth.service";
import { normalizeApiError } from "@/lib/api-client";
import { APP_ROUTES } from "@/config/routes";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function SignupPage() {
  const { signup, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailId, setEmailId] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(APP_ROUTES.FEED);
    }
  }, [isLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (firstName.trim().length < 3) {
      setError("First name must be at least 3 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await signup({
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        emailId: emailId.trim(),
        password,
      });
      toast({
        title: `Welcome to DevTinder, ${user.firstName}!`,
        description: "Complete your tech stack in your profile or start swiping.",
        variant: "success",
      });
      router.push(APP_ROUTES.PROFILE);
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-800/90 bg-slate-900/85 p-8 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-rose-400 shadow-lg shadow-brand-600/30">
            <Flame className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">
            Create Your Dev Profile
          </h1>
          <p className="text-xs text-slate-400">
            Join thousands of developers matching and shipping together
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-950/50 p-3 text-xs text-rose-200 font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="First Name"
              type="text"
              required
              placeholder="Elon"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
            />

            <Input
              label="Last Name"
              type="text"
              placeholder="Musk"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
            />
          </div>

          <Input
            label="Email Address"
            type="email"
            required
            placeholder="elon@x.com"
            value={emailId}
            onChange={(e) => setEmailId(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <Input
            label="Password"
            type="password"
            required
            placeholder="Password@123"
            helperText="Use 8+ chars with uppercase, lowercase, number, and symbol"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
          />

          <Button
            type="submit"
            size="lg"
            isLoading={isSubmitting}
            className="w-full mt-2"
          >
            Create Account
          </Button>
        </form>

        {/* OAuth Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-800" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Or sign up with
          </span>
          <div className="h-px flex-1 bg-slate-800" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <a
            href={authService.getGoogleOAuthUrl()}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-700/80 bg-slate-950/60 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:border-slate-600 hover:bg-slate-800/80 transition-colors"
          >
            <Chrome className="h-4 w-4 text-rose-400" />
            <span>Google</span>
          </a>

          <a
            href={authService.getGithubOAuthUrl()}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-700/80 bg-slate-950/60 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:border-slate-600 hover:bg-slate-800/80 transition-colors"
          >
            <Github className="h-4 w-4 text-slate-200" />
            <span>GitHub</span>
          </a>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Already have an account?{" "}
          <Link
            href={APP_ROUTES.LOGIN}
            className="font-semibold text-brand-400 hover:text-brand-300"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
