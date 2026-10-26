"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { repository } from "@/lib/data/repository";
import { Project, Profile, UserRole } from "@/types/database";
import {
  ShieldCheck,
  Briefcase,
  HardHat,
  UserCheck,
  Plus,
  KeyRound,
  Mail,
  Phone,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
  Lock,
  Building2,
  Check,
  Copy,
} from "lucide-react";

function WhatsAppIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.888 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function ProjectTeamPage() {
  const params = useParams();
  const projectId = (params?.projectId as string) || "b0000000-0000-0000-0000-000000000001";

  const [project, setProject] = useState<Project | null>(null);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [projectManager, setProjectManager] = useState<Profile | undefined>(undefined);
  const [siteEngineers, setSiteEngineers] = useState<Profile[]>([]);
  const [siteSupervisors, setSiteSupervisors] = useState<Profile[]>([]);

  // Modals
  const [isPmModalOpen, setIsPmModalOpen] = useState(false);
  const [isPersonnelModalOpen, setIsPersonnelModalOpen] = useState(false);
  const [targetPersonnelRole, setTargetPersonnelRole] = useState<"site_engineer" | "site_supervisor">("site_engineer");

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    const handleSync = () => loadData();
    window.addEventListener("constructiq-role-change", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("constructiq-role-change", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [projectId]);

  const loadData = () => {
    const prj = repository.getProjectById(projectId);
    setProject(prj || null);
    const user = repository.getCurrentUser();
    setCurrentUser(user);

    const members = repository.getProjectMembers(projectId);
    setProjectManager(members.projectManager);
    setSiteEngineers(members.siteEngineers);
    setSiteSupervisors(members.siteSupervisors);
  };

  const isAdmin = currentUser?.role === "super_admin";
  const isPM = currentUser?.role === "project_manager" && (project?.project_manager_id === currentUser?.id || true);
  const canAssignPersonnel = isAdmin || isPM;

  const handleSavePM = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setFeedbackMsg({ type: "error", text: "Only Super Admin can assign or reassign Project Manager." });
      return;
    }

    const res = repository.assignProjectManager(projectId, {
      fullName,
      email,
      password,
      phone,
    });

    if (res.success) {
      setFeedbackMsg({
        type: "success",
        text: `Project Manager ${fullName} assigned successfully! They now have full access to ${project?.name || "this project"}.`,
      });
      setIsPmModalOpen(false);
      resetForm();
      loadData();
    } else {
      setFeedbackMsg({ type: "error", text: res.error || "Failed to assign Project Manager." });
    }
  };

  const handleSavePersonnel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAssignPersonnel) {
      setFeedbackMsg({ type: "error", text: "You need Super Admin or Project Manager privileges to assign personnel." });
      return;
    }

    const res = repository.assignSitePersonnel(projectId, targetPersonnelRole, {
      fullName,
      email,
      password,
      phone,
    });

    if (res.success) {
      const roleLabel = targetPersonnelRole === "site_engineer" ? "Site Engineer" : "Site Supervisor";
      setFeedbackMsg({
        type: "success",
        text: `${roleLabel} ${fullName} assigned successfully with their email & password!`,
      });
      setIsPersonnelModalOpen(false);
      resetForm();
      loadData();
    } else {
      setFeedbackMsg({ type: "error", text: res.error || "Failed to assign personnel." });
    }
  };

  const handleRemoveMember = (userId: string, name: string) => {
    if (!canAssignPersonnel) return;
    if (confirm(`Remove ${name} from this project?`)) {
      repository.removeProjectPersonnel(projectId, userId);
      loadData();
      setFeedbackMsg({ type: "success", text: `${name} has been removed from this project.` });
    }
  };

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setPassword("");
    setPhone("");
    setShowPassword(false);
  };

  const copyCredentials = (userEmail: string, userPass?: string) => {
    const text = `Email: ${userEmail}\nPassword: ${userPass || "Construct@123"}`;
    navigator.clipboard?.writeText(text);
    setCopiedEmail(userEmail);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const shareOnWhatsApp = (
    fullName: string,
    roleTitle: string,
    userEmail: string,
    userPass?: string,
    phoneNum?: string
  ) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://constructiq.io";
    const pass = userPass || "Construct@123";
    const message = [
      `🏗️ *ConstructIQ Site Portal — Authorized Access Credentials*`,
      ``,
      `Hello *${fullName}*,`,
      `Your access for *${project?.name || "the site"}* has been authorized on ConstructIQ:`,
      ``,
      `👤 *Role:* ${roleTitle}`,
      `📧 *Login Email:* ${userEmail}`,
      `🔑 *Password:* ${pass}`,
      `🌐 *Portal Login:* ${origin}/login`,
      ``,
      `_Strict Notice: Always upload Geotag photos/videos during daily site inspections._`,
    ].join("\n");

    const cleanPhone = (phoneNum || "").replace(/[^0-9]/g, "");
    const waUrl = cleanPhone && cleanPhone.length >= 10
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

    if (typeof window !== "undefined") {
      window.open(waUrl, "_blank");
    }
  };

  return (
    <AppShell
      title="Project Team & Access Governance"
      subtitle={`${project?.code || "PRJ"} • ${project?.name || "Project Space"}`}
      activeProjectId={projectId}
      headerActions={
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => {
                resetForm();
                setIsPmModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-construct-text text-white text-xs font-semibold hover:bg-black transition-colors shadow-sm"
            >
              <Briefcase className="w-3.5 h-3.5 text-construct-orange" />
              <span>Assign Project Manager</span>
            </button>
          )}

          {canAssignPersonnel && (
            <button
              onClick={() => {
                resetForm();
                setTargetPersonnelRole("site_engineer");
                setIsPersonnelModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-construct-orange text-white text-xs font-semibold hover:bg-construct-orangeHover transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Assign Site Personnel</span>
            </button>
          )}
        </div>
      }
    >
      {/* Feedback Alert */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            feedbackMsg.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span className="font-medium">{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-gray-400 hover:text-gray-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Access Hierarchy Overview Card */}
      <div className="bg-construct-surface border border-construct-border rounded-xl p-5 shadow-subtle">
        <div className="flex items-center gap-2.5 pb-3 border-b border-construct-border">
          <ShieldCheck className="w-5 h-5 text-purple-600" />
          <div>
            <h3 className="font-heading font-extrabold text-sm text-construct-text">
              ConstructIQ Role-Based Access Hierarchy (RBAC)
            </h3>
            <p className="text-xs text-construct-secondary">
              Strict permissions govern project assignments, daily site activities, and data access.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4 text-xs font-sans">
          <div className="p-3 rounded-lg bg-purple-50/60 border border-purple-200">
            <div className="flex items-center gap-2 font-bold text-purple-900">
              <ShieldCheck className="w-4 h-4 text-purple-700" />
              <span>Super Administrator</span>
            </div>
            <p className="text-[11px] text-purple-950 mt-1 leading-relaxed">
              Default: <span className="font-mono font-bold">adityabirare01@gmail.com</span>. Watches all working projects and has sole authority to assign the Project Manager with custom email & password.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-orange-50/60 border border-orange-200">
            <div className="flex items-center gap-2 font-bold text-construct-orange">
              <Briefcase className="w-4 h-4" />
              <span>Project Manager</span>
            </div>
            <p className="text-[11px] text-orange-950 mt-1 leading-relaxed">
              Full access to this particular project's data (Schedule, Logs, Materials, QA, Risk, Reports). Can assign Site Engineers and Site Supervisors with email & password.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200">
            <div className="flex items-center gap-2 font-bold text-emerald-800">
              <HardHat className="w-4 h-4" />
              <span>Site Engineer</span>
            </div>
            <p className="text-[11px] text-emerald-950 mt-1 leading-relaxed">
              Assigned to this project. Prepares and submits Daily Logs, uploads geocoded evidence/videos, verifies quantities, and manages QA defect resolutions.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200">
            <div className="flex items-center gap-2 font-bold text-blue-800">
              <UserCheck className="w-4 h-4" />
              <span>Site Supervisor</span>
            </div>
            <p className="text-[11px] text-blue-950 mt-1 leading-relaxed">
              Assigned to this project. Accesses Field Desk to record daily labor attendance headcounts, captures work done photos & videos, and uploads site vouchers.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: PROJECT MANAGER */}
      <div className="bg-construct-surface border border-construct-border rounded-xl p-6 shadow-subtle">
        <div className="flex items-center justify-between pb-4 border-b border-construct-border">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-orange-100 text-construct-orange">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-base text-construct-text">
                Assigned Project Manager
              </h3>
              <p className="text-xs text-construct-secondary">
                Project Manager has complete operational control and analytics access for this project.
              </p>
            </div>
          </div>

          {isAdmin ? (
            <button
              onClick={() => {
                resetForm();
                if (projectManager) {
                  setFullName(projectManager.full_name);
                  setEmail(projectManager.email);
                  setPassword(projectManager.password || "");
                  setPhone(projectManager.phone || "");
                }
                setIsPmModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg border border-construct-border hover:bg-construct-muted text-xs font-semibold text-construct-text transition-colors flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5 text-construct-orange" />
              <span>{projectManager ? "Reassign / Edit PM Credentials" : "Assign Project Manager"}</span>
            </button>
          ) : (
            <span className="text-[11px] font-mono text-construct-secondary px-2.5 py-1 rounded bg-construct-muted border border-construct-border">
              Managed by Super Admin
            </span>
          )}
        </div>

        {projectManager ? (
          <div className="mt-4 p-4 rounded-xl bg-construct-bg border border-construct-border/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-orange-500/10 border border-orange-200 text-construct-orange flex items-center justify-center font-bold text-lg">
                {projectManager.full_name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-heading font-bold text-sm text-construct-text">
                    {projectManager.full_name}
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-100 text-construct-orange border border-orange-200">
                    PROJECT MANAGER
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs font-mono text-construct-secondary">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-construct-secondary" />
                    {projectManager.email}
                  </span>
                  {projectManager.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-construct-secondary" />
                      {projectManager.phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold font-sans">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Full Project Data Access
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() =>
                  shareOnWhatsApp(
                    projectManager.full_name,
                    "Project Manager",
                    projectManager.email,
                    projectManager.password,
                    projectManager.phone
                  )
                }
                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 transition-colors shadow-xs cursor-pointer"
                title="Share credentials directly to WhatsApp"
              >
                <WhatsAppIcon className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={() => copyCredentials(projectManager.email, projectManager.password)}
                className="px-2.5 py-1.5 rounded-lg border border-construct-border hover:bg-construct-surface text-[11px] font-mono text-construct-secondary hover:text-construct-text flex items-center gap-1 transition-colors"
                title="Copy login email and password"
              >
                {copiedEmail === projectManager.email ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Login</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 p-8 rounded-xl border border-dashed border-construct-border text-center">
            <Briefcase className="w-8 h-8 text-construct-secondary mx-auto mb-2" />
            <p className="text-xs font-bold text-construct-text">No Project Manager assigned yet</p>
            <p className="text-[11px] text-construct-secondary mt-0.5">
              Super Admin can assign a Project Manager with login email and password to manage this site.
            </p>
          </div>
        )}
      </div>

      {/* SECTION 2 & 3: SITE ENGINEERS & SUPERVISORS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Site Engineers */}
        <div className="bg-construct-surface border border-construct-border rounded-xl p-6 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-construct-border">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                  <HardHat className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-heading font-extrabold text-sm text-construct-text">
                    Site Engineers ({siteEngineers.length})
                  </h4>
                  <p className="text-[11px] text-construct-secondary">Daily logs, QA checklists, evidence uploads</p>
                </div>
              </div>

              {canAssignPersonnel && (
                <button
                  onClick={() => {
                    resetForm();
                    setTargetPersonnelRole("site_engineer");
                    setIsPersonnelModalOpen(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 flex items-center gap-1 transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Assign</span>
                </button>
              )}
            </div>

            <div className="divide-y divide-construct-border/60 mt-3 space-y-2">
              {siteEngineers.map((eng) => (
                <div key={eng.id} className="pt-2 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-construct-text">{eng.full_name}</p>
                    <p className="text-[11px] font-mono text-construct-secondary">{eng.email}</p>
                    {eng.phone && <p className="text-[10px] font-mono text-construct-secondary">{eng.phone}</p>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        shareOnWhatsApp(
                          eng.full_name,
                          "Site Engineer",
                          eng.email,
                          eng.password,
                          eng.phone
                        )
                      }
                      title="Share login credentials to WhatsApp"
                      className="p-1 rounded text-emerald-700 hover:text-white hover:bg-emerald-600 transition-colors cursor-pointer"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => copyCredentials(eng.email, eng.password)}
                      title="Copy login credentials"
                      className="p-1 rounded text-construct-secondary hover:text-construct-text hover:bg-construct-muted cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {canAssignPersonnel && (
                      <button
                        onClick={() => handleRemoveMember(eng.id, eng.full_name)}
                        title="Remove engineer"
                        className="p-1 rounded text-construct-secondary hover:text-red-600 hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Site Supervisors */}
        <div className="bg-construct-surface border border-construct-border rounded-xl p-6 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-construct-border">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-heading font-extrabold text-sm text-construct-text">
                    Site Supervisors ({siteSupervisors.length})
                  </h4>
                  <p className="text-[11px] text-construct-secondary">Attendance records, photos, site challans</p>
                </div>
              </div>

              {canAssignPersonnel && (
                <button
                  onClick={() => {
                    resetForm();
                    setTargetPersonnelRole("site_supervisor");
                    setIsPersonnelModalOpen(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 flex items-center gap-1 transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Assign</span>
                </button>
              )}
            </div>

            <div className="divide-y divide-construct-border/60 mt-3 space-y-2">
              {siteSupervisors.map((sup) => (
                <div key={sup.id} className="pt-2 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-construct-text">{sup.full_name}</p>
                    <p className="text-[11px] font-mono text-construct-secondary">{sup.email}</p>
                    {sup.phone && <p className="text-[10px] font-mono text-construct-secondary">{sup.phone}</p>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        shareOnWhatsApp(
                          sup.full_name,
                          "Site Supervisor",
                          sup.email,
                          sup.password,
                          sup.phone
                        )
                      }
                      title="Share login credentials to WhatsApp"
                      className="p-1 rounded text-emerald-700 hover:text-white hover:bg-emerald-600 transition-colors cursor-pointer"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => copyCredentials(sup.email, sup.password)}
                      title="Copy login credentials"
                      className="p-1 rounded text-construct-secondary hover:text-construct-text hover:bg-construct-muted cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {canAssignPersonnel && (
                      <button
                        onClick={() => handleRemoveMember(sup.id, sup.full_name)}
                        title="Remove supervisor"
                        className="p-1 rounded text-construct-secondary hover:text-red-600 hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: CREDENTIALS SUMMARY TABLE */}
      <div className="bg-construct-surface border border-construct-border rounded-xl shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-construct-border flex items-center justify-between">
          <div>
            <h3 className="font-heading font-bold text-sm text-construct-text">
              Project Personnel Authentication & Access Directory
            </h3>
            <p className="text-xs text-construct-secondary">
              All active users assigned to this project can authenticate at the ConstructIQ Sign In portal using their credentials.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-construct-border bg-construct-bg text-[11px] font-mono font-bold text-construct-secondary">
                <th className="py-3 px-4">NAME</th>
                <th className="py-3 px-4">ROLE</th>
                <th className="py-3 px-4">LOGIN EMAIL</th>
                <th className="py-3 px-4">PASSWORD STATUS</th>
                <th className="py-3 px-4">ACCESS SCOPE</th>
                <th className="py-3 px-4">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-construct-border/60">
              {/* Default Admin */}
              <tr className="hover:bg-purple-50/30 transition-colors">
                <td className="py-3 px-4 font-bold text-construct-text">Aditya Birare</td>
                <td className="py-3 px-4 font-mono font-bold text-purple-700">SUPER ADMIN</td>
                <td className="py-3 px-4 font-mono">adityabirare01@gmail.com</td>
                <td className="py-3 px-4 font-mono text-construct-secondary">Aditya@123</td>
                <td className="py-3 px-4 text-purple-900 font-medium">All Working Projects Oversight & PM Assignment</td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => copyCredentials("adityabirare01@gmail.com", "Aditya@123")}
                    className="text-[11px] font-mono text-purple-700 hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </td>
              </tr>

              {/* PM */}
              {projectManager && (
                <tr className="hover:bg-orange-50/30 transition-colors">
                  <td className="py-3 px-4 font-bold text-construct-text">{projectManager.full_name}</td>
                  <td className="py-3 px-4 font-mono font-bold text-construct-orange">PROJECT MANAGER</td>
                  <td className="py-3 px-4 font-mono">{projectManager.email}</td>
                  <td className="py-3 px-4 font-mono text-construct-secondary">
                    {projectManager.password ? "••••••••" : "Default Set"}
                  </td>
                  <td className="py-3 px-4 text-construct-text font-medium">Full Project Data, Approvals & Staff Assignment</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => copyCredentials(projectManager.email, projectManager.password)}
                      className="text-[11px] font-mono text-construct-orange hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                  </td>
                </tr>
              )}

              {/* Engineers */}
              {siteEngineers.map((eng) => (
                <tr key={eng.id} className="hover:bg-emerald-50/30 transition-colors">
                  <td className="py-3 px-4 font-bold text-construct-text">{eng.full_name}</td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-700">SITE ENGINEER</td>
                  <td className="py-3 px-4 font-mono">{eng.email}</td>
                  <td className="py-3 px-4 font-mono text-construct-secondary">
                    {eng.password ? "••••••••" : "Configured"}
                  </td>
                  <td className="py-3 px-4 text-construct-secondary">Daily Logs, QA Checklists & Video/Photo Uploads</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => copyCredentials(eng.email, eng.password)}
                      className="text-[11px] font-mono text-emerald-700 hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                  </td>
                </tr>
              ))}

              {/* Supervisors */}
              {siteSupervisors.map((sup) => (
                <tr key={sup.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="py-3 px-4 font-bold text-construct-text">{sup.full_name}</td>
                  <td className="py-3 px-4 font-mono font-bold text-blue-700">SITE SUPERVISOR</td>
                  <td className="py-3 px-4 font-mono">{sup.email}</td>
                  <td className="py-3 px-4 font-mono text-construct-secondary">
                    {sup.password ? "••••••••" : "Configured"}
                  </td>
                  <td className="py-3 px-4 text-construct-secondary">Field Desk Attendance, Work Photos & Challans</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => copyCredentials(sup.email, sup.password)}
                      className="text-[11px] font-mono text-blue-700 hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Assign Project Manager (Admin Only) */}
      {isPmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-construct-text/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-construct-surface border border-construct-border rounded-xl shadow-elevated p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-construct-border">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-construct-orange" />
                <h3 className="font-heading font-extrabold text-base text-construct-text">
                  Assign Project Manager
                </h3>
              </div>
              <button onClick={() => setIsPmModalOpen(false)} className="text-construct-secondary hover:text-construct-text">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePM} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-construct-text mb-1">Target Project</label>
                <div className="p-2 rounded-lg bg-construct-bg border border-construct-border font-mono text-xs">
                  {project?.code} • {project?.name}
                </div>
              </div>

              <div>
                <label className="block font-bold text-construct-text mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Arjun Gundge"
                  className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg text-xs focus:outline-none focus:border-construct-orange"
                />
              </div>

              <div>
                <label className="block font-bold text-construct-text mb-1">Login Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. pm.arjun@constructiq.io"
                  className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg text-xs focus:outline-none focus:border-construct-orange font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-construct-text mb-1">Set Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="e.g. Arjun@123"
                    className="w-full p-2 pr-9 border border-construct-border rounded-lg bg-construct-bg text-xs focus:outline-none focus:border-construct-orange font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-construct-secondary hover:text-construct-text"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-construct-text mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43211"
                  className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg text-xs focus:outline-none focus:border-construct-orange font-mono"
                />
              </div>

              <div className="pt-3 border-t border-construct-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPmModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-construct-border text-construct-secondary hover:bg-construct-muted text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-construct-text text-white text-xs font-semibold hover:bg-black transition-colors shadow-sm"
                >
                  Confirm PM Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Assign Site Personnel (Engineer or Supervisor) */}
      {isPersonnelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-construct-text/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-construct-surface border border-construct-border rounded-xl shadow-elevated p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-construct-border">
              <div className="flex items-center gap-2">
                {targetPersonnelRole === "site_engineer" ? (
                  <HardHat className="w-4 h-4 text-emerald-600" />
                ) : (
                  <UserCheck className="w-4 h-4 text-blue-600" />
                )}
                <h3 className="font-heading font-extrabold text-base text-construct-text">
                  Assign {targetPersonnelRole === "site_engineer" ? "Site Engineer" : "Site Supervisor"}
                </h3>
              </div>
              <button onClick={() => setIsPersonnelModalOpen(false)} className="text-construct-secondary hover:text-construct-text">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePersonnel} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-construct-text mb-1">Role Designation *</label>
                <select
                  value={targetPersonnelRole}
                  onChange={(e) => setTargetPersonnelRole(e.target.value as any)}
                  className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg text-xs font-semibold focus:outline-none focus:border-construct-orange"
                >
                  <option value="site_engineer">👷 Site Engineer (Technical QA & Daily Logs)</option>
                  <option value="site_supervisor">📋 Site Supervisor (Field Attendance & Photos/Bills)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-construct-text mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={targetPersonnelRole === "site_engineer" ? "e.g. Kalyani Jadhav" : "e.g. Ramesh Patil"}
                  className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg text-xs focus:outline-none focus:border-construct-orange"
                />
              </div>

              <div>
                <label className="block font-bold text-construct-text mb-1">Login Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. engineer@constructiq.io"
                  className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg text-xs focus:outline-none focus:border-construct-orange font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-construct-text mb-1">Set Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="e.g. Password@123"
                    className="w-full p-2 pr-9 border border-construct-border rounded-lg bg-construct-bg text-xs focus:outline-none focus:border-construct-orange font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-construct-secondary hover:text-construct-text"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-construct-text mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43212"
                  className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg text-xs focus:outline-none focus:border-construct-orange font-mono"
                />
              </div>

              <div className="pt-3 border-t border-construct-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPersonnelModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-construct-border text-construct-secondary hover:bg-construct-muted text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-construct-orange text-white text-xs font-semibold hover:bg-construct-orangeHover transition-colors shadow-sm"
                >
                  Assign & Grant Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
