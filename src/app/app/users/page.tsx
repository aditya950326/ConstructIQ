"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { repository } from "@/lib/data/repository";
import { Profile } from "@/types/database";
import {
  Users,
  ShieldCheck,
  HardHat,
  Briefcase,
  UserCheck,
  Check,
  Mail,
  Phone,
  Building2,
  Lock,
} from "lucide-react";

export default function UsersDirectoryPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);

  useEffect(() => {
    setProfiles(repository.getProfiles());
    setCurrentUser(repository.getCurrentUser());
  }, []);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return (
          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-200">
            SUPER ADMIN
          </span>
        );
      case "project_manager":
        return (
          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-100 text-construct-orange border border-orange-200">
            PROJECT MANAGER
          </span>
        );
      case "site_engineer":
        return (
          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            SITE ENGINEER
          </span>
        );
      case "site_supervisor":
        return (
          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
            SITE SUPERVISOR
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <AppShell
      title="Enterprise Personnel & Access Directory"
      subtitle="Role-Based Security, Site Personnel Rosters & Access Governance"
    >
      {/* Current Active Session Status */}
      <div className="bg-construct-surface border border-construct-border rounded-xl p-6 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-construct-text text-white flex items-center justify-center font-bold text-base shadow-sm">
            {currentUser?.full_name?.charAt(0) || "U"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-heading font-extrabold text-construct-text">
                {currentUser?.full_name}
              </h3>
              {currentUser && getRoleBadge(currentUser.role)}
            </div>
            <p className="text-xs text-construct-secondary mt-0.5 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" />
              <span className="font-mono">{currentUser?.email}</span>
              {currentUser?.phone && (
                <>
                  <span>•</span>
                  <Phone className="w-3.5 h-3.5" />
                  <span className="font-mono">{currentUser.phone}</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="text-right text-xs">
          <span className="px-3 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold font-mono inline-block">
            AUTHENTICATED SESSION ACTIVE
          </span>
        </div>
      </div>

      {/* Personnel Roster */}
      <div className="bg-construct-surface border border-construct-border rounded-xl shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-construct-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-construct-orange" />
            <h3 className="font-heading font-bold text-sm text-construct-text">
              Active Construction Personnel Directory
            </h3>
          </div>
          <span className="text-xs font-mono text-construct-secondary">
            {profiles.length} Authorized Users Enrolled
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-construct-border bg-construct-bg text-[11px] font-mono font-bold text-construct-secondary">
                <th className="py-3 px-4">PERSONNEL NAME</th>
                <th className="py-3 px-4">ASSIGNED ROLE</th>
                <th className="py-3 px-4">LOGIN EMAIL</th>
                <th className="py-3 px-4">PHONE NUMBER</th>
                <th className="py-3 px-4">AUTHENTICATION STATE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-construct-border/60">
              {profiles.map((p) => (
                <tr key={p.id} className="hover:bg-construct-muted/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-construct-text flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-construct-muted flex items-center justify-center text-xs font-bold text-construct-text">
                      {p.full_name.charAt(0)}
                    </div>
                    <span>{p.full_name}</span>
                  </td>
                  <td className="py-3 px-4">{getRoleBadge(p.role)}</td>
                  <td className="py-3 px-4 font-mono text-construct-secondary">{p.email}</td>
                  <td className="py-3 px-4 font-mono text-construct-secondary">{p.phone || "—"}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                      <Check className="w-3.5 h-3.5" /> Credentialed
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role-Based Permissions Matrix */}
      <div className="bg-construct-surface border border-construct-border rounded-xl shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-construct-border flex items-center justify-between">
          <h3 className="font-heading font-bold text-sm text-construct-text">
            Enterprise Security & Permissions Matrix
          </h3>
          <span className="text-xs font-mono text-construct-secondary">
            Row Level Security (RLS) & Access Control
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-construct-border bg-construct-bg text-[11px] font-mono font-bold text-construct-secondary">
                <th className="py-3 px-4">MODULE / CAPABILITY</th>
                <th className="py-3 px-4 text-center">SUPER ADMIN</th>
                <th className="py-3 px-4 text-center">PROJECT MANAGER</th>
                <th className="py-3 px-4 text-center">SITE ENGINEER</th>
                <th className="py-3 px-4 text-center">SITE SUPERVISOR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-construct-border/60">
              {[
                { feature: "Assign Project Manager with Email & Password", admin: true, pm: false, eng: false, supervisor: false },
                { feature: "Assign Site Engineer & Site Supervisor", admin: true, pm: true, eng: false, supervisor: false },
                { feature: "Record Daily Labor Attendance & Headcounts", admin: true, pm: true, eng: true, supervisor: true },
                { feature: "Upload Work-Done Photos & Visual Evidence", admin: true, pm: true, eng: true, supervisor: true },
                { feature: "Upload Site Videos (Drone & Compaction Footage)", admin: true, pm: true, eng: true, supervisor: true },
                { feature: "Upload Site Bills, Petty Cash & Delivery Challans", admin: true, pm: true, eng: true, supervisor: true },
                { feature: "Record Detailed Daily Site Logs & WBS Outputs", admin: true, pm: true, eng: true, supervisor: false },
                { feature: "Review & Sign-Off Reported Physical Quantities", admin: true, pm: true, eng: false, supervisor: false },
                { feature: "Warehouse Stock Inward Receipts & Issues", admin: true, pm: true, eng: true, supervisor: false },
                { feature: "Commercial Cost Vouchers & Subcontractor Sign-Off", admin: true, pm: true, eng: false, supervisor: false },
                { feature: "Raise Quality Defects & Safety Stop-Work Orders", admin: true, pm: true, eng: true, supervisor: false },
                { feature: "Delay-Risk Intelligence & Schedule Diagnostics", admin: true, pm: true, eng: false, supervisor: false },
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-construct-muted/40 transition-colors">
                  <td className="py-3 px-4 font-semibold text-construct-text">{row.feature}</td>
                  <td className="py-3 px-4 text-center">
                    {row.admin ? <Check className="w-4 h-4 text-purple-700 mx-auto" /> : <span className="text-construct-secondary">—</span>}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {row.pm ? <Check className="w-4 h-4 text-construct-orange mx-auto" /> : <span className="text-construct-secondary">—</span>}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {row.eng ? <Check className="w-4 h-4 text-emerald-700 mx-auto" /> : <span className="text-construct-secondary">—</span>}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {row.supervisor ? <Check className="w-4 h-4 text-blue-700 mx-auto" /> : <span className="text-construct-secondary">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
