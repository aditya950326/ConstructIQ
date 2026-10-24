"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { repository } from "@/lib/data/repository";
import { Project, ProjectStatus } from "@/types/database";
import {
  Building2,
  Plus,
  ArrowRight,
  Calendar,
  MapPin,
  DollarSign,
  TrendingUp,
  X,
  AlertTriangle,
  FolderKanban,
} from "lucide-react";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Project Form State
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [projectType, setProjectType] = useState<any>("residential");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [client, setClient] = useState("");
  const [approvedBudget, setApprovedBudget] = useState(15000000);
  const [startDate, setStartDate] = useState("2026-11-01");
  const [plannedCompletionDate, setPlannedCompletionDate] = useState("2027-11-01");

  useEffect(() => {
    setProjects(repository.getProjects());
  }, []);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;

    const newPrj = repository.createProject({
      name,
      code,
      project_type: projectType,
      description,
      location,
      timezone: "Asia/Kolkata",
      client,
      project_manager_id: "a0000000-0000-0000-0000-000000000002",
      start_date: startDate,
      planned_completion_date: plannedCompletionDate,
      approved_budget: Number(approvedBudget),
      currency: "INR",
      status: "active",
    });

    setProjects(repository.getProjects());
    setIsCreateModalOpen(false);
  };

  return (
    <AppShell
      title="Project Portfolio"
      subtitle="Multi-site management & operational governance"
      headerActions={
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-construct-orange text-white text-xs font-semibold hover:bg-construct-orangeHover shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      }
    >
      <div className="flex items-center justify-between pb-4 border-b border-construct-border">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-construct-text">Active Construction Projects</h2>
          <p className="text-xs text-construct-secondary mt-0.5">
            Select a project to access its configurable hierarchy, activity schedules, evidence, and risk alerts.
          </p>
        </div>
        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-construct-muted text-construct-secondary">
          {projects.length} PROJECTS ENROLLED
        </span>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((project) => {
          const metrics = repository.getProjectMetrics(project.id);
          return (
            <div
              key={project.id}
              className="bg-construct-surface border border-construct-border rounded-xl p-6 shadow-subtle hover:border-construct-orange/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-construct-orange px-2 py-0.5 rounded bg-orange-50 border border-orange-200">
                      {project.code}
                    </span>
                    <h3 className="text-lg font-heading font-extrabold text-construct-text mt-2">
                      {project.name}
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {project.status.toUpperCase()}
                  </span>
                </div>

                <p className="text-xs text-construct-secondary mt-2 line-clamp-2 leading-relaxed">
                  {project.description}
                </p>

                <div className="grid grid-cols-2 gap-3 mt-4 text-xs text-construct-secondary">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-construct-secondary shrink-0" />
                    <span className="truncate">{project.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono">
                    <Building2 className="w-3.5 h-3.5 text-construct-secondary shrink-0" />
                    <span className="truncate">{project.client}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-construct-secondary shrink-0" />
                    <span>Target: {project.planned_completion_date}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono">
                    <DollarSign className="w-3.5 h-3.5 text-construct-secondary shrink-0" />
                    <span>Budget: ₹{(project.approved_budget / 10000000).toFixed(2)} Cr</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-5 p-3 rounded-lg bg-construct-bg border border-construct-border/60">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-construct-secondary">Verified Actual Progress</span>
                    <span className="font-bold text-construct-text">{metrics.actualPercent}%</span>
                  </div>
                  <div className="w-full bg-construct-border h-2 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${metrics.actualPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[11px] font-mono text-construct-secondary">
                    <span>Planned: {metrics.plannedPercent}%</span>
                    {metrics.highRiskCount > 0 ? (
                      <span className="text-construct-orange font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {metrics.highRiskCount} Risk Alert(s)
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-semibold">On Track</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Links */}
              <div className="mt-6 pt-4 border-t border-construct-border flex items-center justify-between">
                <Link
                  href={`/app/projects/${project.id}/structure`}
                  className="text-xs text-construct-secondary hover:text-construct-text font-medium"
                >
                  Site Hierarchy
                </Link>
                <Link
                  href={`/app/projects/${project.id}`}
                  className="px-4 py-2 rounded-lg bg-construct-surface border border-construct-border hover:bg-construct-muted text-xs font-semibold text-construct-text transition-colors flex items-center gap-1.5 group"
                >
                  <span>Open Project Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-construct-text/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-construct-surface border border-construct-border rounded-xl shadow-elevated p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-construct-border">
              <h3 className="font-heading font-extrabold text-base text-construct-text">
                Enrol New Construction Project
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-construct-secondary hover:text-construct-text">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-construct-text mb-1">Project Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Skyline Commercial Hub"
                    className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg focus:outline-none focus:border-construct-orange text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-construct-text mb-1">Project Code *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. PRJ-SKY-01"
                    className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg font-mono focus:outline-none focus:border-construct-orange text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-construct-text mb-1">Project Type</label>
                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                    className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg focus:outline-none focus:border-construct-orange text-xs"
                  >
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="infrastructure">Infrastructure</option>
                    <option value="industrial">Industrial</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-construct-text mb-1">Approved Budget (INR)</label>
                  <input
                    type="number"
                    value={approvedBudget}
                    onChange={(e) => setApprovedBudget(Number(e.target.value))}
                    className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg font-mono focus:outline-none focus:border-construct-orange text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-construct-text mb-1">Client / Owner</label>
                  <input
                    type="text"
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    placeholder="e.g. Prestige Estates Ltd"
                    className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg focus:outline-none focus:border-construct-orange text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-construct-text mb-1">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Pune, Maharashtra"
                    className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg focus:outline-none focus:border-construct-orange text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-construct-text mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg font-mono focus:outline-none focus:border-construct-orange text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-construct-text mb-1">Planned Completion Date</label>
                  <input
                    type="date"
                    value={plannedCompletionDate}
                    onChange={(e) => setPlannedCompletionDate(e.target.value)}
                    className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg font-mono focus:outline-none focus:border-construct-orange text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-construct-text mb-1">Scope & Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summary of construction scope..."
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
                  Save & Enrol Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
