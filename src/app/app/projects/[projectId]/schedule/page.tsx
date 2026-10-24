"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { repository } from "@/lib/data/repository";
import { Activity, ActivityDependency, HierarchyNode } from "@/types/database";
import {
  CalendarDays,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ChevronRight,
  Filter,
  X,
} from "lucide-react";

export default function SchedulePage() {
  const params = useParams();
  const projectId = (params?.projectId as string) || "b0000000-0000-0000-0000-000000000001";

  const [activities, setActivities] = useState<Activity[]>([]);
  const [dependencies, setDependencies] = useState<ActivityDependency[]>([]);
  const [nodes, setNodes] = useState<HierarchyNode[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Activity Form State
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [hierarchyNodeId, setHierarchyNodeId] = useState("");
  const [startDate, setStartDate] = useState("2026-10-25");
  const [plannedFinishDate, setPlannedFinishDate] = useState("2026-11-15");
  const [plannedQuantity, setPlannedQuantity] = useState(500);
  const [unit, setUnit] = useState("Cu.m");
  const [priority, setPriority] = useState<any>("medium");
  const [weightPercent, setWeightPercent] = useState(10);
  const [description, setDescription] = useState("");

  useEffect(() => {
    setActivities(repository.getActivities(projectId));
    setDependencies(repository.getDependencies(projectId));
    const hNodes = repository.getHierarchy(projectId);
    setNodes(hNodes);
    if (hNodes.length > 0) setHierarchyNodeId(hNodes[0].id);
  }, [projectId]);

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) return;

    repository.createActivity({
      project_id: projectId,
      hierarchy_node_id: hierarchyNodeId,
      code,
      name,
      description,
      responsible_id: "a0000000-0000-0000-0000-000000000003",
      start_date: startDate,
      planned_finish_date: plannedFinishDate,
      planned_quantity: Number(plannedQuantity),
      verified_quantity: 0,
      unit,
      priority,
      status: "not_started",
      approval_required: true,
      evidence_required: true,
      weight_percent: Number(weightPercent),
    });

    setActivities(repository.getActivities(projectId));
    setIsAddModalOpen(false);
    setCode("");
    setName("");
    setDescription("");
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-800">CRITICAL</span>;
      case "high":
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-100 text-construct-orange">HIGH</span>;
      case "medium":
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-construct-muted text-construct-secondary">LOW</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">COMPLETED</span>;
      case "in_progress":
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800">IN PROGRESS</span>;
      case "blocked":
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-800">BLOCKED</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-construct-muted text-construct-secondary">NOT STARTED</span>;
    }
  };

  return (
    <AppShell
      title="Activity Schedule & Timeline"
      subtitle="Planned vs Actual Dates, Quantities & Dependencies"
      activeProjectId={projectId}
      headerActions={
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-construct-orange text-white text-xs font-semibold hover:bg-construct-orangeHover shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Activity</span>
        </button>
      }
    >
      {/* Schedule Table */}
      <div className="bg-construct-surface border border-construct-border rounded-xl shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-construct-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-construct-orange" />
            <h3 className="font-heading font-bold text-sm text-construct-text">Master Work Schedule</h3>
          </div>
          <span className="text-xs font-mono text-construct-secondary">
            {activities.length} Scheduled Activities
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-construct-border bg-construct-bg text-[11px] font-mono font-bold text-construct-secondary">
                <th className="py-3 px-4">CODE</th>
                <th className="py-3 px-4">ACTIVITY NAME</th>
                <th className="py-3 px-4">LOCATION (NODE)</th>
                <th className="py-3 px-4">START DATE</th>
                <th className="py-3 px-4">PLAN FINISH</th>
                <th className="py-3 px-4">PLANNED QTY</th>
                <th className="py-3 px-4">VERIFIED QTY</th>
                <th className="py-3 px-4">PRIORITY</th>
                <th className="py-3 px-4">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-construct-border/60">
              {activities.map((act) => {
                const node = nodes.find((n) => n.id === act.hierarchy_node_id);
                const percent = act.planned_quantity > 0 ? Math.round((act.verified_quantity / act.planned_quantity) * 100) : 0;
                return (
                  <tr key={act.id} className="hover:bg-construct-muted/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-construct-orange">{act.code}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-construct-text">{act.name}</div>
                      <div className="text-[11px] text-construct-secondary truncate max-w-xs">{act.description}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-construct-secondary">
                      {node ? `${node.node_type}: ${node.name}` : "General Site"}
                    </td>
                    <td className="py-3 px-4 font-mono text-construct-secondary">{act.start_date}</td>
                    <td className="py-3 px-4 font-mono text-construct-secondary">{act.planned_finish_date}</td>
                    <td className="py-3 px-4 font-mono font-medium text-construct-text">
                      {act.planned_quantity} {act.unit}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                      {act.verified_quantity} {act.unit}
                      <span className="text-[10px] text-construct-secondary ml-1 font-normal">({percent}%)</span>
                    </td>
                    <td className="py-3 px-4">{getPriorityBadge(act.priority)}</td>
                    <td className="py-3 px-4">{getStatusBadge(act.status)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gantt-Style Visual Timeline Strip */}
      <div className="bg-construct-surface border border-construct-border rounded-xl p-5 shadow-subtle">
        <div className="flex items-center justify-between pb-3 border-b border-construct-border">
          <h3 className="font-heading font-bold text-sm text-construct-text">
            Sequence & Timeline Progression (Gantt Visualization)
          </h3>
          <span className="text-[11px] font-mono text-construct-secondary">
            Finish-to-Start (FS) Dependencies Linked
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {activities.map((act, index) => {
            const percent = act.planned_quantity > 0 ? Math.round((act.verified_quantity / act.planned_quantity) * 100) : 0;
            const pred = dependencies.find((d) => d.activity_id === act.id);
            const predAct = pred ? activities.find((a) => a.id === pred.predecessor_id) : null;

            return (
              <div key={act.id} className="p-3 rounded-lg bg-construct-bg border border-construct-border/60">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-construct-text">{act.code}</span>
                    <span className="font-medium text-construct-text">{act.name}</span>
                    {predAct && (
                      <span className="text-[10px] font-mono text-construct-secondary bg-construct-muted px-1.5 py-0.2 rounded">
                        Depends on: {predAct.code}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-xs text-construct-secondary">
                    {act.start_date} → {act.planned_finish_date}
                  </span>
                </div>

                {/* Dual Bar: Total Timeline & Verified Progress */}
                <div className="mt-2.5 relative w-full bg-construct-border h-4 rounded-md overflow-hidden">
                  <div
                    className={`h-full rounded-md transition-all duration-300 ${
                      percent === 100 ? "bg-emerald-600" : "bg-construct-orange"
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-construct-text drop-shadow-xs">
                    {percent}% Verified ({act.verified_quantity} / {act.planned_quantity} {act.unit})
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Activity Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-construct-text/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-construct-surface border border-construct-border rounded-xl shadow-elevated p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-construct-border">
              <h3 className="font-heading font-extrabold text-base text-construct-text">
                Schedule New Site Activity
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-construct-secondary hover:text-construct-text">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddActivity} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-construct-text mb-1">Activity Code *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. ACT-106"
                    className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg font-mono focus:outline-none focus:border-construct-orange text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-construct-text mb-1">Activity Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Shear Wall Shuttering & Casting"
                    className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg focus:outline-none focus:border-construct-orange text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-construct-text mb-1">Hierarchy Location (Zone) *</label>
                <select
                  value={hierarchyNodeId}
                  onChange={(e) => setHierarchyNodeId(e.target.value)}
                  className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg focus:outline-none focus:border-construct-orange text-xs"
                >
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.node_type}: {n.name} ({n.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-construct-text mb-1">Planned Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg font-mono focus:outline-none focus:border-construct-orange text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-construct-text mb-1">Planned Finish Date</label>
                  <input
                    type="date"
                    value={plannedFinishDate}
                    onChange={(e) => setPlannedFinishDate(e.target.value)}
                    className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg font-mono focus:outline-none focus:border-construct-orange text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-construct-text mb-1">Planned Quantity</label>
                  <input
                    type="number"
                    value={plannedQuantity}
                    onChange={(e) => setPlannedQuantity(Number(e.target.value))}
                    className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg font-mono focus:outline-none focus:border-construct-orange text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-construct-text mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="Cu.m, Tonnes, Sq.m"
                    className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg focus:outline-none focus:border-construct-orange text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-construct-text mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg focus:outline-none focus:border-construct-orange text-xs"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-construct-text mb-1">Scope & Technical Specification</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Technical details of work to be performed..."
                  className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg focus:outline-none focus:border-construct-orange text-xs"
                />
              </div>

              <div className="pt-3 border-t border-construct-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-construct-border text-construct-secondary hover:bg-construct-muted text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-construct-orange text-white text-xs font-semibold hover:bg-construct-orangeHover shadow-sm"
                >
                  Save Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
