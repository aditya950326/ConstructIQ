"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { repository } from "@/lib/data/repository";
import { Profile, UserRole, Project } from "@/types/database";
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
  Plus,
  Edit2,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  X,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  RefreshCw,
  Search,
} from "lucide-react";

function WhatsAppIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.888 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function UsersDirectoryPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<UserRole>("site_engineer");
  const [formPhone, setFormPhone] = useState("");
  const [formProjectIds, setFormProjectIds] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState<{ [id: string]: boolean }>({});

  // Feedback notifications
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = () => {
    setProfiles(repository.getProfiles());
    setProjects(repository.getProjects());
    setCurrentUser(repository.getCurrentUser());
  };

  useEffect(() => {
    loadData();
    const handleSync = () => loadData();
    window.addEventListener("constructiq-role-change", handleSync);
    window.addEventListener("constructiq-data-update", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("constructiq-role-change", handleSync);
      window.removeEventListener("constructiq-data-update", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  const isAdmin = currentUser?.role === "super_admin";

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
        return (
          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-gray-100 text-gray-800 border border-gray-200">
            {role.toUpperCase()}
          </span>
        );
    }
  };

  const getRoleTitle = (role: UserRole) => {
    switch (role) {
      case "super_admin":
        return "Super Administrator";
      case "project_manager":
        return "Project Manager";
      case "site_engineer":
        return "Site Engineer";
      case "site_supervisor":
        return "Site Supervisor";
      default:
        return role;
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setEditingUserId(null);
    setFormName("");
    setFormEmail("");
    setFormPassword("Construct@" + Math.floor(100 + Math.random() * 900));
    setFormRole("site_engineer");
    setFormPhone("+91 ");
    setFormProjectIds(projects.length > 0 ? [projects[0].id] : []);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const openEditModal = (profile: Profile) => {
    setIsEditing(true);
    setEditingUserId(profile.id);
    setFormName(profile.full_name);
    setFormEmail(profile.email);
    setFormPassword(profile.password || "");
    setFormRole(profile.role);
    setFormPhone(profile.phone || "");
    setFormProjectIds(profile.assigned_project_ids || (projects.length > 0 ? [projects[0].id] : []));
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent, shareViaWhatsAppImmediately: boolean = false) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      setFeedback({ type: "error", message: "Full Name and Email are required." });
      return;
    }

    if (isEditing && editingUserId) {
      const res = repository.updateProfile(editingUserId, {
        full_name: formName,
        email: formEmail,
        password: formPassword,
        role: formRole,
        phone: formPhone,
        assigned_project_ids: formProjectIds,
      });

      if (!res.success) {
        setFeedback({ type: "error", message: res.error || "Failed to update user." });
        return;
      }

      setFeedback({
        type: "success",
        message: `User ${formName} successfully updated with role: ${getRoleTitle(formRole)}.`,
      });
      loadData();
      setIsModalOpen(false);

      if (shareViaWhatsAppImmediately) {
        handleWhatsAppShare(formName, formRole, formEmail, formPassword, formPhone);
      }
    } else {
      const res = repository.createProfile({
        full_name: formName,
        email: formEmail,
        password: formPassword,
        role: formRole,
        phone: formPhone,
        assigned_project_ids: formProjectIds,
      });

      if (!res.success) {
        setFeedback({ type: "error", message: res.error || "Failed to add user." });
        return;
      }

      setFeedback({
        type: "success",
        message: `New role & personnel ${formName} successfully created and registered!`,
      });
      loadData();
      setIsModalOpen(false);

      if (shareViaWhatsAppImmediately) {
        handleWhatsAppShare(formName, formRole, formEmail, formPassword, formPhone);
      }
    }
  };

  const handleDeleteUser = (userId: string, name: string) => {
    if (!isAdmin) {
      setFeedback({ type: "error", message: "Only Super Admin can remove personnel roles." });
      return;
    }

    if (confirm(`Are you sure you want to delete access for ${name}?`)) {
      const res = repository.deleteProfile(userId);
      if (res.success) {
        setFeedback({ type: "success", message: `Access revoked and profile removed for ${name}.` });
        loadData();
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to delete user." });
      }
    }
  };

  const handleWhatsAppShare = (
    fullName: string,
    role: UserRole,
    userEmail: string,
    userPass?: string,
    phoneNum?: string
  ) => {
    const cleanPhone = (phoneNum || "").replace(/[^0-9]/g, "");

    // For non-admin team members: connect on WhatsApp WITHOUT exposing login email ID or password
    if (!isAdmin) {
      const roleTitle = getRoleTitle(role);
      const contactMsg = `Hello ${fullName} (${roleTitle}), reaching out regarding ConstructIQ project site operations.`;
      const waUrl =
        cleanPhone && cleanPhone.length >= 10
          ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(contactMsg)}`
          : `https://api.whatsapp.com/send?text=${encodeURIComponent(contactMsg)}`;

      if (typeof window !== "undefined") {
        window.open(waUrl, "_blank");
      }
      return;
    }

    const origin = typeof window !== "undefined" ? window.location.origin : "https://constructiq.io";
    const roleTitle = getRoleTitle(role);
    const pass = userPass || "Aditya@123";

    const message = [
      `🏗️ *ConstructIQ Site Portal — Authorized Access Credentials*`,
      ``,
      `Hello *${fullName}*,`,
      `Your credentials for the ConstructIQ Enterprise Construction Portal have been created/updated:`,
      ``,
      `👤 *Assigned Role:* ${roleTitle}`,
      `📧 *Login Email:* ${userEmail}`,
      `🔑 *Password:* ${pass}`,
      `🌐 *Sign In Portal:* ${origin}/login`,
      ``,
      `_Strict notice: Please strictly upload Geotag photos & recordings during daily site activities._`,
    ].join("\n");

    const waUrl =
      cleanPhone && cleanPhone.length >= 10
        ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
        : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

    if (typeof window !== "undefined") {
      window.open(waUrl, "_blank");
    }
  };

  const copyCredentials = (user: Profile) => {
    if (!isAdmin) {
      setFeedback({
        type: "error",
        message: "Access restricted: Login passwords can only be viewed and copied by Super Admin.",
      });
      return;
    }
    const text = `ConstructIQ Login Credentials:\nRole: ${getRoleTitle(user.role)}\nEmail: ${user.email}\nPassword: ${user.password || "Aditya@123"}\nLogin: ${window.location.origin}/login`;
    navigator.clipboard?.writeText(text);
    setCopiedId(user.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredProfiles = profiles.filter((p) => {
    if (roleFilter !== "all" && p.role !== roleFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.full_name.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      (p.phone && p.phone.toLowerCase().includes(q))
    );
  });

  return (
    <AppShell
      title="Enterprise Personnel & Role Management"
      subtitle="Administrator Dashboard: Assign Roles, Update Passwords & Share Credentials via WhatsApp"
      headerActions={
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-construct-orange text-white text-xs font-semibold hover:bg-construct-orangeHover shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Personnel / Role</span>
            </button>
          )}
        </div>
      }
    >
      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between animate-in fade-in duration-150 ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-800"
              : "bg-red-50 border-red-300 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-gray-400 hover:text-gray-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Admin Session Summary Banner */}
      <div className="bg-construct-surface border border-construct-border rounded-xl p-5 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-construct-text text-white flex items-center justify-center font-bold text-lg shadow-sm">
            {currentUser?.full_name?.charAt(0) || "A"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-heading font-extrabold text-construct-text">
                {currentUser?.full_name}
              </h3>
              {currentUser && getRoleBadge(currentUser.role)}
            </div>
            <p className="text-xs text-construct-secondary mt-0.5 flex flex-wrap items-center gap-2">
              <Mail className="w-3.5 h-3.5" />
              <span className="font-mono text-construct-text font-bold">{currentUser?.email}</span>
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

        <div className="flex items-center gap-3">
          <div className="text-right text-xs">
            <span
              className={`px-3 py-1 rounded-md font-bold font-mono inline-block ${
                isAdmin
                  ? "bg-purple-50 text-purple-900 border border-purple-200"
                  : "bg-slate-100 text-slate-800 border border-slate-300"
              }`}
            >
              {isAdmin ? "ADMIN CONTROL PANEL" : "AUTHORIZED TEAM DIRECTORY"}
            </span>
          </div>
        </div>
      </div>

      {/* Role-Based Privacy Notice for Non-Admin Viewers */}
      {!isAdmin && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs flex items-center gap-2.5 text-blue-900 shadow-xs">
          <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
          <span>
            <strong>Role-Based Privacy:</strong> Login Email IDs &amp; Passwords are restricted exclusively to Super Admin. Team members only view colleagues&apos; names, contact numbers, and working posts/designations.
          </span>
        </div>
      )}

      {/* Personnel Roster & Quick Controls */}
      <div className="bg-construct-surface border border-construct-border rounded-xl shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-construct-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-construct-orange" />
            <h3 className="font-heading font-bold text-sm text-construct-text">
              Active Authorized Personnel Roster
            </h3>
            <span className="ml-2 text-xs font-mono font-bold text-construct-secondary px-2 py-0.5 rounded bg-construct-muted">
              {filteredProfiles.length} Users
            </span>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-construct-secondary absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder={isAdmin ? "Search name, email, phone..." : "Search name, phone..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-construct-border bg-construct-bg text-construct-text focus:outline-none focus:border-construct-orange w-48 sm:w-60"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 rounded-lg border border-construct-border bg-construct-bg text-construct-text focus:outline-none focus:border-construct-orange font-medium"
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="project_manager">Project Manager</option>
              <option value="site_engineer">Site Engineer</option>
              <option value="site_supervisor">Site Supervisor</option>
            </select>
          </div>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              {isAdmin ? (
                <tr className="border-b border-construct-border bg-construct-bg text-[11px] font-mono font-bold text-construct-secondary">
                  <th className="py-3 px-4">PERSONNEL</th>
                  <th className="py-3 px-4">ASSIGNED ROLE</th>
                  <th className="py-3 px-4">LOGIN EMAIL</th>
                  <th className="py-3 px-4">PASSWORD</th>
                  <th className="py-3 px-4">WHATSAPP / PHONE</th>
                  <th className="py-3 px-4 text-right">ADMIN ACTIONS</th>
                </tr>
              ) : (
                <tr className="border-b border-construct-border bg-construct-bg text-[11px] font-mono font-bold text-construct-secondary">
                  <th className="py-3 px-4">PERSONNEL (NAME)</th>
                  <th className="py-3 px-4">POST / DESIGNATION</th>
                  <th className="py-3 px-4">CONTACT NUMBER</th>
                  <th className="py-3 px-4 text-right">CONNECT</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-construct-border/60">
              {filteredProfiles.map((p) => {
                const isPasswordRevealed = revealedPasswords[p.id];
                const displayPassword = p.password || "Aditya@123";

                if (!isAdmin) {
                  // Non-admin view: ONLY show name, post/role they are working on, and contact phone number. Passwords & login IDs are hidden!
                  return (
                    <tr key={p.id} className="hover:bg-construct-muted/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-construct-text">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-construct-text text-white flex items-center justify-center text-xs font-bold shrink-0">
                            {p.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-heading font-bold text-construct-text leading-tight">{p.full_name}</p>
                            <span className="text-[10px] font-mono text-construct-secondary">ID: {p.id.slice(0, 12)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">{getRoleBadge(p.role)}</td>
                      <td className="py-3.5 px-4 font-mono">
                        {p.phone ? (
                          <span className="text-construct-text font-bold text-xs">{p.phone}</span>
                        ) : (
                          <span className="text-construct-secondary/60 italic text-xs font-sans">Not provided</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {p.phone ? (
                          <button
                            type="button"
                            onClick={() => handleWhatsAppShare(p.full_name, p.role, p.email, undefined, p.phone)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                            title={`Chat with ${p.full_name} on WhatsApp`}
                          >
                            <WhatsAppIcon className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-construct-secondary italic">No direct number</span>
                        )}
                      </td>
                    </tr>
                  );
                }

                // Super Admin View: Full control with Login Email, Password (toggleable), and Admin Actions
                return (
                  <tr key={p.id} className="hover:bg-construct-muted/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-construct-text">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-construct-text text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {p.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-heading font-bold text-construct-text leading-tight">{p.full_name}</p>
                          <span className="text-[10px] font-mono text-construct-secondary">ID: {p.id.slice(0, 12)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">{getRoleBadge(p.role)}</td>
                    <td className="py-3 px-4 font-mono text-construct-text font-medium">{p.email}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <span className="bg-construct-bg px-2 py-0.5 rounded border border-construct-border/70 select-all font-semibold">
                          {isPasswordRevealed ? displayPassword : "••••••••"}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setRevealedPasswords((prev) => ({
                              ...prev,
                              [p.id]: !prev[p.id],
                            }))
                          }
                          className="p-1 rounded text-construct-secondary hover:text-construct-text cursor-pointer"
                          title={isPasswordRevealed ? "Hide Password" : "Show Password"}
                        >
                          {isPasswordRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-construct-secondary">
                      {p.phone ? (
                        <span className="text-construct-text font-medium">{p.phone}</span>
                      ) : (
                        <span className="text-construct-secondary/60 italic">Not provided</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Direct WhatsApp Share Button */}
                        <button
                          type="button"
                          onClick={() => handleWhatsAppShare(p.full_name, p.role, p.email, p.password, p.phone)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                          title="Share login email & password directly to WhatsApp"
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>

                        {/* Copy Credentials Button */}
                        <button
                          type="button"
                          onClick={() => copyCredentials(p)}
                          className="p-1.5 rounded-lg border border-construct-border text-construct-secondary hover:text-construct-text hover:bg-construct-surface transition-colors cursor-pointer"
                          title="Copy login details"
                        >
                          {copiedId === p.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>

                        {/* Edit Role & Credentials Button */}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => openEditModal(p)}
                            className="p-1.5 rounded-lg border border-construct-border text-construct-secondary hover:text-construct-orange hover:bg-orange-50/80 transition-colors cursor-pointer"
                            title="Edit Role, Email ID or Password"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Delete Button */}
                        {isAdmin && p.id !== currentUser?.id && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(p.id, p.full_name)}
                            className="p-1.5 rounded-lg border border-construct-border text-construct-secondary hover:text-red-600 hover:bg-red-50/80 transition-colors cursor-pointer"
                            title="Revoke user access"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role-Based Permissions Matrix */}
      <div className="bg-construct-surface border border-construct-border rounded-xl shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-construct-border flex items-center justify-between">
          <h3 className="font-heading font-bold text-sm text-construct-text flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Enterprise Security & Permissions Matrix</span>
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
                { feature: "Manage Personnel Roles, Email IDs & Passwords", admin: true, pm: false, eng: false, supervisor: false },
                { feature: "Direct WhatsApp Credential Dispatch", admin: true, pm: true, eng: false, supervisor: false },
                { feature: "Assign Project Manager with Email & Password", admin: true, pm: false, eng: false, supervisor: false },
                { feature: "Assign Site Engineer & Site Supervisor", admin: true, pm: true, eng: false, supervisor: false },
                { feature: "Record Daily Labor Attendance & Headcounts", admin: true, pm: true, eng: true, supervisor: true },
                { feature: "Upload Work-Done Photos & Visual Evidence (Geotag Mandatory)", admin: true, pm: true, eng: true, supervisor: true },
                { feature: "Upload Site Videos (Drone & Compaction Footage)", admin: true, pm: true, eng: true, supervisor: true },
                { feature: "Upload Site Bills, Petty Cash & Delivery Challans", admin: true, pm: true, eng: true, supervisor: true },
                { feature: "Record Detailed Daily Site Logs & WBS Outputs", admin: true, pm: true, eng: true, supervisor: false },
                { feature: "Review & Sign-Off Reported Physical Quantities", admin: true, pm: true, eng: false, supervisor: false },
                { feature: "Warehouse Stock Inward Receipts & Issues", admin: true, pm: true, eng: true, supervisor: false },
                { feature: "Commercial Cost Vouchers & Subcontractor Sign-Off", admin: true, pm: true, eng: false, supervisor: false },
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

      {/* Modal: Add or Edit Personnel Role & Credentials */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-construct-text/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-construct-surface border border-construct-border rounded-2xl shadow-elevated p-6 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-construct-border">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-orange-100 text-construct-orange">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-base text-construct-text">
                    {isEditing ? "Edit Role, Email ID & Password" : "Add New Role & Personnel"}
                  </h3>
                  <p className="text-[11px] text-construct-secondary">
                    Administrator Governance & WhatsApp Direct Dispatch
                  </p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-construct-secondary hover:text-construct-text cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => handleSaveUser(e, false)} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-construct-text mb-1">Full Personnel Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Vikram Malhotra / Ramesh Patil"
                  className="w-full p-2.5 border border-construct-border rounded-lg bg-construct-bg text-xs font-semibold focus:outline-none focus:border-construct-orange"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-construct-text mb-1">Designated Role *</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full p-2.5 border border-construct-border rounded-lg bg-construct-bg text-xs font-bold focus:outline-none focus:border-construct-orange"
                  >
                    <option value="super_admin">👑 Super Administrator</option>
                    <option value="project_manager">💼 Project Manager</option>
                    <option value="site_engineer">👷 Site Engineer</option>
                    <option value="site_supervisor">📋 Site Supervisor</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-construct-text mb-1">WhatsApp / Phone Number</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full p-2.5 border border-construct-border rounded-lg bg-construct-bg font-mono text-xs focus:outline-none focus:border-construct-orange"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-construct-text mb-1">Authorized Login Email ID *</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="personnel@constructiq.io"
                  className="w-full p-2.5 border border-construct-border rounded-lg bg-construct-bg font-mono text-xs focus:outline-none focus:border-construct-orange"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-construct-text">System Password *</label>
                  <button
                    type="button"
                    onClick={() => setFormPassword("Construct@" + Math.floor(100 + Math.random() * 900))}
                    className="text-[10px] font-mono text-construct-orange hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Generate Password
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Enter password..."
                    className="w-full p-2.5 pr-10 border border-construct-border rounded-lg bg-construct-bg font-mono text-xs focus:outline-none focus:border-construct-orange font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-construct-secondary hover:text-construct-text cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-construct-border flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={(e) => handleSaveUser(e, true)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  title="Save changes and immediately launch WhatsApp with pre-filled credentials"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  <span>Save & Share to WhatsApp</span>
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-lg border border-construct-border text-construct-secondary hover:bg-construct-muted text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-lg bg-construct-orange text-white text-xs font-bold hover:bg-construct-orangeHover shadow-sm transition-colors cursor-pointer"
                  >
                    {isEditing ? "Update Credentials" : "Create User"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
