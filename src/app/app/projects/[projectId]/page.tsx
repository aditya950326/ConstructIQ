"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { repository } from "@/lib/data/repository";
import { Project, Activity, DailyLog } from "@/types/database";
import {
  Layers,
  CalendarDays,
  CheckSquare2,
  ClipboardList,
  Camera,
  Boxes,
  ShieldCheck,
  AlertOctagon,
  Wrench,
  DollarSign,
  AlertTriangle,
  FileSpreadsheet,
  ArrowRight,
  MapPin,
  Calendar,
  Building2,
  TrendingUp,
  Clock,
  Users,
} from "lucide-react";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = (params?.projectId as string) || "b0000000-0000-0000-0000-000000000001";

  const [project, setProject] = useState<Project | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<DailyLog[]>([]);

  useEffect(() => {
    const p = repository.getProjectById(projectId);
    if (p) {
      setProject(p);
      setMetrics(repository.getProjectMetrics(projectId));
      setRecentLogs(repository.getDailyLogs(projectId).slice(0, 3));
    }
  }, [projectId]);

  if (!project) {
    return (
      <AppShell title="Project Not Found">
        <div className="p-12 text-center text-construct-secondary">
          <p>Requested project does not exist.</p>
          <Link href="/app/projects" className="text-construct-orange font-bold text-xs mt-2 inline-block">
            ← Return to Projects
          </Link>
        </div>
      </AppShell>
    );
  }

  const modules = [
    {
      title: "Team & Access Governance",
      desc: "Assign Project Manager, Site Engineers, and Site Supervisors with login email & passwords.",
      icon: Users,
      href: `/app/projects/${projectId}/team`,
      badge: "RBAC Directory",
    },
    {
      title: "Configurable Site Hierarchy",
      desc: "Parent-child structural breakdown (Towers, Substructure, Zones, Highway sections).",
      icon: Layers,
      href: `/app/projects/${projectId}/structure`,
      badge: `${repository.getHierarchy(projectId).length} Nodes`,
    },
    {
      title: "Schedule & Gantt",
      desc: "Planned vs actual start/finish dates, dependencies, and critical sequence.",
      icon: CalendarDays,
      href: `/app/projects/${projectId}/schedule`,
      badge: `${metrics?.totalActivities || 0} Activities`,
    },
    {
      title: "Progress & Sign-Off",
      desc: "Physical quantities verified by PM sign-offs, avoiding self-reported inflation.",
      icon: CheckSquare2,
      href: `/app/projects/${projectId}/progress`,
      badge: `${metrics?.actualPercent}% Verified`,
    },
    {
      title: "Daily Site Logs",
      desc: "Field logs of labor, weather delays, equipment, and reported outputs.",
      icon: ClipboardList,
      href: `/app/projects/${projectId}/daily-logs`,
      badge: `${metrics?.pendingLogsCount} Pending PM`,
    },
    {
      title: "Evidence Vault",
      desc: "Geocoded photos, test certificates, cube strength reports, and drawings.",
      icon: Camera,
      href: `/app/projects/${projectId}/evidence`,
      badge: `${repository.getEvidence(projectId).length} Files`,
    },
    {
      title: "Materials & Stock Ledger",
      desc: "Strict inventory receipts, activity issues, and non-negative buffer controls.",
      icon: Boxes,
      href: `/app/projects/${projectId}/materials`,
      badge: metrics?.lowStockCount > 0 ? `${metrics.lowStockCount} Shortage` : "In Stock",
      alert: metrics?.lowStockCount > 0,
    },
    {
      title: "Quality QA/QC Audits",
      desc: "Inspection checklists, concrete slump, rebar spacing, and defect records.",
      icon: ShieldCheck,
      href: `/app/projects/${projectId}/quality`,
      badge: `${metrics?.openQualityCount} Open Issues`,
    },
    {
      title: "Safety Observations",
      desc: "Hazard reports, near-misses, PPE compliance, and immediate stop-work actions.",
      icon: AlertOctagon,
      href: `/app/projects/${projectId}/safety`,
      badge: `${metrics?.openSafetyCount} Open`,
    },
    {
      title: "Corrective Actions",
      desc: "Assigned defect repairs with target completion dates and verification sign-off.",
      icon: Wrench,
      href: `/app/projects/${projectId}/issues`,
      badge: `${repository.getCorrectiveActions(projectId).length} Actions`,
    },
    {
      title: "Delay-Risk Engine",
      desc: "Deterministic rule-based schedule intelligence with explicit explanations.",
      icon: AlertTriangle,
      href: `/app/projects/${projectId}/risk`,
      badge: `${metrics?.highRiskCount} Risk Alerts`,
      highlight: true,
    },
    {
      title: "Financials & Expenses",
      desc: "Material procurement expenses, plant lease costs, and budget burn-down.",
      icon: DollarSign,
      href: `/app/projects/${projectId}/financials`,
      badge: `${metrics?.budgetConsumedPercent}% Used`,
    },
    {
      title: "Reports & Exports",
      desc: "Generate 14 formal stakeholder reports in Excel and printable formats.",
      icon: FileSpreadsheet,
      href: `/app/projects/${projectId}/reports`,
      badge: "14 Report Types",
    },
  ];

  return (
    <AppShell
      title={project.name}
      subtitle={`Code: ${project.code}`}
      activeProjectId={projectId}
      headerActions={
        <div className="flex items-center gap-2">
          <Link
            href={`/app/projects/${projectId}/daily-logs`}
            className="px-3.5 py-1.5 rounded-lg bg-construct-orange text-white text-xs font-semibold hover:bg-construct-orangeHover shadow-sm transition-colors"
          >
            + Daily Site Log
          </Link>
        </div>
      }
    >
      {/* Project Overview Card */}
      <div className="bg-construct-surface border border-construct-border rounded-xl p-6 shadow-subtle">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-construct-border">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-construct-orange px-2 py-0.5 rounded bg-orange-50 border border-orange-200">
                {project.code}
              </span>
              <span className="text-xs font-mono uppercase text-construct-secondary">
                {project.project_type} PROJECT
              </span>
            </div>
            <h2 className="text-2xl font-heading font-extrabold text-construct-text mt-2">
              {project.name}
            </h2>
            <p className="text-xs text-construct-secondary mt-1 leading-relaxed max-w-3xl">
              {project.description}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono text-construct-secondary block">APPROVED BUDGET</span>
            <span className="text-xl font-heading font-extrabold text-construct-text">
              ₹{(project.approved_budget / 10000000).toFixed(2)} Cr
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 text-xs">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-construct-secondary shrink-0" />
            <div>
              <span className="text-[10px] font-mono text-construct-secondary block">LOCATION</span>
              <span className="font-medium text-construct-text">{project.location}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-construct-secondary shrink-0" />
            <div>
              <span className="text-[10px] font-mono text-construct-secondary block">CLIENT / OWNER</span>
              <span className="font-medium text-construct-text">{project.client}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-construct-secondary shrink-0" />
            <div>
              <span className="text-[10px] font-mono text-construct-secondary block">SCHEDULE TIMELINE</span>
              <span className="font-medium text-construct-text">{project.start_date} → {project.planned_completion_date}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-construct-secondary shrink-0" />
            <div>
              <span className="text-[10px] font-mono text-construct-secondary block">PROGRESS STATUS</span>
              <span className="font-bold text-emerald-700">{metrics?.actualPercent}% Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div>
        <h3 className="font-heading font-bold text-base text-construct-text mb-4">
          Project Operations & Intelligence Modules
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <Link
                key={m.title}
                href={m.href}
                className={`p-5 rounded-xl border bg-construct-surface hover:border-construct-orange/40 hover:shadow-card transition-all flex flex-col justify-between group ${
                  m.highlight ? "border-construct-orange/30 bg-orange-50/20" : "border-construct-border"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className={`p-2.5 rounded-lg shrink-0 ${m.highlight ? "bg-construct-orange text-white" : "bg-construct-bg text-construct-text border border-construct-border/60"}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                      m.alert
                        ? "bg-rose-100 text-rose-800"
                        : m.highlight
                        ? "bg-orange-100 text-construct-orange"
                        : "bg-construct-muted text-construct-secondary"
                    }`}>
                      {m.badge}
                    </span>
                  </div>
                  <h4 className="font-heading font-bold text-sm text-construct-text mt-3 group-hover:text-construct-orange transition-colors">
                    {m.title}
                  </h4>
                  <p className="text-xs text-construct-secondary mt-1.5 leading-relaxed">
                    {m.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-construct-border/60 flex items-center justify-between text-xs font-semibold text-construct-text group-hover:text-construct-orange">
                  <span>Open Module</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
