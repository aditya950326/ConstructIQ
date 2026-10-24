"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { repository } from "@/lib/data/repository";
import { Project, Activity, Material, DailyLog, DelayRisk } from "@/types/database";
import * as XLSX from "xlsx";
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Filter,
  CheckCircle2,
  Building2,
  FileText,
} from "lucide-react";

export default function ReportsPage() {
  const params = useParams();
  const projectId = (params?.projectId as string) || "b0000000-0000-0000-0000-000000000001";

  const [project, setProject] = useState<Project | null>(null);
  const [reportType, setReportType] = useState("planned_vs_actual");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [risks, setRisks] = useState<DelayRisk[]>([]);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    setProject(repository.getProjectById(projectId) || null);
    setActivities(repository.getActivities(projectId));
    setMaterials(repository.getMaterials(projectId));
    setDailyLogs(repository.getDailyLogs(projectId));
    setRisks(repository.getProjectDelayRisks(projectId));
    setMetrics(repository.getProjectMetrics(projectId));
  }, [projectId]);

  const reportTypes = [
    { id: "planned_vs_actual", name: "Planned vs Actual Progress Report" },
    { id: "daily_progress", name: "Daily Progress & Log Summary" },
    { id: "delayed_activities", name: "Delayed Activities & Critical Path Report" },
    { id: "materials_ledger", name: "Material Stock & Consumption Report" },
    { id: "quality_safety", name: "Quality & Safety Compliance Report" },
    { id: "financial_budget", name: "Project Expense & Budget Burn-Down Report" },
    { id: "delay_risk_register", name: "Delay-Risk Register & Explanations" },
    { id: "evidence_register", name: "Project Evidence & Verification Register" },
  ];

  const handleExportExcel = () => {
    let dataToExport: any[] = [];
    let filename = `${project?.code || "ConstructIQ"}_Report_${reportType}.xlsx`;

    if (reportType === "planned_vs_actual" || reportType === "delayed_activities") {
      dataToExport = activities.map((a) => ({
        "Activity Code": a.code,
        "Activity Name": a.name,
        "Start Date": a.start_date,
        "Planned Finish": a.planned_finish_date,
        "Planned Quantity": a.planned_quantity,
        "Verified Quantity": a.verified_quantity,
        "Unit": a.unit,
        "Physical Progress (%)": a.planned_quantity > 0 ? Math.round((a.verified_quantity / a.planned_quantity) * 100) : 0,
        "Priority": a.priority,
        "Status": a.status,
      }));
    } else if (reportType === "materials_ledger") {
      dataToExport = materials.map((m) => ({
        "Material Code": m.code,
        "Material Name": m.name,
        "Category": m.category,
        "Unit": m.unit,
        "Current Yard Stock": m.current_stock,
        "Minimum Safety Buffer": m.minimum_stock_level,
        "Unit Cost (INR)": m.unit_cost,
        "Total Valuation (INR)": m.current_stock * m.unit_cost,
        "Supplier": m.supplier_name,
      }));
    } else if (reportType === "delay_risk_register") {
      dataToExport = risks.map((r) => ({
        "Activity Code": activities.find((a) => a.id === r.activity_id)?.code || "N/A",
        "Risk Severity": r.risk_level.toUpperCase(),
        "Rule Triggered": r.rule_triggered,
        "Variance (Days)": r.variance_days,
        "Evidence Grounding": r.evidence_summary,
        "Recommended Mitigation Action": r.recommended_action,
        "Status": r.acknowledgement_status,
      }));
    } else {
      dataToExport = dailyLogs.map((l) => ({
        "Shift Date": l.log_date,
        "Weather Condition": l.weather_condition,
        "Temperature (C)": l.temperature,
        "Workforce Count": l.workforce_count,
        "Equipment Used": l.equipment_used,
        "Delays / Bottlenecks": l.delays_summary,
        "Review Status": l.status,
      }));
    }

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ConstructIQ Report");
    XLSX.writeFile(wb, filename);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppShell
      title="Reports & Analytics Exports"
      subtitle="14 Formal Stakeholder Reports in Spreadsheet & PDF Formats"
      activeProjectId={projectId}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Spreadsheet (Excel)</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-construct-border bg-construct-surface hover:bg-construct-muted text-xs font-semibold text-construct-text shadow-sm transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-construct-secondary" />
            <span>Print Report</span>
          </button>
        </div>
      }
    >
      {/* Report Configuration Bar */}
      <div className="bg-construct-surface border border-construct-border rounded-xl p-5 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <label className="block text-xs font-mono font-bold uppercase text-construct-secondary mb-1">
            SELECT REPORT TEMPLATE
          </label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="p-2 border border-construct-border rounded-lg bg-construct-bg text-xs font-semibold text-construct-text focus:outline-none focus:border-construct-orange"
          >
            {reportTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-right font-mono text-xs text-construct-secondary">
          <p>Generated: <span className="font-bold text-construct-text">{new Date().toLocaleDateString()}</span></p>
          <p>Project Code: <span className="font-bold text-construct-orange">{project?.code}</span></p>
        </div>
      </div>

      {/* Formatted Report Preview Card */}
      <div className="bg-construct-surface border border-construct-border rounded-xl p-8 shadow-card printable-area">
        {/* Formal Report Header */}
        <div className="pb-6 border-b-2 border-construct-text flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-black text-xl tracking-tight text-construct-text">
                Construct<span className="text-construct-orange">IQ</span>
              </span>
              <span className="text-xs font-mono text-construct-secondary border-l border-construct-border pl-2">
                OFFICIAL SITE REPORT
              </span>
            </div>
            <h2 className="text-xl font-heading font-extrabold text-construct-text mt-2">
              {reportTypes.find((r) => r.id === reportType)?.name}
            </h2>
            <p className="text-xs text-construct-secondary mt-0.5">
              Project: <strong className="text-construct-text">{project?.name}</strong> • Location: {project?.location}
            </p>
          </div>

          <div className="text-right font-mono text-xs text-construct-secondary">
            <span className="px-2 py-0.5 rounded bg-construct-muted text-construct-text font-bold block mb-1">
              STATUS: CONFIDENTIAL
            </span>
            <span>Date: {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Executive Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6 text-xs font-mono">
          <div className="p-3 rounded-lg bg-construct-bg border border-construct-border/60">
            <span className="text-construct-secondary text-[10px] block">VERIFIED PROGRESS</span>
            <span className="text-base font-bold text-emerald-700">{metrics?.actualPercent}%</span>
          </div>
          <div className="p-3 rounded-lg bg-construct-bg border border-construct-border/60">
            <span className="text-construct-secondary text-[10px] block">PLANNED TARGET</span>
            <span className="text-base font-bold text-construct-text">{metrics?.plannedPercent}%</span>
          </div>
          <div className="p-3 rounded-lg bg-construct-bg border border-construct-border/60">
            <span className="text-construct-secondary text-[10px] block">COMMERCIAL BUDGET</span>
            <span className="text-base font-bold text-construct-text">₹{(project?.approved_budget || 0) / 10000000} Cr</span>
          </div>
          <div className="p-3 rounded-lg bg-construct-bg border border-construct-border/60">
            <span className="text-construct-secondary text-[10px] block">ACTIVE RISK ALERTS</span>
            <span className="text-base font-bold text-construct-orange">{risks.length} Derived</span>
          </div>
        </div>

        {/* Dynamic Table Content based on selected report */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-construct-border bg-construct-bg text-[11px] font-mono font-bold text-construct-secondary">
                <th className="py-2.5 px-3">REF CODE</th>
                <th className="py-2.5 px-3">RECORD TITLE / NAME</th>
                <th className="py-2.5 px-3">KEY ATTRIBUTE</th>
                <th className="py-2.5 px-3">OUTPUT / METRIC</th>
                <th className="py-2.5 px-3">GOVERNANCE STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-construct-border/60 font-mono">
              {reportType === "materials_ledger" ? (
                materials.map((m) => (
                  <tr key={m.id}>
                    <td className="py-2.5 px-3 font-bold text-construct-orange">{m.code}</td>
                    <td className="py-2.5 px-3 font-sans font-semibold text-construct-text">{m.name}</td>
                    <td className="py-2.5 px-3 text-construct-secondary">{m.category}</td>
                    <td className="py-2.5 px-3 font-bold text-construct-text">{m.current_stock} {m.unit} (₹{m.unit_cost}/u)</td>
                    <td className="py-2.5 px-3">
                      {m.current_stock < m.minimum_stock_level ? (
                        <span className="text-construct-orange font-bold">BUFFER SHORTAGE</span>
                      ) : (
                        <span className="text-emerald-700 font-bold">VERIFIED NORMAL</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : reportType === "delay_risk_register" ? (
                risks.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2.5 px-3 font-bold text-rose-700">{r.risk_level.toUpperCase()}</td>
                    <td className="py-2.5 px-3 font-sans font-semibold text-construct-text">{r.rule_triggered}</td>
                    <td className="py-2.5 px-3 text-construct-secondary">{r.variance_days} Days Lag</td>
                    <td className="py-2.5 px-3 font-sans text-construct-secondary">{r.recommended_action}</td>
                    <td className="py-2.5 px-3 font-bold text-construct-text">{r.acknowledgement_status.toUpperCase()}</td>
                  </tr>
                ))
              ) : (
                activities.map((a) => (
                  <tr key={a.id}>
                    <td className="py-2.5 px-3 font-bold text-construct-orange">{a.code}</td>
                    <td className="py-2.5 px-3 font-sans font-semibold text-construct-text">{a.name}</td>
                    <td className="py-2.5 px-3 text-construct-secondary">{a.start_date} → {a.planned_finish_date}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-700">{a.verified_quantity} / {a.planned_quantity} {a.unit}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        a.status === "completed" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                      }`}>
                        {a.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Report Sign-off Footer */}
        <div className="mt-12 pt-6 border-t border-construct-border flex justify-between text-xs font-mono text-construct-secondary">
          <div>
            <p className="font-bold text-construct-text">Prepared By: Lead Site Engineer</p>
            <p className="mt-1">ConstructIQ Evidence Engine</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-construct-text">Reviewed & Certified: Project Manager</p>
            <p className="mt-1">Date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
