"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { repository } from "@/lib/data/repository";
import { Activity, DailyLog, DailyLogActivity } from "@/types/database";
import {
  CheckSquare2,
  TrendingUp,
  AlertTriangle,
  Clock,
  ShieldCheck,
  FileCheck,
  CheckCircle,
  XCircle,
  Eye,
  Layers,
} from "lucide-react";
import {
  ProgressSCurveChart,
  ActivityMilestoneChart,
} from "@/components/charts/AnalyticsCharts";

export default function ProgressVerificationPage() {
  const params = useParams();
  const projectId = (params?.projectId as string) || "b0000000-0000-0000-0000-000000000001";

  const [activities, setActivities] = useState<Activity[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [pendingLogs, setPendingLogs] = useState<DailyLog[]>([]);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = () => {
    setActivities(repository.getActivities(projectId));
    setMetrics(repository.getProjectMetrics(projectId));
    setPendingLogs(repository.getDailyLogs(projectId).filter((l) => l.status === "submitted"));
  };

  const handleReviewLog = (logId: string, action: "approve" | "reject") => {
    const user = repository.getCurrentUser();
    repository.reviewDailyLog(logId, action, user.id, action === "approve" ? "Verified against field evidence and cube samples." : "Rejected due to missing photo verification.");
    loadData();
  };

  const sCurveData = [
    { date: "W1 (Sep 01)", planned: 5, actual: 5, financial: 4 },
    { date: "W2 (Sep 08)", planned: 12, actual: 11, financial: 10 },
    { date: "W3 (Sep 15)", planned: 20, actual: 19, financial: 18 },
    { date: "W4 (Sep 22)", planned: 30, actual: 27, financial: 26 },
    { date: "W5 (Sep 29)", planned: 42, actual: 36, financial: 35 },
    { date: "W6 (Oct 06)", planned: 55, actual: 44, financial: 42 },
    { date: "W7 (Oct 13)", planned: 68, actual: 52, financial: 49 },
    { date: "W8 (Current)", planned: 78, actual: metrics?.actualPercent || 61, financial: metrics?.budgetConsumedPercent || 56 },
  ];

  const activityProgressData = activities.map((act) => {
    const percent = act.planned_quantity > 0 ? Math.round((act.verified_quantity / act.planned_quantity) * 100) : 0;
    return {
      code: act.code,
      name: act.name,
      percent,
      status: act.status,
    };
  });

  return (
    <AppShell
      title="Progress & Verification Sign-Off"
      subtitle="Evidence-Backed Quantity Ledger & Progress Governance"
      activeProjectId={projectId}
    >
      {/* Verification Methodology Notice */}
      <div className="p-4 rounded-xl border border-construct-border bg-construct-surface shadow-subtle flex items-start gap-4">
        <div className="p-2.5 rounded-lg bg-orange-100 text-construct-orange shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-heading font-bold text-sm text-construct-text">
            Physical Quantity Verification Principle
          </h3>
          <p className="text-xs text-construct-secondary mt-1 leading-relaxed">
            ConstructIQ enforces that self-reported contractor submissions do not count as earned physical progress until a qualified Project Manager or Lead Engineer reviews the attached inspection evidence (photos, slump reports, delivery challans) and signs off the record.
          </p>
        </div>
      </div>

      {/* Progress Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl border border-construct-border bg-construct-surface shadow-subtle">
          <span className="text-xs font-mono text-construct-secondary block">VERIFIED ACTUAL PROGRESS</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-heading font-extrabold text-emerald-700">
              {metrics?.actualPercent || 0}%
            </span>
            <span className="text-xs font-mono text-construct-secondary">
              weighted by activity scope
            </span>
          </div>
          <div className="w-full bg-construct-border h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${metrics?.actualPercent || 0}%` }}
            />
          </div>
        </div>

        <div className="p-5 rounded-xl border border-construct-border bg-construct-surface shadow-subtle">
          <span className="text-xs font-mono text-construct-secondary block">PLANNED TARGET PROGRESS</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-heading font-extrabold text-construct-text">
              {metrics?.plannedPercent || 0}%
            </span>
            <span className="text-xs font-mono text-construct-secondary">
              as of reporting date
            </span>
          </div>
          <div className="w-full bg-construct-border h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-construct-text h-full rounded-full transition-all duration-300"
              style={{ width: `${metrics?.plannedPercent || 0}%` }}
            />
          </div>
        </div>

        <div className="p-5 rounded-xl border border-construct-border bg-construct-surface shadow-subtle">
          <span className="text-xs font-mono text-construct-secondary block">VARIANCE & SIGN-OFF QUEUE</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-heading font-extrabold ${metrics?.variancePercent < 0 ? "text-rose-600" : "text-emerald-700"}`}>
              {metrics?.variancePercent > 0 ? `+${metrics?.variancePercent}` : metrics?.variancePercent}%
            </span>
            <span className="text-xs font-mono text-construct-secondary">
              {pendingLogs.length} pending review
            </span>
          </div>
          <p className="text-xs text-construct-secondary mt-3">
            {metrics?.variancePercent < 0 ? "Site operations are lagging schedule target." : "Site operations are ahead of target."}
          </p>
        </div>
      </div>

      {/* Graphical Progress Analytics Suite */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-construct-surface border border-construct-border rounded-xl p-5 shadow-subtle">
          <div className="flex items-center justify-between pb-3 border-b border-construct-border mb-4">
            <div>
              <h3 className="font-heading font-extrabold text-sm text-construct-text flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Physical vs Financial Progress S-Curve Trajectory</span>
              </h3>
              <p className="text-xs text-construct-secondary mt-0.5">
                Timeline curve comparing planned milestone trajectory against verified physical execution and commercial financial burn.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              {metrics?.actualPercent || 61}% Physical
            </span>
          </div>
          <ProgressSCurveChart data={sCurveData} height={280} />
        </div>

        <div className="bg-construct-surface border border-construct-border rounded-xl p-5 shadow-subtle">
          <div className="flex items-center justify-between pb-3 border-b border-construct-border mb-4">
            <h3 className="font-heading font-extrabold text-sm text-construct-text flex items-center gap-2">
              <Layers className="w-4 h-4 text-construct-orange" />
              <span>WBS Activity Milestones</span>
            </h3>
          </div>
          <p className="text-xs text-construct-secondary mb-2">
            Verified percentage completion across structural packages.
          </p>
          <ActivityMilestoneChart data={activityProgressData} height={260} />
        </div>
      </div>

      {/* Pending Review Submissions Queue */}
      {pendingLogs.length > 0 && (
        <div className="bg-construct-surface border border-construct-orange/40 rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between pb-3 border-b border-construct-border">
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-construct-orange" />
              <h3 className="font-heading font-bold text-sm text-construct-text">
                Pending Engineer Progress Submissions Awaiting Sign-Off
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-100 text-construct-orange">
              {pendingLogs.length} SUBMISSIONS REQUIRING ACTION
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {pendingLogs.map((log) => {
              const logActs = repository.getDailyLogActivities(log.id);
              return (
                <div key={log.id} className="p-4 rounded-lg bg-construct-bg border border-construct-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-construct-text">Date: {log.log_date}</span>
                      <span className="text-xs text-construct-secondary">Weather: {log.weather_condition} ({log.temperature}°C)</span>
                      <span className="text-xs text-construct-secondary">Manpower: {log.workforce_count} workers</span>
                    </div>

                    <div className="mt-2 space-y-1">
                      {logActs.map((dla) => {
                        const act = activities.find((a) => a.id === dla.activity_id);
                        return (
                          <div key={dla.id} className="text-xs font-mono text-construct-text flex items-center gap-2">
                            <span className="font-bold text-construct-orange">{act?.code}:</span>
                            <span>Reported +{dla.reported_quantity} {act?.unit}</span>
                            <span className="text-construct-secondary">— {dla.work_performed}</span>
                          </div>
                        );
                      })}
                    </div>

                    {log.delays_summary && (
                      <p className="text-xs text-amber-700 mt-2 font-mono">
                        Note: {log.delays_summary}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleReviewLog(log.id, "approve")}
                      className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Approve & Verify</span>
                    </button>
                    <button
                      onClick={() => handleReviewLog(log.id, "reject")}
                      className="px-3.5 py-2 rounded-lg border border-red-300 hover:bg-red-50 text-red-700 text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Verified Activity Progress Ledger Table */}
      <div className="bg-construct-surface border border-construct-border rounded-xl shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-construct-border flex items-center justify-between">
          <h3 className="font-heading font-bold text-sm text-construct-text">
            Physical Activity Ledger & Verified Quantities
          </h3>
          <span className="text-xs font-mono text-construct-secondary">
            Strict Non-Duplicate Ledger
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-construct-border bg-construct-bg text-[11px] font-mono font-bold text-construct-secondary">
                <th className="py-3 px-4">CODE</th>
                <th className="py-3 px-4">ACTIVITY</th>
                <th className="py-3 px-4">PLANNED QTY</th>
                <th className="py-3 px-4">VERIFIED QTY</th>
                <th className="py-3 px-4">REMAINING</th>
                <th className="py-3 px-4">PHYSICAL %</th>
                <th className="py-3 px-4">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-construct-border/60">
              {activities.map((act) => {
                const percent = act.planned_quantity > 0 ? Math.round((act.verified_quantity / act.planned_quantity) * 100) : 0;
                const remaining = Math.max(0, act.planned_quantity - act.verified_quantity);
                return (
                  <tr key={act.id} className="hover:bg-construct-muted/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-construct-orange">{act.code}</td>
                    <td className="py-3 px-4 font-semibold text-construct-text">{act.name}</td>
                    <td className="py-3 px-4 font-mono text-construct-secondary">{act.planned_quantity} {act.unit}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700">{act.verified_quantity} {act.unit}</td>
                    <td className="py-3 px-4 font-mono text-construct-secondary">{remaining} {act.unit}</td>
                    <td className="py-3 px-4 font-mono font-bold">
                      <div className="flex items-center gap-2">
                        <span>{percent}%</span>
                        <div className="w-20 bg-construct-border h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${percent === 100 ? "bg-emerald-600" : "bg-construct-orange"}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        act.status === "completed"
                          ? "bg-emerald-100 text-emerald-800"
                          : act.status === "in_progress"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-construct-muted text-construct-secondary"
                      }`}>
                        {act.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
