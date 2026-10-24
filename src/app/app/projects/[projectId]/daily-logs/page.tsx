"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { repository } from "@/lib/data/repository";
import { DailyLog, DailyLogActivity, Activity, HierarchyNode } from "@/types/database";
import {
  ClipboardList,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Sun,
  CloudRain,
  Users,
  Wrench,
  Camera,
  X,
  FileCheck,
} from "lucide-react";

export default function DailyLogsPage() {
  const params = useParams();
  const projectId = (params?.projectId as string) || "b0000000-0000-0000-0000-000000000001";

  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [nodes, setNodes] = useState<HierarchyNode[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Daily Log Form State
  const [logDate, setLogDate] = useState("2026-10-23");
  const [hierarchyNodeId, setHierarchyNodeId] = useState("");
  const [weatherCondition, setWeatherCondition] = useState<any>("sunny");
  const [temperature, setTemperature] = useState(32);
  const [workforceCount, setWorkforceCount] = useState(35);
  const [equipmentUsed, setEquipmentUsed] = useState("1x Tower Crane, 2x Concrete Vibrators");
  const [delaysSummary, setDelaysSummary] = useState("");
  const [generalNotes, setGeneralNotes] = useState("");
  const [selectedActivityId, setSelectedActivityId] = useState("");
  const [reportedQuantity, setReportedQuantity] = useState(4);
  const [workPerformed, setWorkPerformed] = useState("Casting columns and curing previous lift");

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = () => {
    setLogs(repository.getDailyLogs(projectId));
    const acts = repository.getActivities(projectId);
    setActivities(acts);
    if (acts.length > 0) setSelectedActivityId(acts[0].id);
    const hNodes = repository.getHierarchy(projectId);
    setNodes(hNodes);
    if (hNodes.length > 0) setHierarchyNodeId(hNodes[0].id);
  };

  const handleCreateLog = (e: React.FormEvent) => {
    e.preventDefault();
    const user = repository.getCurrentUser();

    repository.createDailyLog(
      {
        project_id: projectId,
        hierarchy_node_id: hierarchyNodeId,
        log_date: logDate,
        author_id: user.id,
        weather_condition: weatherCondition,
        temperature: Number(temperature),
        workforce_count: Number(workforceCount),
        equipment_used: equipmentUsed,
        delays_summary: delaysSummary,
        general_notes: generalNotes,
        status: "submitted",
      },
      [
        {
          activity_id: selectedActivityId,
          reported_quantity: Number(reportedQuantity),
          work_performed: workPerformed,
        },
      ]
    );

    loadData();
    setIsCreateModalOpen(false);
  };

  const handleReview = (logId: string, action: "approve" | "reject") => {
    const user = repository.getCurrentUser();
    repository.reviewDailyLog(logId, action, user.id, action === "approve" ? "Verified with slump and cube strength tests." : "Missing mandatory photo attachment.");
    loadData();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">APPROVED</span>;
      case "submitted":
        return <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-orange-100 text-construct-orange">AWAITING REVIEW</span>;
      case "rejected":
        return <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-800">REJECTED</span>;
      default:
        return <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-construct-muted text-construct-secondary">DRAFT</span>;
    }
  };

  return (
    <AppShell
      title="Daily Site Logs"
      subtitle="Shift reporting, workforce, weather & reported quantities"
      activeProjectId={projectId}
      headerActions={
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-construct-orange text-white text-xs font-semibold hover:bg-construct-orangeHover shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Daily Log</span>
        </button>
      }
    >
      <div className="space-y-4">
        {logs.map((log) => {
          const logActivities = repository.getDailyLogActivities(log.id);
          const author = repository.getCurrentUser();
          return (
            <div
              key={log.id}
              className="bg-construct-surface border border-construct-border rounded-xl p-5 shadow-subtle hover:border-construct-border/80 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-construct-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-construct-bg text-construct-text border border-construct-border/60">
                    <ClipboardList className="w-5 h-5 text-construct-orange" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-extrabold text-sm text-construct-text">
                        Daily Log — {log.log_date}
                      </span>
                      {getStatusBadge(log.status)}
                    </div>
                    <p className="text-xs text-construct-secondary font-mono mt-0.5">
                      Reported by Engineer • ID: {log.id}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-construct-secondary font-mono">
                  <div className="flex items-center gap-1">
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>{log.weather_condition} ({log.temperature}°C)</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-construct-secondary" />
                    <span>{log.workforce_count} workers</span>
                  </div>
                </div>
              </div>

              {/* Log Details Grid */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-construct-secondary block">
                      ACTIVITIES & REPORTED QUANTITIES
                    </span>
                    <div className="mt-1 space-y-2">
                      {logActivities.map((dla) => {
                        const act = activities.find((a) => a.id === dla.activity_id);
                        return (
                          <div
                            key={dla.id}
                            className="p-3 rounded-lg bg-construct-bg border border-construct-border/60 text-xs flex items-center justify-between"
                          >
                            <div>
                              <span className="font-mono font-bold text-construct-orange mr-2">
                                {act?.code}:
                              </span>
                              <span className="font-semibold text-construct-text mr-2">{act?.name}</span>
                              <p className="text-[11px] text-construct-secondary mt-0.5">
                                {dla.work_performed}
                              </p>
                            </div>
                            <div className="text-right font-mono">
                              <span className="font-bold text-construct-text text-sm">
                                +{dla.reported_quantity} {act?.unit}
                              </span>
                              <span className={`block text-[10px] ${
                                dla.verification_status === "approved" ? "text-emerald-700 font-bold" : "text-amber-700"
                              }`}>
                                {dla.verification_status.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {log.general_notes && (
                    <div className="text-xs">
                      <span className="text-[10px] font-mono font-bold uppercase text-construct-secondary block">
                        ENGINEER REMARKS
                      </span>
                      <p className="text-construct-text mt-0.5 leading-relaxed bg-construct-bg/50 p-2.5 rounded border border-construct-border/40">
                        {log.general_notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Equipment & Review Actions */}
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-construct-bg border border-construct-border/60 text-xs">
                    <span className="text-[10px] font-mono font-bold uppercase text-construct-secondary block">
                      PLANT & MACHINERY DEPLOYED
                    </span>
                    <p className="text-construct-text mt-1 font-mono text-[11px]">
                      {log.equipment_used || "Standard hand tools and bar benders"}
                    </p>
                  </div>

                  {log.delays_summary && (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs">
                      <span className="text-[10px] font-mono font-bold uppercase text-amber-800 block">
                        RECORDED DELAYS & BOTTLENECKS
                      </span>
                      <p className="text-amber-900 mt-1 font-mono text-[11px]">
                        {log.delays_summary}
                      </p>
                    </div>
                  )}

                  {/* Review Actions if Submitted */}
                  {log.status === "submitted" && (
                    <div className="p-3 rounded-lg border border-construct-orange/40 bg-orange-50/30 text-xs">
                      <span className="text-[10px] font-mono font-bold uppercase text-construct-orange block mb-2">
                        PROJECT MANAGER VERIFICATION
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReview(log.id, "approve")}
                          className="flex-1 py-1.5 px-2 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold transition-colors flex items-center justify-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Approve Log</span>
                        </button>
                        <button
                          onClick={() => handleReview(log.id, "reject")}
                          className="py-1.5 px-2 rounded border border-red-300 hover:bg-red-50 text-red-700 text-[11px] font-bold transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  )}

                  {log.status === "approved" && log.review_notes && (
                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 font-mono">
                      <span className="font-bold block">PM Sign-Off Note:</span>
                      {log.review_notes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Daily Log Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-construct-text/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-construct-surface border border-construct-border rounded-xl shadow-elevated p-6 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-construct-border">
              <h3 className="font-heading font-extrabold text-base text-construct-text">
                Record Daily Construction Site Log
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-construct-secondary hover:text-construct-text">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLog} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-construct-text mb-1">Shift Date *</label>
                  <input
                    type="date"
                    required
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg font-mono focus:outline-none focus:border-construct-orange text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-construct-text mb-1">Site Location (Zone) *</label>
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
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-construct-text mb-1">Weather</label>
                  <select
                    value={weatherCondition}
                    onChange={(e) => setWeatherCondition(e.target.value)}
                    className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg focus:outline-none focus:border-construct-orange text-xs"
                  >
                    <option value="sunny">Sunny</option>
                    <option value="cloudy">Cloudy</option>
                    <option value="rainy">Rainy</option>
                    <option value="stormy">Stormy</option>
                    <option value="windy">Windy</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-construct-text mb-1">Temp (°C)</label>
                  <input
                    type="number"
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                    className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg font-mono focus:outline-none focus:border-construct-orange text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-construct-text mb-1">Manpower Count</label>
                  <input
                    type="number"
                    value={workforceCount}
                    onChange={(e) => setWorkforceCount(Number(e.target.value))}
                    className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg font-mono focus:outline-none focus:border-construct-orange text-xs"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-construct-bg border border-construct-border/80 space-y-3">
                <span className="font-mono font-bold text-construct-text text-[11px] block">
                  Report Activity Output
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-construct-text mb-1">Target Activity *</label>
                    <select
                      value={selectedActivityId}
                      onChange={(e) => setSelectedActivityId(e.target.value)}
                      className="w-full p-2 border border-construct-border rounded-lg bg-construct-surface focus:outline-none focus:border-construct-orange text-xs"
                    >
                      {activities.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.code}: {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-construct-text mb-1">Reported Output Quantity *</label>
                    <input
                      type="number"
                      required
                      value={reportedQuantity}
                      onChange={(e) => setReportedQuantity(Number(e.target.value))}
                      className="w-full p-2 border border-construct-border rounded-lg bg-construct-surface font-mono focus:outline-none focus:border-construct-orange text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-construct-text mb-1">Work Description</label>
                  <input
                    type="text"
                    value={workPerformed}
                    onChange={(e) => setWorkPerformed(e.target.value)}
                    placeholder="e.g. Columns C1-C4 formwork fixed and poured"
                    className="w-full p-2 border border-construct-border rounded-lg bg-construct-surface focus:outline-none focus:border-construct-orange text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-construct-text mb-1">Equipment Deployed</label>
                <input
                  type="text"
                  value={equipmentUsed}
                  onChange={(e) => setEquipmentUsed(e.target.value)}
                  placeholder="e.g. 1x Tower Crane, 2x Needle Vibrators"
                  className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg focus:outline-none focus:border-construct-orange text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-construct-text mb-1">Delays, Blockers & Issues</label>
                <textarea
                  rows={2}
                  value={delaysSummary}
                  onChange={(e) => setDelaysSummary(e.target.value)}
                  placeholder="Note any material shortage, weather delays, or safety stops..."
                  className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg focus:outline-none focus:border-construct-orange text-xs"
                />
              </div>

              <div className="pt-3 border-t border-construct-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-construct-border text-construct-secondary hover:bg-construct-muted text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-construct-orange text-white text-xs font-semibold hover:bg-construct-orangeHover shadow-sm"
                >
                  Submit Daily Log for Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
