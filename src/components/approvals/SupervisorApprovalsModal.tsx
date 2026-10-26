"use client";

import React, { useState, useEffect } from "react";
import { repository } from "@/lib/data/repository";
import { EvidenceFile, Expense, UserRole } from "@/types/database";
import {
  CheckCircle2,
  X,
  Camera,
  Receipt,
  Clock,
  ShieldCheck,
  Check,
  AlertCircle,
  Eye,
  FileText,
  Building2,
  HardHat,
  Briefcase,
  ExternalLink,
} from "lucide-react";

interface SupervisorApprovalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProjectId?: string;
  onItemUpdated?: () => void;
}

export function SupervisorApprovalsModal({
  isOpen,
  onClose,
  activeProjectId,
  onItemUpdated,
}: SupervisorApprovalsModalProps) {
  const [activeTab, setActiveTab] = useState<"bills" | "photos">("bills");
  const [currentRole, setCurrentRole] = useState<UserRole>("site_engineer");
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [pendingPhotos, setPendingPhotos] = useState<EvidenceFile[]>([]);
  const [pendingBills, setPendingBills] = useState<Expense[]>([]);

  // Preview modals
  const [previewPhoto, setPreviewPhoto] = useState<EvidenceFile | null>(null);
  const [previewBillReceipt, setPreviewBillReceipt] = useState<string | null>(null);

  // Reject dialog state
  const [rejectingItem, setRejectingItem] = useState<{ type: "photo" | "bill"; id: string; title: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Action status message
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, activeProjectId]);

  const loadData = () => {
    const user = repository.getCurrentUser();
    setCurrentUser(user);
    const role = repository.getCurrentUserRole();
    setCurrentRole(role);

    const summary = repository.getSupervisorApprovalsSummary(activeProjectId);

    if (role === "site_engineer") {
      setPendingPhotos(summary.pendingEngineerPhotos);
      setPendingBills(summary.pendingEngineerBills);
    } else if (role === "project_manager") {
      setPendingPhotos(summary.pendingManagerPhotos);
      setPendingBills(summary.pendingManagerBills);
    } else {
      // Super admin sees all pending
      setPendingPhotos([...summary.pendingEngineerPhotos, ...summary.pendingManagerPhotos]);
      setPendingBills([...summary.pendingEngineerBills, ...summary.pendingManagerBills]);
    }
  };

  if (!isOpen) return null;

  // Handle Photo Approval
  const handleApprovePhoto = (photo: EvidenceFile) => {
    try {
      if (currentRole === "site_engineer") {
        repository.approveEvidenceByEngineer(
          photo.id,
          currentUser?.id,
          `Physically inspected and approved on site by Site Engineer ${currentUser?.full_name || ""}`
        );
        showFeedback(`Approved "${photo.title}" as Site Engineer. Forwarded to Project Manager.`);
      } else {
        repository.approveEvidenceByManager(
          photo.id,
          currentUser?.id,
          `Authorized and finalized by Project Manager ${currentUser?.full_name || ""}`
        );
        showFeedback(`Approved "${photo.title}" as Project Manager. Marked fully verified.`);
      }
      loadData();
      if (onItemUpdated) onItemUpdated();
    } catch (err) {
      console.error(err);
      showFeedback("Failed to approve photo.", "error");
    }
  };

  // Handle Bill Approval
  const handleApproveBill = (bill: Expense) => {
    try {
      if (currentRole === "site_engineer") {
        repository.approveExpenseByEngineer(
          bill.id,
          currentUser?.id,
          `Voucher and site goods verified on site by Site Engineer ${currentUser?.full_name || ""}`
        );
        showFeedback(`Approved bill of ₹${bill.amount.toLocaleString()} (${bill.payee}). Forwarded to Project Manager.`);
      } else {
        repository.approveExpenseByManager(
          bill.id,
          currentUser?.id,
          `Payment disbursement authorized by Project Manager ${currentUser?.full_name || ""}`
        );
        showFeedback(`Approved bill of ₹${bill.amount.toLocaleString()} (${bill.payee}). Marked fully approved.`);
      }
      loadData();
      if (onItemUpdated) onItemUpdated();
    } catch (err) {
      console.error(err);
      showFeedback("Failed to approve bill.", "error");
    }
  };

  // Handle Rejections
  const handleConfirmReject = () => {
    if (!rejectingItem) return;
    try {
      if (rejectingItem.type === "photo") {
        repository.rejectEvidence(rejectingItem.id, currentUser?.id, rejectReason || "Declined during review");
        showFeedback(`Returned / Rejected photo "${rejectingItem.title}".`);
      } else {
        repository.rejectExpense(rejectingItem.id, currentUser?.id, rejectReason || "Declined during review");
        showFeedback(`Returned / Rejected bill "${rejectingItem.title}".`);
      }
      setRejectingItem(null);
      setRejectReason("");
      loadData();
      if (onItemUpdated) onItemUpdated();
    } catch (err) {
      console.error(err);
      showFeedback("Failed to reject item.", "error");
    }
  };

  const showFeedback = (text: string, type: "success" | "error" = "success") => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const isEngineer = currentRole === "site_engineer";
  const isManager = currentRole === "project_manager" || currentRole === "super_admin";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-construct-text/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-4xl bg-construct-surface border border-construct-border rounded-2xl shadow-elevated overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-construct-border flex items-center justify-between bg-construct-bg/50">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isEngineer ? "bg-emerald-100 text-emerald-800" : "bg-orange-100 text-construct-orange"}`}>
              {isEngineer ? <HardHat className="w-5 h-5" /> : <Briefcase className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-extrabold text-base text-construct-text">
                  Supervisor Field Approvals Desk
                </h2>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  isEngineer ? "bg-emerald-100 text-emerald-800" : "bg-orange-100 text-construct-orange"
                }`}>
                  {isEngineer ? "Site Engineer Stage (Stage 1)" : "Project Manager Stage (Stage 2)"}
                </span>
              </div>
              <p className="text-xs text-construct-secondary mt-0.5">
                {isEngineer
                  ? "Inspect bills & photos uploaded by site supervisor. Approved items automatically forward to the Project Manager."
                  : "Review Site-Engineer-verified bills & photos. Authorize commercial disbursement and final QA lock."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-construct-secondary hover:text-construct-text hover:bg-construct-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div className={`px-5 py-2.5 text-xs font-semibold flex items-center gap-2 border-b animate-in fade-in ${
            feedbackMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 border-b border-construct-border flex items-center justify-between bg-construct-surface">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("bills")}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 text-xs font-bold transition-all cursor-pointer ${
                activeTab === "bills"
                  ? "border-construct-orange text-construct-orange"
                  : "border-transparent text-construct-secondary hover:text-construct-text"
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Supervisor Bills & Receipts</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                pendingBills.length > 0 ? "bg-construct-orange text-white" : "bg-construct-muted text-construct-secondary"
              }`}>
                {pendingBills.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("photos")}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 text-xs font-bold transition-all cursor-pointer ${
                activeTab === "photos"
                  ? "border-construct-orange text-construct-orange"
                  : "border-transparent text-construct-secondary hover:text-construct-text"
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Supervisor Work Photos & Videos</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                pendingPhotos.length > 0 ? "bg-construct-orange text-white" : "bg-construct-muted text-construct-secondary"
              }`}>
                {pendingPhotos.length}
              </span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-construct-secondary pb-2">
            Viewing as <span className="font-bold text-construct-text">{currentUser?.full_name}</span> ({currentRole.replace("_", " ").toUpperCase()})
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: BILLS */}
          {activeTab === "bills" && (
            <div>
              {pendingBills.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-construct-border rounded-xl">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2 opacity-80" />
                  <h3 className="font-heading font-bold text-sm text-construct-text">All Caught Up!</h3>
                  <p className="text-xs text-construct-secondary mt-1 max-w-md mx-auto">
                    {isEngineer
                      ? "No supervisor bills are currently waiting for Site Engineer approval."
                      : "No engineer-approved bills are currently waiting for Project Manager authorization."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingBills.map((bill) => (
                    <div
                      key={bill.id}
                      className="p-4 rounded-xl border border-construct-border bg-construct-bg/40 hover:bg-construct-surface hover:shadow-subtle transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-construct-orange px-2 py-0.5 rounded bg-orange-50 border border-orange-200">
                            {bill.category}
                          </span>
                          <span className="text-sm font-heading font-bold text-construct-text">
                            {bill.payee}
                          </span>
                          <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            ₹{bill.amount.toLocaleString()}
                          </span>
                        </div>

                        <p className="text-xs text-construct-secondary leading-relaxed">
                          {bill.description}
                        </p>

                        <div className="flex items-center gap-3 text-[11px] font-mono text-construct-secondary flex-wrap pt-1">
                          <span>Date: {bill.expense_date}</span>
                          <span>•</span>
                          <span>Uploaded by: <strong className="text-construct-text">Supervisor Ramesh Patil</strong></span>

                          {bill.engineer_approved_by && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                <Check className="w-3 h-3" /> Site Engineer Approved
                              </span>
                            </>
                          )}

                          {bill.receipt_url && (
                            <>
                              <span>•</span>
                              <button
                                type="button"
                                onClick={() => setPreviewBillReceipt(bill.receipt_url!)}
                                className="inline-flex items-center gap-1 text-purple-700 font-bold hover:underline cursor-pointer"
                              >
                                <FileText className="w-3 h-3" /> View Voucher
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* PHYSICAL ACTION BUTTONS */}
                      <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-construct-border/60">
                        <button
                          type="button"
                          onClick={() => setRejectingItem({ type: "bill", id: bill.id, title: `${bill.payee} (₹${bill.amount})` })}
                          className="px-3 py-2 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
                        >
                          Reject
                        </button>

                        <button
                          type="button"
                          onClick={() => handleApproveBill(bill)}
                          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <Check className="w-4 h-4 stroke-[2.5]" />
                          <span>
                            {isEngineer ? "Approve Bill (Site Engineer)" : "Authorize & Disburse (PM)"}
                          </span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PHOTOS & VIDEOS */}
          {activeTab === "photos" && (
            <div>
              {pendingPhotos.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-construct-border rounded-xl">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2 opacity-80" />
                  <h3 className="font-heading font-bold text-sm text-construct-text">All Caught Up!</h3>
                  <p className="text-xs text-construct-secondary mt-1 max-w-md mx-auto">
                    {isEngineer
                      ? "No supervisor photos are currently waiting for Site Engineer review."
                      : "No engineer-approved photos are currently waiting for Project Manager authorization."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="rounded-xl border border-construct-border bg-construct-surface overflow-hidden shadow-subtle hover:border-construct-orange/40 transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Media Preview thumbnail */}
                        <div
                          onClick={() => setPreviewPhoto(photo)}
                          className="h-44 bg-black/90 relative cursor-pointer overflow-hidden flex items-center justify-center group"
                        >
                          {photo.file_path.startsWith("http") || photo.file_path.startsWith("data:") ? (
                            <img
                              src={photo.file_path}
                              alt={photo.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="text-white flex flex-col items-center gap-1">
                              <Camera className="w-8 h-8 text-construct-orange" />
                              <span className="text-xs font-mono">{photo.file_path}</span>
                            </div>
                          )}

                          <div className="absolute top-2.5 left-2.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/70 text-white">
                              {photo.evidence_type.toUpperCase()}
                            </span>
                          </div>

                          <div className="absolute top-2.5 right-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              photo.approval_status === "pending_manager"
                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                : "bg-amber-100 text-amber-800 border border-amber-200"
                            }`}>
                              {photo.approval_status === "pending_manager" ? "AWAITING PM" : "AWAITING ENG"}
                            </span>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="p-4 space-y-2">
                          <h4 className="font-heading font-bold text-sm text-construct-text line-clamp-1">
                            {photo.title}
                          </h4>
                          <p className="text-xs text-construct-secondary line-clamp-2 leading-relaxed">
                            {photo.description || "Field execution evidence logged by site supervisor."}
                          </p>
                          <div className="text-[11px] font-mono text-construct-secondary flex items-center justify-between pt-1 border-t border-construct-border/60">
                            <span>By: <strong>Supervisor Ramesh</strong></span>
                            <span>{photo.capture_date ? new Date(photo.capture_date).toLocaleDateString() : "Recent"}</span>
                          </div>

                          {photo.engineer_approved_by && (
                            <div className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                              ✓ Verified by Site Engineer Kalyani Jadhav
                            </div>
                          )}
                        </div>
                      </div>

                      {/* PHYSICAL ACTION BUTTONS */}
                      <div className="p-4 pt-2 border-t border-construct-border/60 flex items-center justify-end gap-2 bg-construct-bg/30">
                        <button
                          type="button"
                          onClick={() => setRejectingItem({ type: "photo", id: photo.id, title: photo.title })}
                          className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
                        >
                          Reject
                        </button>

                        <button
                          type="button"
                          onClick={() => handleApprovePhoto(photo)}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>
                            {isEngineer ? "Approve Photo (Site Engineer)" : "Final Sign-off (PM)"}
                          </span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-construct-border bg-construct-bg/50 flex items-center justify-between text-xs">
          <div className="text-construct-secondary flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>2-Tier Governance: Supervisor → Site Engineer Approval → Project Manager Final Sign-Off</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-construct-border text-construct-text hover:bg-construct-muted font-bold cursor-pointer"
          >
            Close Desk
          </button>
        </div>
      </div>

      {/* Reject Reason Dialog */}
      {rejectingItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-construct-surface border border-construct-border rounded-xl shadow-elevated p-5 space-y-4">
            <h3 className="font-heading font-bold text-sm text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>Return / Reject {rejectingItem.type === "photo" ? "Photo" : "Bill"}</span>
            </h3>
            <p className="text-xs text-construct-text">
              Item: <strong>{rejectingItem.title}</strong>
            </p>
            <div>
              <label className="block text-xs font-bold text-construct-text mb-1">
                Reason for Rejection / Return Note *
              </label>
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Incomplete shuttering alignment, please re-align and re-submit..."
                className="w-full p-2.5 border border-construct-border rounded-lg bg-construct-bg text-xs focus:outline-none focus:border-rose-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="px-3 py-1.5 rounded-lg border border-construct-border text-construct-secondary text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Inspector Preview */}
      {previewPhoto && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-construct-surface border border-construct-border rounded-xl shadow-elevated p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-construct-border">
              <h3 className="font-heading font-bold text-sm text-construct-text">{previewPhoto.title}</h3>
              <button onClick={() => setPreviewPhoto(null)} className="text-construct-secondary hover:text-construct-text">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-lg overflow-hidden bg-black flex items-center justify-center max-h-96">
              <img src={previewPhoto.file_path} alt={previewPhoto.title} className="max-h-96 w-auto object-contain" />
            </div>
            <p className="text-xs text-construct-secondary">{previewPhoto.description}</p>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="px-4 py-1.5 rounded-lg bg-construct-text text-white text-xs font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill Receipt Preview */}
      {previewBillReceipt && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-construct-surface border border-construct-border rounded-xl shadow-elevated p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-construct-border">
              <h3 className="font-heading font-bold text-sm text-construct-text">Voucher & Receipt Document</h3>
              <button onClick={() => setPreviewBillReceipt(null)} className="text-construct-secondary hover:text-construct-text">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-lg overflow-hidden bg-black flex items-center justify-center max-h-96">
              <img src={previewBillReceipt} alt="Receipt" className="max-h-96 w-auto object-contain" />
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPreviewBillReceipt(null)}
                className="px-4 py-1.5 rounded-lg bg-construct-text text-white text-xs font-bold"
              >
                Close Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
