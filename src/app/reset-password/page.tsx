"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSent(true);
  };

  return (
    <div className="min-h-screen bg-construct-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-blueprint-grid">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-block">
          <Logo size="lg" />
        </Link>
        <h2 className="mt-4 text-2xl font-heading font-extrabold text-construct-text tracking-tight">
          Reset Password
        </h2>
        <p className="mt-1 text-xs text-construct-secondary">
          Enter your registered project account email to receive a recovery link.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-construct-surface py-8 px-6 sm:px-8 border border-construct-border shadow-card sm:rounded-xl">
          {isSent ? (
            <div className="text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="font-heading font-bold text-sm text-construct-text">
                Password Reset Instructions Sent
              </h3>
              <p className="text-xs text-construct-secondary">
                We've sent password reset guidance to <strong className="font-mono text-construct-text">{email}</strong>.
              </p>
              <div className="pt-4">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg bg-construct-text text-white text-xs font-bold hover:bg-black transition-colors inline-block"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-construct-text mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-construct-secondary absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@constructiq.io"
                    className="w-full pl-9 pr-3 py-2 border border-construct-border rounded-lg text-xs bg-construct-bg focus:outline-none focus:border-construct-orange"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-lg bg-construct-orange text-white text-xs font-bold hover:bg-construct-orangeHover transition-colors"
              >
                Send Reset Link
              </button>

              <div className="pt-2 text-center">
                <Link href="/login" className="text-xs text-construct-secondary hover:text-construct-text font-medium">
                  ← Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
