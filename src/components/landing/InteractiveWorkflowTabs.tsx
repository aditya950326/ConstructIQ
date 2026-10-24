"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Camera,
  AlertTriangle,
  Boxes,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Clock,
  Sparkles,
  ChevronRight,
  MapPin,
  Calendar,
  FileText,
  DollarSign,
  TrendingUp,
} from "lucide-react";

interface TabDefinition {
  id: string;
  label: string;
  subtitle: string;
  icon: any;
  badge: string;
  badgeColor: string;
}

const TABS: TabDefinition[] = [
  {
    id: "supervisor",
    label: "Site Supervisor",
    subtitle: "Attendance, Work Photos & Bills",
    icon: Users,
    badge: "Field Authority",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    id: "engineer",
    label: "Site Engineer",
    subtitle: "Daily Logs & Photographic Evidence",
    icon: Camera,
    badge: "Field QA & Verification",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  {
    id: "manager",
    label: "Project Manager",
    subtitle: "Explainable Risk & Approvals",
    icon: AlertTriangle,
    badge: "Site Intelligence",
    badgeColor: "bg-orange-100 text-orange-800 border-orange-200",
  },
  {
    id: "store",
    label: "Materials & Stores",
    subtitle: "Zero-Negative Stock Ledger",
    icon: Boxes,
    badge: "Traceable Supply Chain",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
  },
];

export function InteractiveWorkflowTabs() {
  const [activeTab, setActiveTab] = useState<string>("supervisor");

  return (
    <div className="w-full">
      {/* Tab Switcher with spring-animated active indicator and hover effects */}
      <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 bg-[#F0F1ED] rounded-2xl border border-construct-border max-w-4xl mx-auto shadow-inner">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={`relative px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors z-10 ${
                isActive
                  ? "text-construct-text shadow-sm"
                  : "text-construct-secondary hover:text-construct-text"
              }`}
            >
              {/* Active Tab Sliding Background Pill */}
              {isActive && (
                <motion.div
                  layoutId="activeWorkflowTabPill"
                  className="absolute inset-0 bg-white rounded-xl border border-construct-border/80 shadow-sm -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}

              <Icon
                className={`w-4 h-4 transition-colors ${
                  isActive ? "text-construct-orange" : "text-construct-secondary"
                }`}
              />
              <span className="font-heading font-bold">{tab.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Animated Tab Content Container */}
      <div className="mt-8 max-w-5xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === "supervisor" && (
            <motion.div
              key="supervisor"
              initial={{ opacity: 0, y: 16, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.99 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="p-8 rounded-3xl border border-blue-200/80 bg-white shadow-card relative overflow-hidden"
            >
              {/* Top Row with Badge & Staggered Open Headline */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-construct-border/60">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                      Site Supervisor Desk • Ramesh Patil
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live On-Site
                    </span>
                  </div>

                  {/* Open Animation on Title */}
                  <motion.h3
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    className="text-2xl font-heading font-extrabold text-[#111315]"
                  >
                    3 Dedicated Field Responsibilities
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.18, duration: 0.4 }}
                    className="text-xs text-construct-secondary mt-1"
                  >
                    Site supervisors log attendance headcounts, upload work evidence photos, and submit local site receipts without complex ERP overhead.
                  </motion.p>
                </div>

                <Link
                  href="/app/supervisor"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm hover:shadow transition-all shrink-0 group"
                >
                  <span>Launch Supervisor Desk</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* 3 Interactive Responsibility Cards with Hover Spring Lift */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
                {/* Work 1: Attendance */}
                <motion.div
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 350, damping: 22 }}
                  className="p-5 rounded-2xl bg-blue-50/40 border border-blue-100/90 shadow-subtle group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Users className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-mono font-bold text-blue-700">WORK 01</span>
                  </div>
                  <h4 className="font-heading font-bold text-sm text-[#111315] group-hover:text-blue-700 transition-colors">
                    Daily Worker Attendance
                  </h4>
                  <p className="text-xs text-construct-secondary mt-1.5 leading-relaxed">
                    Record headcounts for shuttering carpenters, bar benders, masons, and helpers per shift with contractor tags.
                  </p>

                  <div className="mt-4 pt-3 border-t border-blue-100/80 flex items-center justify-between text-[11px]">
                    <span className="font-mono text-construct-secondary">Today's Headcount:</span>
                    <span className="font-mono font-bold text-blue-900 bg-white px-2 py-0.5 rounded border border-blue-200">
                      48 Workers
                    </span>
                  </div>
                </motion.div>

                {/* Work 2: Work Photos */}
                <motion.div
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 350, damping: 22 }}
                  className="p-5 rounded-2xl bg-orange-50/40 border border-orange-100/90 shadow-subtle group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-100 text-construct-orange flex items-center justify-center group-hover:bg-construct-orange group-hover:text-white transition-colors">
                      <Camera className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-mono font-bold text-construct-orange">WORK 02</span>
                  </div>
                  <h4 className="font-heading font-bold text-sm text-[#111315] group-hover:text-construct-orange transition-colors">
                    Upload Work Done Photos
                  </h4>
                  <p className="text-xs text-construct-secondary mt-1.5 leading-relaxed">
                    Snap and attach physical progress photos directly linked to WBS activity nodes before concrete pouring.
                  </p>

                  <div className="mt-4 pt-3 border-t border-orange-100/80 flex items-center justify-between text-[11px]">
                    <span className="font-mono text-construct-secondary">Recent Upload:</span>
                    <span className="font-mono font-bold text-orange-900 bg-white px-2 py-0.5 rounded border border-orange-200">
                      Col C1-C8 Rebar
                    </span>
                  </div>
                </motion.div>

                {/* Work 3: Site Bills */}
                <motion.div
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 350, damping: 22 }}
                  className="p-5 rounded-2xl bg-emerald-50/40 border border-emerald-100/90 shadow-subtle group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-mono font-bold text-emerald-700">WORK 03</span>
                  </div>
                  <h4 className="font-heading font-bold text-sm text-[#111315] group-hover:text-emerald-700 transition-colors">
                    Upload Bills & Challans
                  </h4>
                  <p className="text-xs text-construct-secondary mt-1.5 leading-relaxed">
                    Submit petty cash vouchers, crane diesel fuel slips, and hardware delivery challans for PM sign-off.
                  </p>

                  <div className="mt-4 pt-3 border-t border-emerald-100/80 flex items-center justify-between text-[11px]">
                    <span className="font-mono text-construct-secondary">Pending Audit:</span>
                    <span className="font-mono font-bold text-emerald-900 bg-white px-2 py-0.5 rounded border border-emerald-200">
                      ₹18,500 Fuel
                    </span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {activeTab === "engineer" && (
            <motion.div
              key="engineer"
              initial={{ opacity: 0, y: 16, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.99 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="p-8 rounded-3xl border border-emerald-200/80 bg-white shadow-card relative overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-construct-border/60">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Field Engineering & QA • Kalyani Jadhav
                    </span>
                  </div>
                  <motion.h3
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    className="text-2xl font-heading font-extrabold text-[#111315]"
                  >
                    Evidence-Linked Daily Progress Logs
                  </motion.h3>
                  <p className="text-xs text-construct-secondary mt-1">
                    Progress is never approved on blind trust. Every entry requires physical slump test sheets, cube test reports, or geocoded photos.
                  </p>
                </div>

                <Link
                  href="/app/projects/b0000000-0000-0000-0000-000000000001/daily-logs"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm hover:shadow transition-all shrink-0 group"
                >
                  <span>Open Daily Site Logs</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
                <motion.div
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 350, damping: 22 }}
                  className="p-5 rounded-2xl bg-construct-bg border border-construct-border shadow-subtle group"
                >
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Step 1
                  </span>
                  <h4 className="font-heading font-bold text-sm text-[#111315] mt-3 group-hover:text-emerald-700 transition-colors">
                    Report Logged Work
                  </h4>
                  <p className="text-xs text-construct-secondary mt-1.5 leading-relaxed">
                    Input measured field quantity against specific WBS element (e.g. 6 Columns poured, 28.5 m³).
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 350, damping: 22 }}
                  className="p-5 rounded-2xl bg-construct-bg border border-construct-border shadow-subtle group"
                >
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Step 2
                  </span>
                  <h4 className="font-heading font-bold text-sm text-[#111315] mt-3 group-hover:text-emerald-700 transition-colors">
                    Attach Verified Evidence
                  </h4>
                  <p className="text-xs text-construct-secondary mt-1.5 leading-relaxed">
                    Upload slump test (110mm), cube compression certificate, and timestamped pre-pour photo.
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 350, damping: 22 }}
                  className="p-5 rounded-2xl bg-construct-bg border border-construct-border shadow-subtle group"
                >
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Step 3
                  </span>
                  <h4 className="font-heading font-bold text-sm text-[#111315] mt-3 group-hover:text-emerald-700 transition-colors">
                    Deduct Material Inventory
                  </h4>
                  <p className="text-xs text-construct-secondary mt-1.5 leading-relaxed">
                    Automatically triggers material issuance ledger entry, preventing unverified material consumption.
                  </p>
                </motion.div>
              </div>
            </motion.div>
          )}

          {activeTab === "manager" && (
            <motion.div
              key="manager"
              initial={{ opacity: 0, y: 16, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.99 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="p-8 rounded-3xl border border-orange-200/80 bg-white shadow-card relative overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-construct-border/60">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200">
                      Project Management & Schedule Risk • Arjun Gundge
                    </span>
                  </div>
                  <motion.h3
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    className="text-2xl font-heading font-extrabold text-[#111315]"
                  >
                    Explainable Schedule Delay Risk Engine
                  </motion.h3>
                  <p className="text-xs text-construct-secondary mt-1">
                    Deterministic, auditable rule execution explains WHY delays occur (material buffer shortages, blocked predecessor dependencies).
                  </p>
                </div>

                <Link
                  href="/app/projects/b0000000-0000-0000-0000-000000000001/risk"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-construct-orange hover:bg-construct-orangeHover text-white text-xs font-semibold shadow-sm hover:shadow transition-all shrink-0 group"
                >
                  <span>Explore Risk Rules</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
                <motion.div
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 350, damping: 22 }}
                  className="p-5 rounded-2xl bg-orange-50/30 border border-orange-100 shadow-subtle group"
                >
                  <span className="text-[10px] font-mono font-bold text-construct-orange uppercase tracking-wider">
                    RULE-01
                  </span>
                  <h4 className="font-heading font-bold text-sm text-[#111315] mt-2 group-hover:text-construct-orange transition-colors">
                    Overdue Critical Milestone
                  </h4>
                  <p className="text-xs text-construct-secondary mt-1 leading-relaxed">
                    Flags activities past planned end date with unverified quantities and assigns risk factor.
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 350, damping: 22 }}
                  className="p-5 rounded-2xl bg-orange-50/30 border border-orange-100 shadow-subtle group"
                >
                  <span className="text-[10px] font-mono font-bold text-construct-orange uppercase tracking-wider">
                    RULE-03
                  </span>
                  <h4 className="font-heading font-bold text-sm text-[#111315] mt-2 group-hover:text-construct-orange transition-colors">
                    Dependency Predecessor Lag
                  </h4>
                  <p className="text-xs text-construct-secondary mt-1 leading-relaxed">
                    Warns when downstream activities are blocked by delayed predecessor work.
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 350, damping: 22 }}
                  className="p-5 rounded-2xl bg-orange-50/30 border border-orange-100 shadow-subtle group"
                >
                  <span className="text-[10px] font-mono font-bold text-construct-orange uppercase tracking-wider">
                    RULE-04
                  </span>
                  <h4 className="font-heading font-bold text-sm text-[#111315] mt-2 group-hover:text-construct-orange transition-colors">
                    Material Buffer Depletion
                  </h4>
                  <p className="text-xs text-construct-secondary mt-1 leading-relaxed">
                    Identifies critical items (e.g. TMT Steel Rebar &lt; 25T buffer) that will stall next week's casting.
                  </p>
                </motion.div>
              </div>
            </motion.div>
          )}

          {activeTab === "store" && (
            <motion.div
              key="store"
              initial={{ opacity: 0, y: 16, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.99 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="p-8 rounded-3xl border border-purple-200/80 bg-white shadow-card relative overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-construct-border/60">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                      Material Store & Logistics Ledger
                    </span>
                  </div>
                  <motion.h3
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    className="text-2xl font-heading font-extrabold text-[#111315]"
                  >
                    Zero-Negative Inventory Enforcement
                  </motion.h3>
                  <p className="text-xs text-construct-secondary mt-1">
                    Every batch has delivery challan verification, supplier traceability, and programmatic rejection of negative balances.
                  </p>
                </div>

                <Link
                  href="/app/projects/b0000000-0000-0000-0000-000000000001/materials"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-sm hover:shadow transition-all shrink-0 group"
                >
                  <span>View Material Ledger</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
                <motion.div
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 350, damping: 22 }}
                  className="p-5 rounded-2xl bg-purple-50/30 border border-purple-100 shadow-subtle group"
                >
                  <span className="text-[10px] font-mono font-bold text-purple-700 uppercase tracking-wider">
                    TRACEABILITY
                  </span>
                  <h4 className="font-heading font-bold text-sm text-[#111315] mt-2 group-hover:text-purple-700 transition-colors">
                    Gate Inward Verification
                  </h4>
                  <p className="text-xs text-construct-secondary mt-1 leading-relaxed">
                    Inspect physical delivery challans and test reports upon arrival before stock is credited.
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 350, damping: 22 }}
                  className="p-5 rounded-2xl bg-purple-50/30 border border-purple-100 shadow-subtle group"
                >
                  <span className="text-[10px] font-mono font-bold text-purple-700 uppercase tracking-wider">
                    INTEGRITY
                  </span>
                  <h4 className="font-heading font-bold text-sm text-[#111315] mt-2 group-hover:text-purple-700 transition-colors">
                    Zero-Negative Balance
                  </h4>
                  <p className="text-xs text-construct-secondary mt-1 leading-relaxed">
                    Repository automatically rejects material issues if requested quantity exceeds available physical stock.
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 350, damping: 22 }}
                  className="p-5 rounded-2xl bg-purple-50/30 border border-purple-100 shadow-subtle group"
                >
                  <span className="text-[10px] font-mono font-bold text-purple-700 uppercase tracking-wider">
                    SAFETY BUFFERS
                  </span>
                  <h4 className="font-heading font-bold text-sm text-[#111315] mt-2 group-hover:text-purple-700 transition-colors">
                    Buffer Threshold Alerts
                  </h4>
                  <p className="text-xs text-construct-secondary mt-1 leading-relaxed">
                    Automatic notification dispatch to procurement whenever stock dips below safety reserve level.
                  </p>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
