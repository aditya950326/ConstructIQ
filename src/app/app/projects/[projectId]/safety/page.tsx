"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { repository } from "@/lib/data/repository";
import { SafetyObservation, HierarchyNode } from "@/types/database";
import {
  AlertOctagon,
  Plus,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Clock,
  X,
  FileCheck,
} from "lucide-react";

export default function SafetyPage() {
  const params = useParams();
  const projectId = (params?.projectId as string) || "b0000000-0000-0000-0000-000000000001";

  const [observations, setObservations] = useState<SafetyObservation[]>([]);
  const [nodes, setNodes] = useState<HierarchyNode[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Safety Form State
  const [title, setTitle] = useState("");
  const [observationType, setObservationType] = useState<any>("hazard");
  const [riskLevel, setRiskLevel] = useState<any>("high");
  const [hierarchyNodeId, setHierarchyNodeId] = useState("");
  const [immediateAction, setImmediateAction] = useState("");
  const [correctiveAction, setCorrectiveAction] = useState("");

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = () => {
    setObservations(repository.getSafetyObservations(projectId));
    const hNodes = repository.getHierarchy(projectId);
    setNodes(hNodes);
    if (hNodes.length > 0) setHierarchyNodeId(hNodes[0].id);
  };

  const handleCreateObservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const user = repository.getCurrentUser();
    repository.addSafetyObservation({
      project_id: projectId,
      hierarchy_node_id: hierarchyNodeId,
      title,
      observation_type: observationType,
      risk_level: riskLevel,
      status: "open",
      immediate_action_taken: immediateAction,
      corrective_action_required: correctiveAction,
      reported_by: user.id,
    });

    loadData();
    setIsModalOpen(false);
    setTitle("");
    setImmediateAction("");
    setCorrectiveAction("");
  };

  return (
    <AppShell
      title="Safety Operations & Stop-Work Governance"
      subtitle="Hazard Reports, Near-Misses, Immediate Mitigations & Compliance"
      activeProjectId={projectId}
      headerActions={
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-construct-orange text-white text-xs font-semibold hover:bg-construct-orangeHover shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Report Safety Observation</span>
        </button>
      }
    >
      {/* Safety Priority Alert Notice */}
      <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 shadow-subtle flex items-start gap-3">
        <AlertOctagon className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-heading font-bold text-sm text-construct-text">
            Zero-Harm Construction Standard
          </h3>
          <p className="text-xs text-construct-secondary mt-0.5 leading-relaxed">
            All personnel have stop-work authority when critical safety hazards or missing fall protections are observed. Observations remain open until verified mitigation is audited on-site.
          </p>
        </div>
      </div>

      {/* Safety Observations List */}
      <div className="space-y-4">
        {observations.map((item) => {
          const node = nodes.find((n) => n.id === item.hierarchy_node_id);
          return (
            <div
              key={item.id}
              className="bg-construct-surface border border-construct-border rounded-xl p-5 shadow-subtle hover:border-construct-border/80 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-construct-border">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg shrink-0 ${
                    item.risk_level === "high" || item.risk_level === "critical"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-heading font-extrabold text-sm text-construct-text">
                        {item.title}
                      </h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        item.risk_level === "critical"
                          ? "bg-rose-200 text-rose-900"
                          : item.risk_level === "high"
                          ? "bg-orange-200 text-orange-900"
                          : "bg-amber-200 text-amber-900"
                      }`}>
                        {item.risk_level} RISK
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-construct-muted text-construct-secondary uppercase">
                        {item.observation_type.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-xs text-construct-secondary font-mono mt-0.5">
                      Location: {node ? `${node.node_type}: ${node.name}` : "General Site"} • Logged: {new Date(item.reported_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold ${
                  item.status === "closed" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                }`}>
                  {item.status.toUpperCase()}
                </span>
              </div>

              {/* Action Details */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-lg bg-construct-bg border border-construct-border/60">
                  <span className="text-[10px] font-mono font-bold uppercase text-construct-secondary block">
                    IMMEDIATE ACTION TAKEN
                  </span>
                  <p className="text-construct-text mt-1 leading-relaxed">
                    {item.immediate_action_taken || "Work halted immediately in zone."}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-construct-bg border border-construct-border/60">
                  <span className="text-[10px] font-mono font-bold uppercase text-construct-orange block">
                    CORRECTIVE ACTION MANDATED
                  </span>
                  <p className="text-construct-text mt-1 leading-relaxed">
                    {item.corrective_action_required || "Full perimeter edge toe-boards and guardrails to be installed."}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Observation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-construct-text/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-construct-surface border border-construct-border rounded-xl shadow-elevated p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-construct-border">
              <h3 className="font-heading font-extrabold text-base text-construct-text">
                Report Safety Observation / Incident
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-construct-secondary hover:text-construct-text">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateObservation} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-construct-text mb-1">Observation Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Loose scaffold coupling on Level 02 external hoist"
                  className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg focus:outline-none focus:border-construct-orange text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-construct-text mb-1">Observation Type</label>
                  <select
                    value={observationType}
                    onChange={(e) => setObservationType(e.target.value)}
                    className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg focus:outline-none focus:border-construct-orange text-xs"
                  >
                    <option value="hazard">Hazard Condition</option>
                    <option value="near_miss">Near Miss Event</option>
                    <option value="unsafe_act">Unsafe Behavioral Act</option>
                    <option value="incident">Confirmed Incident</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-construct-text mb-1">Risk Severity Level</label>
                  <select
                    value={riskLevel}
                    onChange={(e) => setRiskLevel(e.target.value)}
                    className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg focus:outline-none focus:border-construct-orange text-xs"
                  >
                    <option value="critical">Critical Risk</option>
                    <option value="high">High Risk</option>
                    <option value="medium">Medium Risk</option>
                    <option value="low">Low Risk</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-construct-text mb-1">Site Location (Zone)</label>
                <select
                  value={hierarchyNodeId}
                  onChange={(e) => setHierarchyNodeId(e.target.value)}
                  className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg focus:outline-none focus:border-construct-orange text-xs"
                >
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.node_type}: {n.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-construct-text mb-1">Immediate Action Taken *</label>
                <input
                  type="text"
                  required
                  value={immediateAction}
                  onChange={(e) => setImmediateAction(e.target.value)}
                  placeholder="e.g. Area barricaded and personnel relocated"
                  className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg focus:outline-none focus:border-construct-orange text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-construct-text mb-1">Corrective Action Required</label>
                <textarea
                  rows={2}
                  value={correctiveAction}
                  onChange={(e) => setCorrectiveAction(e.target.value)}
                  placeholder="Permanent engineering controls and inspection sign-off required..."
                  className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg focus:outline-none focus:border-construct-orange text-xs"
                />
              </div>

              <div className="pt-3 border-t border-construct-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-construct-border text-construct-secondary hover:bg-construct-muted text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-construct-orange text-white text-xs font-semibold hover:bg-construct-orangeHover shadow-sm"
                >
                  Submit Safety Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
