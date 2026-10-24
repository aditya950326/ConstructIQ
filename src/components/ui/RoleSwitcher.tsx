"use client";

import React, { useState, useEffect } from "react";
import { repository } from "@/lib/data/repository";
import { UserRole } from "@/types/database";
import { ShieldCheck, HardHat, Briefcase, UserCheck } from "lucide-react";

export function RoleSwitcher() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>("super_admin");

  useEffect(() => {
    const syncRole = () => {
      const user = repository.getCurrentUser();
      setCurrentUser(user);
      setCurrentRole(user.role);
    };
    syncRole();
    window.addEventListener("constructiq-role-change", syncRole);
    window.addEventListener("storage", syncRole);
    return () => {
      window.removeEventListener("constructiq-role-change", syncRole);
      window.removeEventListener("storage", syncRole);
    };
  }, []);

  const handleRoleChange = (newRole: UserRole) => {
    repository.setCurrentUserRole(newRole);
    setCurrentRole(newRole);
    if (newRole === "site_supervisor") {
      window.location.href = "/app/supervisor";
    } else if (window.location.pathname.startsWith("/app/supervisor")) {
      window.location.href = "/app/overview";
    } else {
      window.location.reload();
    }
  };

  const roles: Array<{ role: UserRole; label: string; icon: any; color: string }> = [
    { role: "super_admin", label: "Admin", icon: ShieldCheck, color: "text-purple-600 bg-purple-50" },
    { role: "project_manager", label: "PM", icon: Briefcase, color: "text-construct-orange bg-orange-50" },
    { role: "site_engineer", label: "Eng", icon: HardHat, color: "text-emerald-600 bg-emerald-50" },
    { role: "site_supervisor", label: "Supervisor", icon: UserCheck, color: "text-blue-700 bg-blue-50" },
  ];

  return (
    <div className="p-2.5 rounded-lg border border-construct-border bg-construct-surface shadow-subtle">
      <div className="flex items-center justify-between mb-1.5 px-0.5">
        <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-construct-secondary">
          Active Persona
        </span>
        <span className="text-[9px] font-mono text-emerald-600 font-bold uppercase">Online</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5 mb-2">
        {roles.map(({ role, label, icon: Icon, color }) => {
          const isActive = currentRole === role;
          return (
            <button
              key={role}
              onClick={() => handleRoleChange(role)}
              title={`Switch persona to ${label}`}
              className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded text-xs font-medium transition-all ${
                isActive
                  ? `${color} border border-construct-border/80 shadow-sm font-bold`
                  : "text-construct-secondary hover:text-construct-text hover:bg-construct-muted/60"
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
      {currentUser && (
        <div className="pt-2 border-t border-construct-border/60 text-[10px] font-mono text-construct-secondary truncate">
          <span className="text-construct-text font-bold block truncate">{currentUser.full_name}</span>
          <span className="truncate block opacity-80">{currentUser.email}</span>
        </div>
      )}
    </div>
  );
}
