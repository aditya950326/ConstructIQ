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
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft,
  ChevronRight,
  X,
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

  // Collapsed & Mobile States with persistent storage
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    // Restore collapsed preference
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("constructiq_sidebar_collapsed");
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    }

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

    // Toggle listener from header or shortcut
    const handleToggleSidebar = () => {
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        setIsMobileOpen((prev) => !prev);
      } else {
        setIsCollapsed((prev) => {
          const next = !prev;
          if (typeof window !== "undefined") {
            localStorage.setItem("constructiq_sidebar_collapsed", String(next));
          }
          return next;
        });
      }
    };

    // Keyboard shortcut: Ctrl+B / Cmd+B
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        handleToggleSidebar();
      }
    };

    window.addEventListener("constructiq-role-change", syncSidebar);
    window.addEventListener("constructiq-data-update", syncSidebar);
    window.addEventListener("constructiq-toggle-sidebar", handleToggleSidebar);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("storage", syncSidebar);

    return () => {
      window.removeEventListener("constructiq-role-change", syncSidebar);
      window.removeEventListener("constructiq-data-update", syncSidebar);
      window.removeEventListener("constructiq-toggle-sidebar", handleToggleSidebar);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("storage", syncSidebar);
    };
  }, [activeProjectId]);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("constructiq_sidebar_collapsed", String(next));
      }
      return next;
    });
  };

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
    { label: "Labor Muster & Wages", href: "/app/supervisor?tab=attendance", icon: Users, tag: "Pay" },
    { label: "Work Photos & Videos", href: "/app/supervisor?tab=photos", icon: Camera },
    { label: "Upload Bills & Receipts", href: "/app/supervisor?tab=bills", icon: Receipt },
  ];

  // Navigation for Management & Engineers (Admin, PM, Site Engineer)
  const standardNavLinks: NavItem[] = [
    { label: "Overview", href: "/app/overview", icon: LayoutDashboard },
    { label: "Personnel & Roles", href: "/app/users", icon: Users, tag: "Admin" },
    { label: "Project Team", href: `/app/projects/${pId}/team`, icon: ShieldCheck, tag: "RBAC" },
    { label: "Labor Muster & Wages", href: "/app/supervisor?tab=attendance", icon: Users, tag: "Wages" },
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
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300"
        />
      )}

      {/* Main Animated Sidebar Container */}
      <aside
        className={`fixed md:relative top-0 bottom-0 left-0 z-50 flex flex-col h-screen select-none border-r border-construct-border bg-construct-surface text-construct-text transition-all duration-300 ease-in-out shadow-elevated md:shadow-none ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } ${isCollapsed ? "w-[72px]" : "w-64"}`}
      >
        {/* Brand Header */}
        <div
          className={`h-16 flex items-center border-b border-construct-border shrink-0 transition-all duration-300 ${
            isCollapsed ? "justify-center px-2" : "justify-between px-4"
          }`}
        >
          <a
            href="/"
            className="flex items-center overflow-hidden transition-all duration-300 hover:opacity-90"
            title="ConstructIQ Home"
          >
            <Logo size="md" showWordmark={!isCollapsed} />
          </a>

          {/* Desktop Collapse / Expand Toggle Button */}
          <button
            type="button"
            onClick={toggleCollapse}
            className={`hidden md:flex p-1.5 rounded-lg text-construct-secondary hover:text-construct-text hover:bg-construct-muted transition-colors cursor-pointer ${
              isCollapsed ? "mt-1" : ""
            }`}
            title={isCollapsed ? "Expand Sidebar [Ctrl+B]" : "Collapse Sidebar [Ctrl+B]"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-construct-secondary hover:text-construct-text hover:bg-construct-muted cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Project Switcher Bar */}
        <div className="p-2 border-b border-construct-border bg-construct-bg/50 relative">
          <button
            type="button"
            onClick={() => setShowProjectPicker(!showProjectPicker)}
            className={`w-full flex items-center rounded-lg border border-construct-border/80 bg-construct-surface hover:bg-construct-muted/60 transition-all shadow-subtle text-left cursor-pointer ${
              isCollapsed ? "justify-center p-2" : "justify-between p-2"
            }`}
            title={isCollapsed ? `${currentProject?.code || "PRJ"}: ${currentProject?.name}` : undefined}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="w-4 h-4 text-construct-orange shrink-0" />
              {!isCollapsed && (
                <div className="min-w-0 transition-opacity duration-200">
                  <p className="text-[10px] font-mono font-bold text-construct-secondary truncate">
                    {currentProject?.code || "SELECT PROJECT"}
                  </p>
                  <p className="text-xs font-bold text-construct-text truncate">
                    {currentProject?.name || "Loading..."}
                  </p>
                </div>
              )}
            </div>
            {!isCollapsed && <ChevronDown className="w-3.5 h-3.5 text-construct-secondary shrink-0" />}
          </button>

          {/* Project Dropdown */}
          {showProjectPicker && (
            <div
              className={`absolute top-14 z-30 bg-construct-surface border border-construct-border rounded-xl shadow-elevated py-1.5 animate-in fade-in zoom-in-95 duration-150 ${
                isCollapsed ? "left-2 w-56" : "left-2 right-2"
              }`}
            >
              <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-construct-secondary">
                Switch Active Project
              </div>
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectProject(p)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-construct-muted/60 transition-colors cursor-pointer ${
                    currentProject?.id === p.id ? "bg-construct-muted font-bold text-construct-orange" : "text-construct-text"
                  }`}
                >
                  <div className="min-w-0">
                    <span className="font-mono text-[10px] block text-construct-secondary">{p.code}</span>
                    <span className="truncate block font-semibold">{p.name}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1.5 scrollbar-thin">
          {!isCollapsed && (
            <div className="px-2.5 pb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-construct-secondary/70">
              {currentUserRole === "site_supervisor" ? "SUPERVISOR WORKFLOW" : "SITE WORKFLOW"}
            </div>
          )}

          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/app/overview" && item.href !== "/app/supervisor" && pathname.startsWith(item.href));

            return (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`group relative flex items-center rounded-xl text-xs font-medium transition-all duration-200 ${
                  isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2.5"
                } ${
                  isActive
                    ? item.highlight
                      ? "bg-construct-orange text-white shadow-sm font-bold"
                      : "bg-construct-muted text-construct-text border border-construct-border/80 font-bold"
                    : item.highlight
                    ? "text-construct-orange hover:bg-orange-50 font-bold"
                    : "text-construct-secondary hover:text-construct-text hover:bg-construct-muted/60"
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <div className={`flex items-center gap-2.5 min-w-0 ${isCollapsed ? "justify-center" : ""}`}>
                  <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${isActive && item.highlight ? "text-white" : ""}`} />
                  {!isCollapsed && (
                    <span className="truncate transition-opacity duration-200">
                      {item.label}
                    </span>
                  )}
                </div>

                {!isCollapsed && item.tag && (
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-construct-muted border border-construct-border text-construct-secondary">
                    {item.tag}
                  </span>
                )}

                {/* Hover Tooltip when Collapsed */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2.5 py-1 bg-construct-text text-white text-[11px] font-semibold rounded-md shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </a>
            );
          })}
        </nav>

        {/* Bottom Profile Footer */}
        <div className="p-2 border-t border-construct-border bg-construct-bg/60 shrink-0">
          <div className={`rounded-xl border border-construct-border bg-construct-surface shadow-subtle transition-all duration-200 ${
            isCollapsed ? "p-1.5 flex flex-col items-center gap-2" : "p-2.5"
          }`}>
            {isCollapsed ? (
              <>
                <div
                  className="w-8 h-8 rounded-full bg-construct-text text-white flex items-center justify-center font-bold text-xs shrink-0 relative cursor-pointer"
                  title={`${currentUser?.full_name} (${currentUserRole})`}
                >
                  {currentUser?.full_name?.charAt(0) || "U"}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-construct-surface" />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.location.href = "/login";
                    }
                  }}
                  title="Sign Out"
                  className="p-1.5 rounded-lg border border-construct-border bg-construct-bg hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-construct-secondary transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
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
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold tracking-wider uppercase ${
                            currentUserRole === "super_admin"
                              ? "bg-purple-100 text-purple-800"
                              : currentUserRole === "project_manager"
                              ? "bg-orange-100 text-construct-orange"
                              : currentUserRole === "site_engineer"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {currentUserRole.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
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
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
