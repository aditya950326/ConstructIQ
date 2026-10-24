"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { repository } from "@/lib/data/repository";
import { DelayRisk, Activity } from "@/types/database";
import {
  AlertTriangle,
  RotateCw,
  CheckCircle,
  XCircle,
  FileText,
  Clock,
  ShieldCheck,
  AlertCircle,
  Layers,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function DelayRiskPage() {
  const params = useParams();
  const projectId = (params?.projectId as string) || "b0000000-0000-0000-0000-000000000001";

  const [risks, setRisks] = useState<DelayRisk[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [dismissModalRiskId, setDismissModalRiskId] = useState<string | null>(null);
  const [dismissReason, setDismissReason] = useState("");

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = () => {
    setRisks(repository.getProjectDelayRisks(projectId));
    setActivities(repository.getActivities(projectId));
  };

  const handleRecalculate = () => {
    setIsRecalculating(true);
    setTimeout(() => {
      loadData();
      setIsRecalculating(false);
    }, 400);
  };

  const handleDismiss = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dismissModalRiskId || !dismissReason) return;
    repository.dismissRiskAlert(dismissModalRiskId, dismissReason);
    loadData();
    setDismissModalRiskId(null);
    setDismissReason("");
  };

  return (
    <AppShell
      title="Explainable Delay-Risk Engine"
      subtitle="Deterministic Rule-Based Schedule Intelligence & Root Cause Attribution"
      activeProjectId={projectId}
      headerActions={
        <button
          onClick={handleRecalculate}
          disabled={isRecalculating}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-construct-surface border border-construct-border hover:bg-construct-muted text-xs font-semibold text-construct-text shadow-sm transition-colors"
        >
          <RotateCw className={`w-3.5 h-3.5 text-construct-orange ${isRecalculating ? "animate-spin" : ""}`} />
          <span>{isRecalculating ? "Evaluating Rules..." : "Re-evaluate Rules"}</span>
        </button>
      }
    >
      {/* Rule Engine Architecture Manifesto */}
      <div className="p-5 rounded-xl border border-construct-border bg-construct-surface shadow-subtle">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-orange-100 text-construct-orange shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-extrabold text-sm text-construct-text">
              Explainable AI & Deterministic Engineering Rules
            </h3>
            <p className="text-xs text-construct-secondary mt-1 leading-relaxed">
              ConstructIQ eliminates arbitrary black-box predictions. Every schedule risk alert is deterministically derived from verified physical quantities, material buffer stock thresholds, predecessor dependency chains, and open quality/safety holds.
            </p>
          </div>
        </div>

        {/* Engine Rules Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-construct-border text-[11px] font-mono">
          <div className="p-2.5 rounded-lg bg-construct-bg border border-construct-border/60">
            <span className="font-bold text-construct-orange block">RULE-01: SCHEDULE SLIPPAGE</span>
            <span className="text-construct-secondary text-[10px]">Overdue finish dates & timeline breach</span>
          </div>
          <div className="p-2.5 rounded-lg bg-construct-bg border border-construct-border/60">
            <span className="font-bold text-construct-orange block">RULE-02: QUANTITY DEFICIT</span>
            <span className="text-construct-secondary text-[10px]">Verified quantity lag vs elapsed time</span>
          </div>
          <div className="p-2.5 rounded-lg bg-construct-bg border border-construct-border/60">
            <span className="font-bold text-construct-orange block">RULE-03: DEPENDENCY BLOCK</span>
            <span className="text-construct-secondary text-[10px]">Unfinished predecessors stalling successors</span>
          </div>
          <div className="p-2.5 rounded-lg bg-construct-bg border border-construct-border/60">
            <span className="font-bold text-construct-orange block">RULE-04: BUFFER DEPLETION</span>
            <span className="text-construct-secondary text-[10px]">Material yard stock below safety threshold</span>
          </div>
        </div>
      </div>

      {/* Active Delay-Risk Alerts */}
      <div className="space-y-4">
        {risks.length === 0 ? (
          <div className="bg-construct-surface border border-construct-border rounded-xl p-12 text-center text-xs text-construct-secondary shadow-subtle">
            <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
            <h4 className="font-heading font-bold text-base text-construct-text">All Activities Within Risk Tolerance</h4>
            <p className="mt-1">Zero critical dependencies stalled and material buffer thresholds satisfied.</p>
          </div>
        ) : (
          risks.map((risk) => {
            const act = activities.find((a) => a.id === risk.activity_id);
            const isDismissed = risk.acknowledgement_status === "dismissed";

            return (
              <div
                key={risk.id}
                className={`bg-construct-surface border rounded-xl p-6 shadow-subtle transition-all ${
                  isDismissed
                    ? "opacity-60 border-construct-border bg-construct-muted/20"
                    : risk.risk_level === "critical"
                    ? "border-rose-300 hover:border-rose-400"
                    : risk.risk_level === "high"
                    ? "border-orange-300 hover:border-orange-400"
                    : "border-amber-300 hover:border-amber-400"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-construct-border">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg shrink-0 ${
                      risk.risk_level === "critical"
                        ? "bg-rose-100 text-rose-800"
                        : risk.risk_level === "high"
                        ? "bg-orange-100 text-construct-orange"
                        : "bg-amber-100 text-amber-800"
                    }`}>
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-extrabold uppercase ${
                          risk.risk_level === "critical"
                            ? "bg-rose-200 text-rose-900"
                            : risk.risk_level === "high"
                            ? "bg-orange-200 text-orange-900"
                            : "bg-amber-200 text-amber-900"
                        }`}>
                          {risk.risk_level} RISK
                        </span>
                        <h4 className="font-heading font-extrabold text-sm text-construct-text">
                          {act ? `${act.code}: ${act.name}` : "Activity"}
                        </h4>
                      </div>
                      <p className="text-xs text-construct-secondary font-mono mt-0.5">
                        Triggered: <span className="font-bold text-construct-text">{risk.rule_triggered}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono text-xs text-construct-secondary shrink-0">
                    <span>Evaluated at {new Date(risk.calculated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Evidence & Grounding Explanation */}
                <div className="mt-4 p-4 rounded-lg bg-construct-bg border border-construct-border/60 text-xs">
                  <span className="text-[10px] font-mono font-bold uppercase text-construct-secondary block">
                    GROUNDED SITE EVIDENCE & ROOT CAUSE
                  </span>
                  <p className="text-construct-text mt-1 font-mono text-[11px] leading-relaxed">
                    {risk.evidence_summary}
                  </p>
                </div>

                {/* Recommended Action Box */}
                <div className="mt-3 p-4 rounded-lg border border-construct-orange/30 bg-orange-50/30 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-construct-orange block">
                      RECOMMENDED ENGINEER MITIGATION ACTION
                    </span>
                    <p className="text-construct-text font-medium mt-1 leading-relaxed">
                      {risk.recommended_action}
                    </p>
                  </div>

                  {!isDismissed ? (
                    <button
                      onClick={() => setDismissModalRiskId(risk.id)}
                      className="px-3.5 py-1.5 rounded-lg border border-construct-border bg-construct-surface hover:bg-construct-muted text-xs font-semibold text-construct-secondary hover:text-construct-text transition-colors shrink-0"
                    >
                      Acknowledge / Dismiss
                    </button>
                  ) : (
                    <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-construct-muted text-construct-secondary shrink-0">
                      DISMISSED: {risk.dismissed_reason}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Dismiss / Acknowledge Modal */}
      {dismissModalRiskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-construct-text/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-construct-surface border border-construct-border rounded-xl shadow-elevated p-6 animate-in zoom-in-95 duration-150">
            <h3 className="font-heading font-extrabold text-base text-construct-text pb-2 border-b border-construct-border">
              Acknowledge / Dismiss Delay Risk Alert
            </h3>
            <p className="text-xs text-construct-secondary mt-2">
              Provide an engineering justification for overriding or dismissing this schedule risk indicator.
            </p>

            <form onSubmit={handleDismiss} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-construct-text mb-1">Reason for Dismissal *</label>
                <textarea
                  rows={3}
                  required
                  value={dismissReason}
                  onChange={(e) => setDismissReason(e.target.value)}
                  placeholder="e.g. Additional steel consignment already cleared port and arriving tonight; recovery shift planned."
                  className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg focus:outline-none focus:border-construct-orange text-xs"
                />
              </div>

              <div className="pt-3 border-t border-construct-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDismissModalRiskId(null)}
                  className="px-4 py-2 rounded-lg border border-construct-border text-construct-secondary hover:bg-construct-muted text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-construct-orange text-white text-xs font-semibold hover:bg-construct-orangeHover shadow-sm"
                >
                  Confirm Overwrite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
