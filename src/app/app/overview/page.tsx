"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { repository } from "@/lib/data/repository";
import { Project, UserRole } from "@/types/database";
import { RoleAnalyticsDashboard } from "@/components/dashboard/RoleAnalyticsDashboard";
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  Package,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Building2,
  DollarSign,
  AlertCircle,
  FileCheck,
} from "lucide-react";

export default function OverviewPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>("super_admin");
  const [metrics, setMetrics] = useState<any>(null);
  const [risks, setRisks] = useState<any[]>([]);

  useEffect(() => {
    const prjs = repository.getProjects();
    setProjects(prjs);
    const user = repository.getCurrentUser();
    if (user) {
      setCurrentUserRole(user.role);
    }
    if (prjs.length > 0) {
      const pId = prjs[0].id;
      setSelectedProjectId(pId);
      setMetrics(repository.getProjectMetrics(pId));
      setRisks(repository.getProjectDelayRisks(pId));
    }
  }, []);

  const handleProjectChange = (pId: string) => {
    setSelectedProjectId(pId);
    setMetrics(repository.getProjectMetrics(pId));
    setRisks(repository.getProjectDelayRisks(pId));
  };

  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  return (
    <AppShell
      title="Platform Overview"
      subtitle="Executive Site Intelligence & Operational State"
      activeProjectId={selectedProjectId}
      headerActions={
        <div className="flex items-center gap-2">
          <select
            value={selectedProjectId}
            onChange={(e) => handleProjectChange(e.target.value)}
            className="text-xs font-mono font-medium py-1.5 px-3 rounded-lg border border-construct-border bg-construct-surface text-construct-text focus:outline-none focus:border-construct-orange"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
        </div>
      }
    >
      {/* 5 Core Operational Questions Banner */}
      <div className="bg-construct-surface border border-construct-border rounded-xl p-5 shadow-subtle">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-construct-border">
          <div>
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-construct-orange">
              INTELLIGENCE SUMMARY • {activeProject?.code}
            </span>
            <h2 className="text-xl font-heading font-extrabold text-construct-text mt-0.5">
              {activeProject?.name}
            </h2>
            <p className="text-xs text-construct-secondary mt-1">
              Client: <span className="font-medium text-construct-text">{activeProject?.client}</span> • Location: {activeProject?.location}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/app/projects/${selectedProjectId}/daily-logs`}
              className="px-3.5 py-2 rounded-lg bg-construct-orange text-white text-xs font-semibold hover:bg-construct-orangeHover transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>+ Record Daily Log</span>
            </Link>
            <Link
              href={`/app/projects/${selectedProjectId}/reports`}
              className="px-3.5 py-2 rounded-lg border border-construct-border bg-construct-bg text-xs font-medium text-construct-text hover:bg-construct-muted transition-colors"
            >
              Generate Report
            </Link>
          </div>
        </div>

        {/* Primary Health KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
          <div className="p-3.5 rounded-lg bg-construct-bg border border-construct-border/60">
            <div className="flex items-center justify-between text-xs text-construct-secondary">
              <span className="font-mono">VERIFIED PROGRESS</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-heading font-extrabold text-construct-text">
                {metrics?.actualPercent || 0}%
              </span>
              <span className="text-xs font-mono text-construct-secondary">
                vs {metrics?.plannedPercent || 0}% planned
              </span>
            </div>
            <div className="w-full bg-construct-border h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${metrics?.actualPercent || 0}%` }}
              />
            </div>
            <p className="text-[10px] font-mono text-construct-secondary mt-1.5">
              {metrics?.variancePercent < 0 ? (
                <span className="text-rose-600 font-bold">{metrics?.variancePercent}% behind schedule</span>
              ) : (
                <span className="text-emerald-700 font-bold">+{metrics?.variancePercent}% ahead</span>
              )} (weighted activity basis)
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-construct-bg border border-construct-border/60">
            <div className="flex items-center justify-between text-xs text-construct-secondary">
              <span className="font-mono">SCHEDULE RISKS</span>
              <AlertTriangle className="w-4 h-4 text-construct-orange" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-heading font-extrabold text-construct-orange">
                {metrics?.highRiskCount || 0}
              </span>
              <span className="text-xs text-construct-secondary font-mono">critical/high alerts</span>
            </div>
            <p className="text-[10px] text-construct-secondary mt-3">
              {metrics?.overdueCount || 0} activities overdue beyond planned finish date.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-construct-bg border border-construct-border/60">
            <div className="flex items-center justify-between text-xs text-construct-secondary">
              <span className="font-mono">MATERIAL ALERTS</span>
              <Package className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-heading font-extrabold text-amber-700">
                {metrics?.lowStockCount || 0}
              </span>
              <span className="text-xs text-construct-secondary font-mono">below buffer threshold</span>
            </div>
            <p className="text-[10px] text-construct-secondary mt-3">
              Zero negative inventory strictly enforced by ledger.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-construct-bg border border-construct-border/60">
            <div className="flex items-center justify-between text-xs text-construct-secondary">
              <span className="font-mono">BUDGET CONSUMPTION</span>
              <DollarSign className="w-4 h-4 text-construct-text" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-heading font-extrabold text-construct-text">
                {metrics?.budgetConsumedPercent || 0}%
              </span>
              <span className="text-xs text-construct-secondary font-mono">
                of ₹{(activeProject?.approved_budget / 10000000).toFixed(2)} Cr
              </span>
            </div>
            <div className="w-full bg-construct-border h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-construct-text h-full rounded-full transition-all duration-500"
                style={{ width: `${metrics?.budgetConsumedPercent || 0}%` }}
              />
            </div>
            <p className="text-[10px] font-mono text-construct-secondary mt-1.5">
              ₹{(metrics?.totalExpenses / 100000).toFixed(1)} Lakhs approved expenses
            </p>
          </div>
        </div>
      </div>

      {/* Role-Specific Graphical Analytics Suite */}
      <RoleAnalyticsDashboard
        projectId={selectedProjectId}
        role={currentUserRole}
        project={activeProject}
      />

      {/* Main Grid: Engineer Next-Action Panel & Explainable Delay Risks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Engineer Next-Action Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-construct-surface border border-construct-border rounded-xl p-5 shadow-subtle">
            <div className="flex items-center justify-between pb-3 border-b border-construct-border">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-construct-orange" />
                <h3 className="font-heading font-bold text-sm text-construct-text">
                  Engineer Action Queue (Prioritized Operational Items)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-construct-secondary">
                Rule-driven workflow
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {/* Action Item 1 */}
              <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/40 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-md bg-amber-100 text-amber-700 shrink-0 mt-0.5">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-construct-text">
                        Resolve Material Shortage: TMT Steel Rebar Fe500D
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-200 text-amber-800">
                        URGENT
                      </span>
                    </div>
                    <p className="text-xs text-construct-secondary mt-1">
                      Current yard stock (14.5 Tonnes) is below safety buffer (25.0 Tonnes). Column casting ACT-104 is consuming 2.8 Tonnes/day.
                    </p>
                    <div className="mt-2 text-[11px] font-mono text-construct-secondary">
                      Suggested Action: Expedite Tata Steel dispatch order PO-2026-098.
                    </div>
                  </div>
                </div>
                <Link
                  href={`/app/projects/${selectedProjectId}/materials`}
                  className="px-3 py-1.5 rounded bg-construct-surface border border-construct-border text-xs font-medium text-construct-text hover:bg-construct-muted transition-colors shrink-0 flex items-center gap-1"
                >
                  <span>Inventory</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Action Item 2 */}
              <div className="p-3.5 rounded-lg border border-construct-orange/30 bg-orange-50/40 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-md bg-orange-100 text-construct-orange shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-construct-text">
                        Review Daily Site Log & Sign-Off Reported Progress
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-orange-200 text-construct-orange">
                        PENDING PM
                      </span>
                    </div>
                    <p className="text-xs text-construct-secondary mt-1">
                      Site Engineer Kalyani submitted 4 columns cast with M35 RMC on Oct 23. Attached cube test sampling photo awaiting sign-off.
                    </p>
                    <div className="mt-2 text-[11px] font-mono text-construct-secondary">
                      Suggested Action: Inspect photo evidence and approve to update verified progress ledger.
                    </div>
                  </div>
                </div>
                <Link
                  href={`/app/projects/${selectedProjectId}/daily-logs`}
                  className="px-3 py-1.5 rounded bg-construct-surface border border-construct-border text-xs font-medium text-construct-text hover:bg-construct-muted transition-colors shrink-0 flex items-center gap-1"
                >
                  <span>Review Log</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Action Item 3 */}
              <div className="p-3.5 rounded-lg border border-rose-200 bg-rose-50/40 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-md bg-rose-100 text-rose-700 shrink-0 mt-0.5">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-construct-text">
                        Close Safety Observation: Missing Edge Toe-Boards
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-rose-200 text-rose-800">
                        SAFETY HAZARD
                      </span>
                    </div>
                    <p className="text-xs text-construct-secondary mt-1">
                      High risk observation on Level 01 Deck near Grid A-2 edge. Corrective action due in 24 hours.
                    </p>
                  </div>
                </div>
                <Link
                  href={`/app/projects/${selectedProjectId}/safety`}
                  className="px-3 py-1.5 rounded bg-construct-surface border border-construct-border text-xs font-medium text-construct-text hover:bg-construct-muted transition-colors shrink-0 flex items-center gap-1"
                >
                  <span>Safety Log</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Planned vs Actual Progress Overview */}
          <div className="bg-construct-surface border border-construct-border rounded-xl p-5 shadow-subtle">
            <div className="flex items-center justify-between pb-3 border-b border-construct-border">
              <h3 className="font-heading font-bold text-sm text-construct-text">
                Site Milestones & Physical Verification Status
              </h3>
              <Link
                href={`/app/projects/${selectedProjectId}/progress`}
                className="text-xs text-construct-orange font-medium hover:underline flex items-center gap-1"
              >
                <span>Full Progress Ledger</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="mt-4 space-y-4">
              {repository.getActivities(selectedProjectId).map((act) => {
                const percent = act.planned_quantity > 0 ? Math.round((act.verified_quantity / act.planned_quantity) * 100) : 0;
                return (
                  <div key={act.id} className="p-3 rounded-lg bg-construct-bg border border-construct-border/60">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-construct-text">{act.code}</span>
                        <span className="text-xs text-construct-text font-medium">{act.name}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        act.status === "completed"
                          ? "bg-emerald-100 text-emerald-800"
                          : act.status === "in_progress"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-construct-muted text-construct-secondary"
                      }`}>
                        {act.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs text-construct-secondary font-mono">
                      <span>Verified: {act.verified_quantity} / {act.planned_quantity} {act.unit}</span>
                      <span className="font-bold text-construct-text">{percent}%</span>
                    </div>

                    <div className="w-full bg-construct-border h-2 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          percent === 100 ? "bg-emerald-600" : "bg-construct-orange"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Explainable Delay-Risk Intelligence Alerts */}
        <div className="space-y-6">
          <div className="bg-construct-surface border border-construct-border rounded-xl p-5 shadow-subtle">
            <div className="flex items-center justify-between pb-3 border-b border-construct-border">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-construct-orange" />
                <h3 className="font-heading font-bold text-sm text-construct-text">
                  Delay-Risk Intelligence
                </h3>
              </div>
              <Link
                href={`/app/projects/${selectedProjectId}/risk`}
                className="text-[11px] text-construct-orange font-mono font-bold hover:underline"
              >
                Engine View
              </Link>
            </div>

            <p className="text-xs text-construct-secondary mt-2">
              Deterministic schedule-risk engine grounded on physical quantities, material buffer, and dependencies.
            </p>

            <div className="mt-4 space-y-3">
              {risks.length === 0 ? (
                <div className="p-6 text-center text-xs text-construct-secondary">
                  No active delay risks detected for this project.
                </div>
              ) : (
                risks.map((risk) => (
                  <div
                    key={risk.id}
                    className={`p-3.5 rounded-lg border transition-all ${
                      risk.risk_level === "critical"
                        ? "bg-rose-50/50 border-rose-300"
                        : risk.risk_level === "high"
                        ? "bg-orange-50/50 border-orange-300"
                        : "bg-amber-50/50 border-amber-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-extrabold uppercase ${
                        risk.risk_level === "critical"
                          ? "bg-rose-200 text-rose-900"
                          : risk.risk_level === "high"
                          ? "bg-orange-200 text-orange-900"
                          : "bg-amber-200 text-amber-900"
                      }`}>
                        {risk.risk_level} RISK
                      </span>
                      <span className="text-[10px] font-mono text-construct-secondary">
                        {risk.variance_days > 0 ? `+${risk.variance_days}d variance` : "Schedule impact"}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-construct-text mt-2">
                      {risk.rule_triggered}
                    </h4>

                    <p className="text-[11px] text-construct-secondary mt-1.5 leading-relaxed">
                      {risk.evidence_summary}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-construct-border/50 text-[11px]">
                      <span className="font-mono text-construct-secondary font-semibold block text-[10px]">
                        ENGINEER NEXT ACTION:
                      </span>
                      <span className="text-construct-text font-medium mt-0.5 block">
                        {risk.recommended_action}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-construct-surface border border-construct-border rounded-xl p-5 shadow-subtle">
            <h3 className="font-heading font-bold text-sm text-construct-text pb-2 border-b border-construct-border">
              Direct Module Navigation
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <Link
                href={`/app/projects/${selectedProjectId}/structure`}
                className="p-2.5 rounded-lg border border-construct-border bg-construct-bg hover:bg-construct-muted transition-colors flex items-center justify-between"
              >
                <span>Site Hierarchy</span>
                <ArrowRight className="w-3.5 h-3.5 text-construct-secondary" />
              </Link>
              <Link
                href={`/app/projects/${selectedProjectId}/evidence`}
                className="p-2.5 rounded-lg border border-construct-border bg-construct-bg hover:bg-construct-muted transition-colors flex items-center justify-between"
              >
                <span>Evidence Vault</span>
                <ArrowRight className="w-3.5 h-3.5 text-construct-secondary" />
              </Link>
              <Link
                href={`/app/projects/${selectedProjectId}/materials`}
                className="p-2.5 rounded-lg border border-construct-border bg-construct-bg hover:bg-construct-muted transition-colors flex items-center justify-between"
              >
                <span>Stock Ledger</span>
                <ArrowRight className="w-3.5 h-3.5 text-construct-secondary" />
              </Link>
              <Link
                href={`/app/projects/${selectedProjectId}/quality`}
                className="p-2.5 rounded-lg border border-construct-border bg-construct-bg hover:bg-construct-muted transition-colors flex items-center justify-between"
              >
                <span>QA / Inspections</span>
                <ArrowRight className="w-3.5 h-3.5 text-construct-secondary" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
