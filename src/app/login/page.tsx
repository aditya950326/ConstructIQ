"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Mail,
  AlertCircle,
  KeyRound,
  Building2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { repository } from "@/lib/data/repository";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Please enter both email address and password.");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const authResult = repository.authenticate(email, password);
      setIsLoading(false);

      if (!authResult.success) {
        setErrorMessage(authResult.error || "Invalid email or password. Please verify credentials.");
        return;
      }

      const targetRole = authResult.user?.role || "super_admin";
      const dest = targetRole === "site_supervisor" ? "/app/supervisor" : "/app/overview";

      if (typeof window !== "undefined") {
        window.location.href = dest;
      } else {
        router.push(dest);
      }
    }, 200);
  };

  return (
    <div className="min-h-screen w-full relative overflow-x-hidden flex items-center justify-center lg:justify-end bg-zinc-950 font-sans selection:bg-construct-orange/30 selection:text-construct-text">
      {/* 1. Actual Background Image (Full Viewport) */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ backgroundImage: "url('/images/login-bg.jpg')" }}
      >
        {/* Subtle Ambient Contrast Overlay */}
        <div className="absolute inset-0 bg-black/15 backdrop-blur-[0.3px]" />
      </div>

      {/* 2. Architectural Accent Overlays (matching reference styling) */}
      <div className="hidden lg:block absolute left-12 top-1/3 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-tr from-orange-500/35 to-amber-500/10 blur-3xl pointer-events-none z-[1] opacity-80" />
      <div className="hidden lg:block absolute left-14 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-orange-500/90 to-transparent opacity-85 pointer-events-none z-[2]" />
      <div className="hidden lg:block absolute left-14 top-[28%] w-3 h-3 -translate-x-[5px] rounded-full bg-orange-500 shadow-[0_0_10px_#f97316] pointer-events-none z-[2]" />
      <div className="hidden lg:block absolute left-14 top-[68%] w-3 h-3 -translate-x-[5px] rounded-full bg-orange-500 shadow-[0_0_10px_#f97316] pointer-events-none z-[2]" />

      {/* 3. Floating Enterprise Login Card (Right-Aligned) */}
      <div className="relative z-10 w-full max-w-[510px] px-4 sm:px-6 lg:px-0 lg:mr-14 xl:mr-24 py-10">
        <div className="bg-white/95 backdrop-blur-md border border-white/70 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.38)] rounded-[32px] p-8 sm:p-10 transition-all">
          {/* Card Brand Header */}
          <div className="text-center">
            <Link href="/" className="inline-flex items-center justify-center hover:opacity-95 transition-opacity">
              <Logo size="md" />
            </Link>
            <h1 className="mt-3.5 text-2xl font-heading font-extrabold text-zinc-900 tracking-tight leading-snug">
              Enterprise Construction Site Portal
            </h1>
            <p className="mt-1 text-xs text-zinc-500 leading-relaxed max-w-sm mx-auto">
              Evidence-Linked Project Intelligence, Site Operations & Commercial Audits
            </p>
          </div>

          {/* Validation Feedback */}
          {errorMessage && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleCustomLogin} className="space-y-4 mt-5">
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                Authorized Email Address
              </label>
              <div className="relative rounded-xl bg-[#eef3f8] border border-slate-200/90 focus-within:border-construct-orange focus-within:bg-white focus-within:ring-2 focus-within:ring-construct-orange/15 transition-all">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@constructiq.io"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs text-zinc-900 bg-transparent rounded-xl focus:outline-none font-medium placeholder:text-zinc-400"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-zinc-800">Password</label>
                <span className="text-[10px] font-mono text-zinc-400">Case-sensitive</span>
              </div>
              <div className="relative rounded-xl bg-[#eef3f8] border border-slate-200/90 focus-within:border-construct-orange focus-within:bg-white focus-within:ring-2 focus-within:ring-construct-orange/15 transition-all">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-xs text-zinc-900 bg-transparent rounded-xl focus:outline-none font-medium placeholder:text-zinc-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#1e2022] hover:bg-black text-white text-xs font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-[0.99]"
            >
              <KeyRound className="w-4 h-4 text-construct-orange shrink-0" />
              <span>{isLoading ? "Authenticating..." : "Sign In to Site Portal"}</span>
            </button>
          </form>

          {/* Site Access Policy Section */}
          <div className="mt-7 pt-5 border-t border-slate-200/90">
            <p className="text-xs font-bold text-zinc-800 mb-2 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-construct-orange shrink-0" />
              <span>Site Access Policy:</span>
            </p>
            <ul className="text-[11px] text-zinc-600 space-y-1.5 list-disc pl-4 leading-relaxed">
              <li>
                <strong className="text-zinc-900 font-bold">Super Admin</strong> has complete oversight over all active projects and assigns Project Managers with login credentials.
              </li>
              <li>
                <strong className="text-zinc-900 font-bold">Project Managers</strong> only access their assigned project(s) and manage Site Engineers and Site Supervisors.
              </li>
              <li>
                <strong className="text-zinc-900 font-bold">Engineers & Supervisors</strong> sign in with credentials issued by Admin or PM to submit shift records, photos/videos, and attendance.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
