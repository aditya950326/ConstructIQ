"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { repository } from "@/lib/data/repository";
import { CorrectiveAction } from "@/types/database";
import {
  Wrench,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  ShieldCheck,
  Calendar,
} from "lucide-react";

export default function CorrectiveActionsPage() {
  const params = useParams();
  const projectId = (params?.projectId as string) || "b0000000-0000-0000-0000-000000000001";

  const [actions, setActions] = useState<CorrectiveAction[]>([]);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = () => {
    setActions(repository.getCorrectiveActions(projectId));
  };

  const handleResolve = (actionId: string) => {
    const user = repository.getCurrentUser();
    repository.resolveCorrectiveAction(actionId, user.full_name);
    loadData();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified_closed":
        return <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">VERIFIED CLOSED</span>;
      case "in_progress":
        return <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800">IN PROGRESS</span>;
      case "submitted":
        return <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-purple-100 text-purple-800">SUBMITTED FOR QA</span>;
      default:
        return <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800">PENDING ACTION</span>;
    }
  };

  return (
    <AppShell
      title="Corrective Actions & Issue Resolution"
      subtitle="Closed-Loop Remediation for Quality Non-Conformance & Safety Hazards"
      activeProjectId={projectId}
    >
      <div className="bg-construct-surface border border-construct-border rounded-xl shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-construct-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-construct-orange" />
            <h3 className="font-heading font-bold text-sm text-construct-text">
              Active Corrective Actions Register
            </h3>
          </div>
          <span className="text-xs font-mono text-construct-secondary">
            {actions.length} Tracked Actions
          </span>
        </div>

        <div className="divide-y divide-construct-border/60">
          {actions.map((item) => (
            <div
              key={item.id}
              className="p-5 hover:bg-construct-muted/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-heading font-bold text-sm text-construct-text">
                    {item.action_text}
                  </span>
                  {getStatusBadge(item.status)}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] font-mono text-construct-secondary">
                  <span>Source: <strong className="text-construct-text capitalize">{item.source_type.replace("_", " ")}</strong></span>
                  <span>Target Due: <strong>{item.due_date}</strong></span>
                  <span>Assignee: Lead Site Engineer</span>
                  {item.completed_at && (
                    <span className="text-emerald-700 font-bold">
                      Verified Closed on {new Date(item.completed_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {item.status !== "verified_closed" && (
                <div className="shrink-0 flex items-center gap-2">
                  <button
                    onClick={() => handleResolve(item.id)}
                    className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Verify & Close Action</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
