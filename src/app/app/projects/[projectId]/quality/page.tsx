"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { repository } from "@/lib/data/repository";
import { Inspection, QualityIssue, Activity } from "@/types/database";
import {
  ShieldCheck,
  Plus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileCheck,
  Clock,
  X,
  Wrench,
} from "lucide-react";

export default function QualityPage() {
  const params = useParams();
  const projectId = (params?.projectId as string) || "b0000000-0000-0000-0000-000000000001";

  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [issues, setIssues] = useState<QualityIssue[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isDefectModalOpen, setIsDefectModalOpen] = useState(false);

  // New Defect Form State
  const [defectTitle, setDefectTitle] = useState("");
  const [activityId, setActivityId] = useState("");
  const [severity, setSeverity] = useState<any>("medium");
  const [dueDate, setDueDate] = useState("2026-10-28");
  const [description, setDescription] = useState("");

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = () => {
    setInspections(repository.getInspections(projectId));
    setIssues(repository.getQualityIssues(projectId));
    const acts = repository.getActivities(projectId);
    setActivities(acts);
    if (acts.length > 0 && !activityId) setActivityId(acts[0].id);
  };

  const handleCreateDefect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!defectTitle) return;

    const user = repository.getCurrentUser();
    repository.addQualityIssue({
      project_id: projectId,
      activity_id: activityId,
      title: defectTitle,
      severity,
      status: "open",
      description,
      identified_by: user.id,
      due_date: dueDate,
    });

    loadData();
    setIsDefectModalOpen(false);
    setDefectTitle("");
    setDescription("");
  };

  return (
    <AppShell
      title="Quality Assurance & Inspections"
      subtitle="QA/QC Checklists, Non-Conformance & Defect Resolution"
      activeProjectId={projectId}
      headerActions={
        <button
          onClick={() => setIsDefectModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-construct-orange text-white text-xs font-semibold hover:bg-construct-orangeHover shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Raise Defect / Non-Conformance</span>
        </button>
      }
    >
      {/* Quality Audits Table */}
      <div className="bg-construct-surface border border-construct-border rounded-xl shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-construct-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <h3 className="font-heading font-bold text-sm text-construct-text">
              Formal Quality Inspections & Pre-Pour Checklists
            </h3>
          </div>
          <span className="text-xs font-mono text-construct-secondary">
            {inspections.length} Audits Logged
          </span>
        </div>

        <div className="divide-y divide-construct-border/60">
          {inspections.map((insp) => {
            const act = activities.find((a) => a.id === insp.activity_id);
            return (
              <div key={insp.id} className="p-4 hover:bg-construct-muted/40 transition-colors text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-construct-text text-sm">{insp.title}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      insp.status === "passed"
                        ? "bg-emerald-100 text-emerald-800"
                        : insp.status === "conditional"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-rose-100 text-rose-800"
                    }`}>
                      {insp.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-construct-secondary mt-1 font-mono text-[11px]">
                    Inspection Type: <span className="capitalize text-construct-text font-bold">{insp.inspection_type}</span> • Date: {insp.inspection_date}
                  </p>
                  {insp.summary_notes && (
                    <p className="text-construct-secondary mt-1 bg-construct-bg/60 p-2 rounded border border-construct-border/50 text-[11px]">
                      {insp.summary_notes}
                    </p>
                  )}
                </div>

                <div className="text-right font-mono text-[11px] text-construct-secondary shrink-0">
                  <span>Activity: </span>
                  <span className="font-bold text-construct-orange">{act?.code || "Site Structure"}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Non-Conformance & Defect Register */}
      <div className="bg-construct-surface border border-construct-border rounded-xl shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-construct-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-construct-orange" />
            <h3 className="font-heading font-bold text-sm text-construct-text">
              Active Defect & Non-Conformance Register (NCR)
            </h3>
          </div>
          <span className="text-xs font-mono text-construct-secondary">
            {issues.length} Issues Tracked
          </span>
        </div>

        <div className="divide-y divide-construct-border/60">
          {issues.map((issue) => {
            const act = activities.find((a) => a.id === issue.activity_id);
            return (
              <div key={issue.id} className="p-4 hover:bg-construct-muted/40 transition-colors text-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-construct-text text-sm">{issue.title}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      issue.severity === "critical"
                        ? "bg-rose-100 text-rose-900 border border-rose-200"
                        : issue.severity === "high"
                        ? "bg-orange-100 text-construct-orange border border-orange-200"
                        : "bg-amber-100 text-amber-900 border border-amber-200"
                    }`}>
                      {issue.severity}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-construct-muted text-construct-secondary uppercase">
                      {issue.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-construct-secondary mt-1 leading-relaxed">
                    {issue.description}
                  </p>
                  <div className="mt-2 text-[11px] font-mono text-construct-secondary flex items-center gap-4">
                    <span>Target Due: {issue.due_date}</span>
                    <span>Linked to: {act?.code || "General"}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <a
                    href={`/app/projects/${projectId}/issues`}
                    className="px-3 py-1.5 rounded-lg border border-construct-border bg-construct-bg hover:bg-construct-muted text-xs font-semibold text-construct-text transition-colors flex items-center gap-1"
                  >
                    <Wrench className="w-3.5 h-3.5 text-construct-orange" />
                    <span>View Corrective Action</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Raise Defect Modal */}
      {isDefectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-construct-text/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-construct-surface border border-construct-border rounded-xl shadow-elevated p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-construct-border">
              <h3 className="font-heading font-extrabold text-base text-construct-text">
                Raise Quality Defect / Non-Conformance Record
              </h3>
              <button onClick={() => setIsDefectModalOpen(false)} className="text-construct-secondary hover:text-construct-text">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDefect} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-construct-text mb-1">Defect Title *</label>
                <input
                  type="text"
                  required
                  value={defectTitle}
                  onChange={(e) => setDefectTitle(e.target.value)}
                  placeholder="e.g. Column C-4 Honeycombing & Air Voids"
                  className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg focus:outline-none focus:border-construct-orange text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-construct-text mb-1">Severity Level</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg focus:outline-none focus:border-construct-orange text-xs"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-construct-text mb-1">Target Resolution Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg font-mono focus:outline-none focus:border-construct-orange text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-construct-text mb-1">Affected Activity</label>
                <select
                  value={activityId}
                  onChange={(e) => setActivityId(e.target.value)}
                  className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg focus:outline-none focus:border-construct-orange text-xs"
                >
                  {activities.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code}: {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-construct-text mb-1">Defect Description & Lab/Site Measurements</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain structural observations, rebound hammer test findings, or non-conformance..."
                  className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg focus:outline-none focus:border-construct-orange text-xs"
                />
              </div>

              <div className="pt-3 border-t border-construct-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDefectModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-construct-border text-construct-secondary hover:bg-construct-muted text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-construct-orange text-white text-xs font-semibold hover:bg-construct-orangeHover shadow-sm"
                >
                  Log Non-Conformance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
