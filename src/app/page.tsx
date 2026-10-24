"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { inView, animate } from "motion";
import {
  ArrowRight,
  ShieldCheck,
  Search,
  CheckCircle2,
  Camera,
  Boxes,
  AlertTriangle,
  Users,
  Receipt,
  HardHat,
  Briefcase,
  UserCheck,
  Building2,
  FileSpreadsheet,
  X,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { InteractiveWorkflowTabs } from "@/components/landing/InteractiveWorkflowTabs";

export default function LandingPage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Initialize inView animations for text, hero elements, and scroll triggers
  useEffect(() => {
    // 1. Hero text lines staggered reveal using inView on container
    const stopHero = inView(
      "#hero-headline",
      (element) => {
        const lines = element.querySelectorAll(".hero-text-line");
        lines.forEach((line, index) => {
          animate(
            line as HTMLElement,
            { opacity: [0, 1], transform: ["translateY(36px)", "translateY(0px)"] },
            {
              duration: 0.7,
              delay: index * 0.14,
              ease: [0.22, 1, 0.36, 1],
            }
          );
        });

        // Subtitle & CTAs
        const sub = document.getElementById("hero-subtitle");
        if (sub) {
          animate(
            sub,
            { opacity: [0, 1], transform: ["translateY(20px)", "translateY(0px)"] },
            { duration: 0.6, delay: 0.45, ease: [0.22, 1, 0.36, 1] }
          );
        }

        const ctas = document.getElementById("hero-ctas");
        if (ctas) {
          animate(
            ctas,
            { opacity: [0, 1], transform: ["translateY(20px)", "translateY(0px)"] },
            { duration: 0.6, delay: 0.6, ease: [0.22, 1, 0.36, 1] }
          );
        }

        const badges = document.getElementById("hero-badges");
        if (badges) {
          animate(
            badges,
            { opacity: [0, 1], transform: ["translateY(16px)", "translateY(0px)"] },
            { duration: 0.5, delay: 0.75 }
          );
        }
      },
      { amount: 0.1 }
    );

    // 2. Intelligent Architecture Pillar Cards: staggered scroll reveal
    const stopPillars = inView(
      ".pillar-card",
      (element) => {
        const animation = animate(
          element as HTMLElement,
          { opacity: [0, 1], transform: ["translateY(32px) scale(0.97)", "translateY(0px) scale(1)"] },
          { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
        );

        // Optional exit callback when leaving viewport
        return () => {
          animation.stop();
        };
      },
      { amount: 0.2 }
    );

    // 3. Role Authority Cards: Scroll-triggered enter & leave callbacks
    const stopRoles = inView(
      ".role-card",
      (element) => {
        animate(
          element as HTMLElement,
          { opacity: [0.4, 1], transform: ["translateY(28px)", "translateY(0px)"] },
          { duration: 0.65, ease: [0.22, 1, 0.36, 1] }
        );

        // Re-triggers or stops cleanly when scrolling out of viewport
        return () => {
          animate(
            element as HTMLElement,
            { opacity: 0.4, transform: "translateY(16px)" },
            { duration: 0.3 }
          );
        };
      },
      { amount: 0.25 }
    );

    // 4. Section titles scroll-triggered text animations
    const stopHeadings = inView(
      ".scroll-header",
      (element) => {
        animate(
          element as HTMLElement,
          { opacity: [0, 1], transform: ["translateY(24px)", "translateY(0px)"] },
          { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
        );
      },
      { amount: 0.3 }
    );

    return () => {
      stopHero();
      stopPillars();
      stopRoles();
      stopHeadings();
    };
  }, []);

  const searchResults = [
    { title: "Supervisor Field Desk", desc: "Upload daily attendance, work photos & bills", href: "/app/supervisor" },
    { title: "Riverside Skyline Tower A", desc: "32-Storey residential high-rise project dashboard", href: "/app/projects/b0000000-0000-0000-0000-000000000001" },
    { title: "Explainable Delay Risk Engine", desc: "Predictive rule-based schedule risk analytics", href: "/app/projects/b0000000-0000-0000-0000-000000000001/risk" },
    { title: "Daily Site Logs & Evidence", desc: "Field records with geocoded photos and test sheets", href: "/app/projects/b0000000-0000-0000-0000-000000000001/daily-logs" },
    { title: "Material Ledger & Stock", desc: "Zero-negative inventory control and batch traceability", href: "/app/projects/b0000000-0000-0000-0000-000000000001/materials" },
  ].filter(
    (item) =>
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#1A1D20] selection:bg-construct-orange/20 selection:text-construct-text">
      {/* Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-24 px-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-construct-border w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-construct-border flex items-center gap-3">
              <Search className="w-5 h-5 text-construct-secondary" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search modules, projects, or risk rules..."
                className="w-full text-sm outline-none text-construct-text placeholder:text-construct-secondary"
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-1 rounded-md text-construct-secondary hover:text-construct-text hover:bg-construct-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto p-2 divide-y divide-construct-border/40">
              {searchResults.length === 0 ? (
                <div className="p-6 text-center text-xs text-construct-secondary">
                  No matching platform features found for "{searchQuery}".
                </div>
              ) : (
                searchResults.map((res) => (
                  <Link
                    key={res.title}
                    href={res.href}
                    onClick={() => setIsSearchOpen(false)}
                    className="p-3 flex items-center justify-between hover:bg-construct-muted/60 rounded-lg transition-colors group"
                  >
                    <div>
                      <p className="text-xs font-bold text-construct-text group-hover:text-construct-orange">
                        {res.title}
                      </p>
                      <p className="text-[11px] text-construct-secondary mt-0.5">{res.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-construct-secondary group-hover:translate-x-1 transition-transform" />
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top Header - Pixel-perfect match to reference mockup */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#ECECE9] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo with BUILD WITH CLARITY */}
          <Link href="/" className="shrink-0">
            <Logo size="md" subtitle="BUILD WITH CLARITY" />
          </Link>

          {/* Centered Navigation Links with Spring Hover Effects */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#4A5056]">
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="flex flex-col items-center"
            >
              <span className="font-semibold text-[#111315] cursor-pointer">Home</span>
              <span className="w-6 h-[2px] bg-construct-orange rounded-full mt-1" />
            </motion.div>
            <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
              <Link href="/app/projects" className="hover:text-construct-orange transition-colors">
                Projects
              </Link>
            </motion.div>
            <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
              <a href="#solutions" className="hover:text-construct-orange transition-colors">
                Solutions
              </a>
            </motion.div>
            <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
              <a href="#resources" className="hover:text-construct-orange transition-colors">
                Workflows
              </a>
            </motion.div>
            <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
              <a href="#research" className="hover:text-construct-orange transition-colors">
                Research
              </a>
            </motion.div>
            <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
              <a href="#contact" className="hover:text-construct-orange transition-colors">
                Contact
              </a>
            </motion.div>
          </nav>

          {/* Right Header Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search ConstructIQ"
              className="p-2 text-[#4A5056] hover:text-[#111315] hover:bg-construct-muted/60 rounded-full transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
            <Link
              href="/login"
              className="text-xs sm:text-sm font-medium text-[#111315] hover:text-construct-orange transition-colors px-2 py-1"
            >
              Log In
            </Link>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
              <Link
                href="/login"
                className="rounded-full px-5 py-2.5 bg-[#0D0F11] text-white text-xs font-semibold hover:bg-black transition-all flex items-center gap-1.5 shadow-sm group"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Hero Section - Matched to Reference Mockup & Real Background Artwork */}
      <section className="relative min-h-[85vh] flex items-center border-b border-[#ECECE9] overflow-hidden bg-[#EAEAE6]">
        {/* Architectural Background Drawing */}
        <div
          className="absolute inset-0 bg-no-repeat bg-cover bg-right sm:bg-[center_right] pointer-events-none"
          style={{ backgroundImage: `url('/images/hero-art.jpg')` }}
        />

        {/* Soft, seamless gradient mask to guarantee high contrast on the left side */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#F6F6F3] via-[#F6F6F3]/95 sm:via-[#F6F6F3]/85 lg:via-[#F6F6F3]/65 to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 sm:px-12 py-20 relative z-10 w-full grid lg:grid-cols-12 items-center">
          <div className="lg:col-span-7 xl:col-span-6">
            {/* Eyebrow */}
            <div className="flex items-center gap-3 mb-6">
              <span className="w-8 h-[2px] bg-construct-orange rounded-full inline-block" />
              <span className="text-[11px] sm:text-xs font-mono font-bold tracking-[0.22em] text-[#33373D] uppercase">
                CONSTRUCTION INTELLIGENCE PLATFORM
              </span>
            </div>

            {/* Main Headline with inView Line-by-Line Reveals */}
            <h1
              id="hero-headline"
              className="text-5xl sm:text-6xl lg:text-[76px] font-heading font-black tracking-tight text-[#111315] leading-[1.05]"
            >
              <span className="block overflow-hidden pb-1">
                <span className="hero-text-line block will-change-transform">From Plan</span>
              </span>
              <span className="block overflow-hidden pb-1">
                <span className="hero-text-line block will-change-transform">to Progress,</span>
              </span>
              <span className="block overflow-hidden pb-1">
                <span className="hero-text-line block will-change-transform">
                  All in One Place<span className="text-construct-orange">.</span>
                </span>
              </span>
            </h1>

            {/* Subtitle with inView Animation */}
            <p
              id="hero-subtitle"
              className="mt-6 text-base sm:text-lg text-[#4E545C] max-w-xl font-normal leading-relaxed will-change-transform"
            >
              ConstructIQ connects project planning, on-site execution, materials, quality, safety and real-time insights so your construction projects move forward with clarity.
            </p>

            {/* Call to Actions with inView Animation */}
            <div id="hero-ctas" className="mt-8 flex flex-wrap items-center gap-4 will-change-transform">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#0D0F11] text-white text-xs sm:text-sm font-semibold hover:bg-black transition-all shadow-md group"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/app/supervisor"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white/95 backdrop-blur-sm border border-construct-border text-[#111315] text-xs sm:text-sm font-semibold hover:bg-white hover:border-construct-orange transition-all shadow-subtle group"
              >
                <UserCheck className="w-4 h-4 text-construct-orange" />
                <span>Open Supervisor Field Desk</span>
              </Link>
            </div>

            {/* Quick Field Role Badges with inView Animation */}
            <div
              id="hero-badges"
              className="mt-10 pt-6 border-t border-construct-border/60 flex flex-wrap items-center gap-6 text-xs text-[#5A6068] will-change-transform"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Daily Worker Attendance</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Work Done Photos</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Site Bills & Challans</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Core Pillars Section */}
      <section id="solutions" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-[10px] font-mono font-bold uppercase tracking-wider text-construct-orange mb-3">
            <Sparkles className="w-3 h-3 text-construct-orange animate-spin" />
            <span>inView Scroll-Triggered Animations Active</span>
          </div>
          <h2 className="scroll-header text-3xl font-heading font-extrabold text-[#111315] will-change-transform">
            Built for Site Reality, Not Optimistic Spreadsheets
          </h2>
          <p className="text-sm text-construct-secondary mt-3">
            Every field update is anchored to physical proof, ensuring quantities, schedules, and costs are audit-ready.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="pillar-card p-6 rounded-2xl border border-construct-border bg-white shadow-subtle hover:shadow-card transition-shadow will-change-transform">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 text-construct-orange flex items-center justify-center mb-4">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-base text-[#111315]">Evidence-Linked Progress</h3>
            <p className="text-xs text-construct-secondary mt-2 leading-relaxed">
              No reported work is approved without timestamped photographs, inspection sheets, or slump tests.
            </p>
          </div>

          <div className="pillar-card p-6 rounded-2xl border border-construct-border bg-white shadow-subtle hover:shadow-card transition-shadow will-change-transform">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mb-4">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-base text-[#111315]">Configurable Hierarchies</h3>
            <p className="text-xs text-construct-secondary mt-2 leading-relaxed">
              Adaptable WBS from multi-tower residential complexes down to highway chainages and culvert sections.
            </p>
          </div>

          <div className="pillar-card p-6 rounded-2xl border border-construct-border bg-white shadow-subtle hover:shadow-card transition-shadow will-change-transform">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mb-4">
              <Boxes className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-base text-[#111315]">Strict Inventory Ledger</h3>
            <p className="text-xs text-construct-secondary mt-2 leading-relaxed">
              Enforces zero-negative inventory. Prevents untracked material leakage and links receipts to activity consumption.
            </p>
          </div>

          <div className="pillar-card p-6 rounded-2xl border border-construct-border bg-white shadow-subtle hover:shadow-card transition-shadow will-change-transform">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-base text-[#111315]">Explainable Risk Engine</h3>
            <p className="text-xs text-construct-secondary mt-2 leading-relaxed">
              Transparent, deterministic schedule risk alerts that explain exact root causes and suggest corrective actions.
            </p>
          </div>
        </div>
      </section>

      {/* Role-Based Workflow Section (Highlighting Site Supervisor Authority & Workflows) */}
      <section id="resources" className="py-20 px-6 bg-white border-y border-[#ECECE9]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-construct-orange">
              ROLE CLARITY & INTERACTIVE WORKFLOWS
            </span>
            <h2 className="scroll-header text-3xl font-heading font-extrabold text-[#111315] mt-2 will-change-transform">
              Tailored Authority for Field & Office
            </h2>
            <p className="text-sm text-construct-secondary mt-3">
              Switch between roles below to preview open animations, live headcounts, evidence attachments, and risk rule evaluations.
            </p>
          </div>

          {/* Interactive Animated Tabs Component */}
          <InteractiveWorkflowTabs />
        </div>
      </section>



      {/* Clean Footer */}
      <footer id="contact" className="border-t border-[#ECECE9] bg-white py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-construct-secondary">
          <div className="flex items-center gap-3">
            <Logo size="sm" subtitle="BUILD WITH CLARITY" />
            <span className="text-construct-border">|</span>
            <span>AI-Based Construction Site Management & Intelligence</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-construct-text transition-colors">
              Sign In
            </Link>
            <Link href="/app/supervisor" className="hover:text-construct-text transition-colors">
              Supervisor Desk
            </Link>
            <Link href="/app/overview" className="hover:text-construct-text transition-colors">
              Platform Overview
            </Link>
          </div>

          <p className="font-mono text-[11px] text-construct-secondary">
            ConstructIQ © 2026 • MIT Chh. Sambhajinagar
          </p>
        </div>
      </footer>
    </div>
  );
}

