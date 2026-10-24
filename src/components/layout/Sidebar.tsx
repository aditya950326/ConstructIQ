"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Camera,
  Boxes,
  AlertTriangle,
  FileSpreadsheet,
  ChevronDown,
  Building2,
  UserCheck,
  Users,
  Receipt,
  LogOut,
  ShieldCheck,
  HardHat,
  Briefcase,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { repository } from "@/lib/data/repository";
import { Project, UserRole, Profile } from "@/types/database";

interface SidebarProps {
  activeProjectId?: string;
}

export function Sidebar({ activeProjectId }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>("super_admin");
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);

  useEffect(() => {
    const syncSidebar = () => {
      const prjs = repository.getProjects();
      setProjects(prjs);
      if (activeProjectId) {
        const found = prjs.find((p) => p.id === activeProjectId);
        if (found) setCurrentProject(found);
      } else if (prjs.length > 0) {
        setCurrentProject(prjs[0]);
      }
      const user = repository.getCurrentUser();
      setCurrentUser(user);
      setCurrentUserRole(user.role);
    };

    syncSidebar();
    window.addEventListener("constructiq-role-change", syncSidebar);
    window.addEventListener("storage", syncSidebar);

    return () => {
      window.removeEventListener("constructiq-role-change", syncSidebar);
      window.removeEventListener("storage", syncSidebar);
    };
  }, [activeProjectId]);

  const pId = currentProject?.id || "b0000000-0000-0000-0000-000000000001";

  interface NavItem {
    label: string;
    href: string;
    icon: any;
    highlight?: boolean;
    tag?: string;
  }

  // If user is Site Supervisor, show ONLY their designated tasks
  const supervisorNavLinks: NavItem[] = [
    { label: "Supervisor Field Desk", href: "/app/supervisor", icon: UserCheck, highlight: true },
    { label: "Daily Labor Attendance", href: "/app/supervisor?tab=attendance", icon: Users },
    { label: "Work Done Photos & Videos", href: "/app/supervisor?tab=photos", icon: Camera },
    { label: "Upload Bills & Receipts", href: "/app/supervisor?tab=bills", icon: Receipt },
  ];

  // Navigation for Management & Engineers
  const standardNavLinks: NavItem[] = [
    { label: "Overview", href: "/app/overview", icon: LayoutDashboard },
    { label: "Team & Access", href: `/app/projects/${pId}/team`, icon: Users, tag: "RBAC" },
    { label: "Daily Site Logs", href: `/app/projects/${pId}/daily-logs`, icon: ClipboardList },
    { label: "Photos & Videos (Evidence)", href: `/app/projects/${pId}/evidence`, icon: Camera },
    { label: "Materials & Stock", href: `/app/projects/${pId}/materials`, icon: Boxes },
    { label: "Schedule & Delay Risk", href: `/app/projects/${pId}/risk`, icon: AlertTriangle, highlight: true },
    { label: "Reports & Exports", href: `/app/projects/${pId}/reports`, icon: FileSpreadsheet },
    { label: "Supervisor Field Desk", href: "/app/supervisor", icon: UserCheck, tag: "Field" },
  ];

  const navLinks = currentUserRole === "site_supervisor" ? supervisorNavLinks : standardNavLinks;

  const handleSelectProject = (project: Project) => {
    setCurrentProject(project);
    setShowProjectPicker(false);
    if (pathname.includes("/app/projects/")) {
      const parts = pathname.split("/");
      parts[3] = project.id;
      router.push(parts.join("/"));
    }
  };

  return (
    <aside className="w-64 border-r border-construct-border bg-construct-surface flex flex-col h-screen shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-construct-border shrink-0">
        <a href="/">
          <Logo size="md" />
        </a>
      </div>

      {/* Project Switcher Bar */}
      <div className="px-3 py-2.5 border-b border-construct-border bg-construct-bg/50 relative">
        <button
          onClick={() => setShowProjectPicker(!showProjectPicker)}
          className="w-full flex items-center justify-between p-2 rounded-lg border border-construct-border/80 bg-construct-surface hover:bg-construct-muted/40 transition-colors shadow-subtle text-left"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="w-4 h-4 text-construct-orange shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-mono font-medium text-construct-secondary truncate">
                {currentProject?.code || "SELECT PROJECT"}
              </p>
              <p className="text-xs font-bold text-construct-text truncate">
                {currentProject?.name || "Loading..."}
              </p>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-construct-secondary shrink-0" />
        </button>

        {/* Project Dropdown */}
        {showProjectPicker && (
          <div className="absolute top-16 left-3 right-3 z-30 bg-construct-surface border border-construct-border rounded-lg shadow-elevated py-1.5 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-construct-secondary">
              Available Projects
            </div>
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectProject(p)}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-construct-muted/60 transition-colors ${
                  currentProject?.id === p.id ? "bg-construct-muted font-bold text-construct-orange" : "text-construct-text"
                }`}
              >
                <div className="min-w-0">
                  <span className="font-mono text-[11px] block text-construct-secondary">{p.code}</span>
                  <span className="truncate block">{p.name}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Clean Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
        <div className="px-2 pb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-construct-secondary/70">
          {currentUserRole === "site_supervisor" ? "SUPERVISOR WORKFLOW" : "SITE WORKFLOW"}
        </div>
        {navLinks.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/app/overview" && pathname.startsWith(item.href));

          return (
            <a
              key={item.label}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? item.highlight
                    ? "bg-construct-orange text-white shadow-sm font-bold"
                    : "bg-construct-muted text-construct-text border border-construct-border/80 font-bold"
                  : item.highlight
                  ? "text-construct-orange hover:bg-orange-50 font-bold"
                  : "text-construct-secondary hover:text-construct-text hover:bg-construct-muted/50"
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive && item.highlight ? "text-white" : ""}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.tag && (
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-construct-muted border border-construct-border text-construct-secondary">
                  {item.tag}
                </span>
              )}
            </a>
          );
        })}
      </nav>

      {/* Bottom Production Authenticated Profile Footer */}
      <div className="p-3 border-t border-construct-border bg-construct-bg/60 shrink-0">
        <div className="p-2.5 rounded-xl border border-construct-border bg-construct-surface shadow-subtle">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-construct-text text-white flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser?.full_name?.charAt(0) || "U"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-construct-text truncate leading-tight">
                  {currentUser?.full_name || "Active Personnel"}
                </p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold tracking-wider uppercase ${
                    currentUserRole === "super_admin"
                      ? "bg-purple-100 text-purple-800"
                      : currentUserRole === "project_manager"
                      ? "bg-orange-100 text-construct-orange"
                      : currentUserRole === "site_engineer"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-blue-100 text-blue-800"
                  }`}>
                    {currentUserRole.replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.href = "/login";
                }
              }}
              title="Sign Out"
              className="p-1.5 rounded-lg border border-construct-border bg-construct-bg hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-construct-secondary transition-colors shrink-0 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[10px] font-mono text-construct-secondary truncate mt-2 opacity-80">
            {currentUser?.email}
          </p>
        </div>
      </div>
    </aside>
  );
}
