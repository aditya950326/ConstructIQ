"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { repository } from "@/lib/data/repository";
import { EvidenceFile, Activity } from "@/types/database";
import {
  Camera,
  Plus,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Tag,
  Clock,
  X,
  Eye,
  Filter,
  Video,
  Play,
  Film,
  Upload,
  Loader2,
  Check,
  HardHat,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import { mediaStorage } from "@/lib/storage/media-storage";
import { ResolvedMedia } from "@/components/media/ResolvedMedia";

export default function EvidenceVaultPage() {
  const params = useParams();
  const projectId = (params?.projectId as string) || "b0000000-0000-0000-0000-000000000001";

  const [evidenceList, setEvidenceList] = useState<EvidenceFile[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceFile | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentRole, setCurrentRole] = useState<any>("site_engineer");
  const [rejectingItem, setRejectingItem] = useState<{ id: string; title: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Upload Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [evidenceType, setEvidenceType] = useState<any>("photo");
  const [activityId, setActivityId] = useState("");
  const [filePath, setFilePath] = useState("");
  const [fileType, setFileType] = useState("image/jpeg");
  const [tagsInput, setTagsInput] = useState("qa-inspection, structural-columns, site-record");
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadData();
    window.addEventListener("constructiq-data-update", loadData);
    window.addEventListener("constructiq-role-change", loadData);
    return () => {
      window.removeEventListener("constructiq-data-update", loadData);
      window.removeEventListener("constructiq-role-change", loadData);
    };
  }, [projectId]);

  const loadData = () => {
    setCurrentUser(repository.getCurrentUser());
    setCurrentRole(repository.getCurrentUserRole());
    setEvidenceList(repository.getEvidence(projectId));
    const acts = repository.getActivities(projectId);
    setActivities(acts);
    if (acts.length > 0) setActivityId(acts[0].id);
  };

  const handleApprovePhoto = (photo: EvidenceFile) => {
    if (currentRole === "site_engineer") {
      repository.approveEvidenceByEngineer(
        photo.id,
        currentUser?.id,
        `Approved on site by Site Engineer ${currentUser?.full_name || ""}`
      );
    } else {
      repository.approveEvidenceByManager(
        photo.id,
        currentUser?.id,
        `Authorized and verified by Project Manager ${currentUser?.full_name || ""}`
      );
    }
    loadData();
    if (selectedEvidence?.id === photo.id) {
      setSelectedEvidence(null);
    }
  };

  const handleConfirmReject = () => {
    if (!rejectingItem) return;
    repository.rejectEvidence(rejectingItem.id, currentUser?.id, rejectReason || "Rejected during inspection");
    setRejectingItem(null);
    setRejectReason("");
    loadData();
    if (selectedEvidence?.id === rejectingItem.id) {
      setSelectedEvidence(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    setFileName(`${file.name} (${sizeMb} MB)`);
    setFileType(file.type || "application/octet-stream");

    if (file.type.startsWith("video/")) {
      setEvidenceType("video");
      if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ""));
      setTagsInput("site-video, drone-footage, concrete-compaction");
    } else if (file.type.startsWith("image/")) {
      setEvidenceType("photo");
      if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ""));
    } else {
      setEvidenceType("document");
      if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleSelectSampleVideo = (url: string, presetTitle: string) => {
    setFilePath(url);
    if (!title) setTitle(presetTitle);
    setSelectedFile(null);
    setFileName("");
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    if (!selectedFile && !filePath) {
      alert("Please select a media file from your device or specify a valid file URL.");
      return;
    }

    setIsUploading(true);

    try {
      const user = repository.getCurrentUser();
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);

      const newEvidenceId = crypto.randomUUID();
      let determinedFileType = fileType;
      let finalFilePath = filePath;

      if (selectedFile) {
        await mediaStorage.saveFile(newEvidenceId, selectedFile);
        finalFilePath = `indexeddb://${newEvidenceId}`;
        determinedFileType = selectedFile.type || (evidenceType === "video" ? "video/mp4" : "image/jpeg");
      } else {
        if (evidenceType === "video" && !determinedFileType.startsWith("video/")) {
          determinedFileType = "video/mp4";
        } else if (evidenceType === "photo" && !determinedFileType.startsWith("image/")) {
          determinedFileType = "image/jpeg";
        }
      }

      repository.addEvidence({
        id: newEvidenceId,
        project_id: projectId,
        activity_id: activityId,
        evidence_type: evidenceType,
        title,
        description,
        uploader_id: user.id,
        file_path: finalFilePath,
        file_type: determinedFileType,
        file_size_bytes: selectedFile ? selectedFile.size : (evidenceType === "video" ? 18500000 : 2048000),
        capture_date: new Date().toISOString(),
        review_status: "verified",
        tags,
      });

      loadData();
      setIsUploadModalOpen(false);
      setTitle("");
      setDescription("");
      setFileName("");
      setFilePath("");
      setSelectedFile(null);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to save media file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const pendingApprovalsCount = evidenceList.filter((e) => {
    if (currentRole === "site_engineer") return e.approval_status === "pending_engineer";
    if (currentRole === "project_manager") return e.approval_status === "pending_manager";
    return e.approval_status === "pending_engineer" || e.approval_status === "pending_manager";
  }).length;

  const filteredEvidence = evidenceList.filter((e) => {
    if (filterType === "pending_approval") {
      if (currentRole === "site_engineer") return e.approval_status === "pending_engineer";
      if (currentRole === "project_manager") return e.approval_status === "pending_manager";
      return e.approval_status === "pending_engineer" || e.approval_status === "pending_manager";
    }
    if (filterType === "all") return true;
    return e.evidence_type === filterType;
  });

  return (
    <AppShell
      title="Evidence Vault & Records"
      subtitle="Geocoded Photos, Site Videos, Material Lab Tests & Inspection Sign-Offs"
      activeProjectId={projectId}
      headerActions={
        <button
          onClick={() => {
            setEvidenceType("photo");
            setFilePath("https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?auto=format&fit=crop&w=1200&q=80");
            setIsUploadModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-construct-orange text-white text-xs font-semibold hover:bg-construct-orangeHover shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Evidence / Video</span>
        </button>
      }
    >
      {/* Approvals Required Action Banner */}
      {pendingApprovalsCount > 0 && currentRole === "site_engineer" && (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-sm text-amber-950">
                Supervisor Field Photos Awaiting Site Engineer Approval ({pendingApprovalsCount})
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                Field photos uploaded by site supervisor require your physical inspection sign-off before they can be seen by the Project Manager.
              </p>
            </div>
          </div>
          <button
            onClick={() => setFilterType(filterType === "pending_approval" ? "all" : "pending_approval")}
            className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            {filterType === "pending_approval" ? "Show All Evidence" : `Filter ${pendingApprovalsCount} Pending Photos`}
          </button>
        </div>
      )}

      {pendingApprovalsCount > 0 && (currentRole === "project_manager" || currentRole === "super_admin") && (
        <div className="p-4 rounded-xl border border-blue-300 bg-blue-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-800">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-sm text-blue-950">
                Engineer-Approved Photos Awaiting Project Manager Sign-Off ({pendingApprovalsCount})
              </h3>
              <p className="text-xs text-blue-800 mt-0.5">
                Site Engineer Kalyani Jadhav has inspected and approved these photos. Physical PM sign-off required for final QA locking.
              </p>
            </div>
          </div>
          <button
            onClick={() => setFilterType(filterType === "pending_approval" ? "all" : "pending_approval")}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            {filterType === "pending_approval" ? "Show All Evidence" : `Filter ${pendingApprovalsCount} Pending Photos`}
          </button>
        </div>
      )}

      {/* Evidence Type Filter Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-construct-border">
        <div className="flex items-center gap-2 overflow-x-auto text-xs font-medium">
          {["all", "photo", "video", "document", "drawing", "inspection_sheet"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg border transition-colors capitalize flex items-center gap-1.5 cursor-pointer ${
                filterType === type
                  ? "bg-construct-text text-white border-construct-text font-bold"
                  : "bg-construct-surface text-construct-secondary border-construct-border hover:bg-construct-muted"
              }`}
            >
              {type === "video" && <Video className="w-3.5 h-3.5 text-purple-400" />}
              {type === "photo" && <ImageIcon className="w-3.5 h-3.5 text-blue-400" />}
              {type === "all" ? "All Evidence" : type.replace("_", " ")}
            </button>
          ))}

          {/* Pending Approvals Filter Tab */}
          {pendingApprovalsCount > 0 && (
            <button
              onClick={() => setFilterType("pending_approval")}
              className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 font-bold cursor-pointer ${
                filterType === "pending_approval"
                  ? "bg-amber-600 text-white border-amber-600"
                  : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Awaiting My Approval ({pendingApprovalsCount})</span>
            </button>
          )}
        </div>
        <span className="text-xs font-mono text-construct-secondary">
          {filteredEvidence.length} Evidence Records
        </span>
      </div>

      {/* Evidence Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvidence.map((item) => {
          const act = activities.find((a) => a.id === item.activity_id);
          const isPhoto = item.evidence_type === "photo";
          const isVideo = item.evidence_type === "video";
          const isSupervisor = item.uploader_role === "site_supervisor" || item.uploader_id === "a0000000-0000-0000-0000-000000000004";

          const canApprove =
            (currentRole === "site_engineer" && item.approval_status === "pending_engineer") ||
            ((currentRole === "project_manager" || currentRole === "super_admin") && item.approval_status === "pending_manager");

          return (
            <div
              key={item.id}
              onClick={() => setSelectedEvidence(item)}
              className="bg-construct-surface border border-construct-border rounded-xl overflow-hidden shadow-subtle hover:border-construct-orange/40 hover:shadow-card transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                {/* Media Preview Box */}
                <div className="h-48 bg-black/90 border-b border-construct-border/60 relative flex items-center justify-center overflow-hidden">
                  {isVideo ? (
                    <div className="w-full h-full relative flex items-center justify-center">
                      <video
                        src={item.file_path}
                        muted
                        preload="metadata"
                        className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-construct-orange/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="w-5 h-5 fill-white ml-0.5" />
                        </div>
                      </div>
                      <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/80 text-purple-300 border border-purple-500/40">
                        VIDEO FOOTAGE
                      </span>
                    </div>
                  ) : isPhoto && item.file_path.startsWith("http") ? (
                    <img
                      src={item.file_path}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-construct-secondary">
                      <FileText className="w-12 h-12 text-construct-orange" />
                      <span className="font-mono text-xs uppercase">{item.file_type}</span>
                    </div>
                  )}

                  {/* Review / Approval Status Badge */}
                  <div className="absolute top-2.5 right-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shadow-xs ${
                      item.approval_status === "approved" || (!item.approval_status && item.review_status === "verified")
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : item.approval_status === "pending_manager"
                        ? "bg-blue-100 text-blue-800 border border-blue-200"
                        : item.approval_status === "rejected" || item.review_status === "flagged"
                        ? "bg-rose-100 text-rose-800 border border-rose-200"
                        : "bg-amber-100 text-amber-800 border border-amber-200"
                    }`}>
                      {item.approval_status === "approved"
                        ? "APPROVED BY PM"
                        : item.approval_status === "pending_manager"
                        ? "AWAITING PM APPROVAL"
                        : item.approval_status === "rejected"
                        ? "REJECTED"
                        : item.approval_status === "pending_engineer"
                        ? "AWAITING SITE ENG"
                        : item.review_status.toUpperCase()}
                    </span>
                  </div>

                  <div className="absolute bottom-2.5 left-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold backdrop-blur-xs flex items-center gap-1 ${
                      isVideo ? "bg-purple-900/90 text-purple-200 border border-purple-400/40" : "bg-black/70 text-white"
                    }`}>
                      {isVideo && <Video className="w-3 h-3 text-purple-300" />}
                      {item.evidence_type.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Metadata Content */}
                <div className="p-4">
                  <h4 className="font-heading font-bold text-sm text-construct-text group-hover:text-construct-orange transition-colors truncate">
                    {item.title}
                  </h4>
                  <p className="text-xs text-construct-secondary mt-1 line-clamp-2 leading-relaxed">
                    {item.description || "Verification record for site inspection."}
                  </p>

                  {act && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-mono text-construct-secondary">
                      <span className="font-bold text-construct-orange">{act.code}:</span>
                      <span className="truncate">{act.name}</span>
                    </div>
                  )}

                  {/* Supervisor Stepper for supervisor uploaded evidence */}
                  {isSupervisor && (
                    <div className="mt-3 p-2 rounded-lg bg-construct-bg/60 border border-construct-border/60 text-[10px] font-mono space-y-1">
                      <div className="flex items-center justify-between text-construct-secondary">
                        <span>Supervisor: <strong>Ramesh Patil</strong></span>
                        <span className={item.approval_status === "approved" ? "text-emerald-700 font-bold" : "text-amber-700 font-bold"}>
                          {item.approval_status === "approved" ? "Stage 3 Complete" : item.approval_status === "pending_manager" ? "Stage 2 Pending" : "Stage 1 Pending"}
                        </span>
                      </div>
                      {item.engineer_approved_by && (
                        <p className="text-emerald-700 font-medium">✓ Verified by Site Engineer Kalyani Jadhav</p>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-construct-bg border border-construct-border/60 text-construct-secondary"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* PHYSICAL APPROVE / REJECT ACTION BUTTONS ON CARD */}
              {canApprove && (
                <div className="p-3 bg-construct-bg border-t border-construct-border flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => setRejectingItem({ id: item.id, title: item.title })}
                    className="px-2.5 py-1.5 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprovePhoto(item)}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>
                      {currentRole === "site_engineer" ? "Approve Photo (Site Engineer)" : "Final Sign-off (PM)"}
                    </span>
                  </button>
                </div>
              )}

              {/* Card Footer */}
              <div className="p-4 pt-2 border-t border-construct-border/60 flex items-center justify-between text-[11px] font-mono text-construct-secondary">
                <span>Capture: {item.capture_date ? new Date(item.capture_date).toLocaleDateString() : "Recent"}</span>
                <span className="font-sans font-semibold text-construct-orange flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <Eye className="w-3.5 h-3.5" /> Inspect
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Evidence Detail Modal */}
      {selectedEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-construct-text/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-construct-surface border border-construct-border rounded-xl shadow-elevated p-6 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-construct-border">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  selectedEvidence.evidence_type === "video" ? "bg-purple-100 text-purple-800 border border-purple-200" : "bg-construct-muted text-construct-text"
                }`}>
                  {selectedEvidence.evidence_type}
                </span>
                <h3 className="font-heading font-extrabold text-base text-construct-text">
                  {selectedEvidence.title}
                </h3>
              </div>
              <button onClick={() => setSelectedEvidence(null)} className="text-construct-secondary hover:text-construct-text cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Media Preview */}
            <div className="mt-4 rounded-lg overflow-hidden border border-construct-border bg-black flex items-center justify-center max-h-96">
              {selectedEvidence.evidence_type === "video" ? (
                <video
                  controls
                  autoPlay
                  src={selectedEvidence.file_path}
                  className="w-full max-h-96 rounded-lg bg-black object-contain shadow-inner"
                >
                  Your browser does not support HTML5 video playback.
                </video>
              ) : selectedEvidence.file_path.startsWith("http") || selectedEvidence.file_path.startsWith("data:") ? (
                <img
                  src={selectedEvidence.file_path}
                  alt={selectedEvidence.title}
                  className="w-full max-h-96 object-contain"
                />
              ) : (
                <div className="p-12 text-center text-white">
                  <FileText className="w-16 h-16 text-construct-orange mx-auto mb-2" />
                  <p className="font-mono text-xs">{selectedEvidence.file_path}</p>
                  <p className="text-xs text-construct-secondary mt-1">Formal PDF Document / Certified Laboratory Sign-off</p>
                </div>
              )}
            </div>

            {/* Metadata Breakdown */}
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs font-mono bg-construct-bg p-3.5 rounded-lg border border-construct-border/60">
              <div>
                <span className="text-construct-secondary text-[10px] block">CAPTURED ON-SITE</span>
                <span className="font-bold text-construct-text">{selectedEvidence.capture_date ? new Date(selectedEvidence.capture_date).toLocaleDateString() : "Oct 2026"}</span>
              </div>
              <div>
                <span className="text-construct-secondary text-[10px] block">UPLOAD TIMESTAMP</span>
                <span className="font-bold text-construct-text">{new Date(selectedEvidence.uploaded_at).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-construct-secondary text-[10px] block">GOVERNANCE STAGE</span>
                <span className="font-bold text-emerald-700">
                  {selectedEvidence.approval_status ? selectedEvidence.approval_status.replace("_", " ").toUpperCase() : selectedEvidence.review_status.toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-construct-secondary text-[10px] block">MEDIA TYPE</span>
                <span className="font-bold text-construct-text uppercase">{selectedEvidence.file_type}</span>
              </div>
            </div>

            {selectedEvidence.engineer_approved_by && (
              <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Check className="w-4 h-4 text-emerald-700" />
                  <span>Site Engineer Verified & Approved</span>
                </div>
                {selectedEvidence.engineer_notes && <p className="text-[11px] text-emerald-800">{selectedEvidence.engineer_notes}</p>}
                {selectedEvidence.engineer_approved_at && (
                  <p className="text-[10px] text-emerald-600">Timestamp: {new Date(selectedEvidence.engineer_approved_at).toLocaleString()}</p>
                )}
              </div>
            )}

            <div className="mt-3 text-xs text-construct-secondary leading-relaxed">
              <span className="font-mono font-bold text-construct-text block mb-1">FIELD NOTES & OBSERVATION:</span>
              {selectedEvidence.description}
            </div>

            {/* Modal Actions Footer */}
            <div className="mt-6 pt-3 border-t border-construct-border flex items-center justify-between">
              <div>
                {((currentRole === "site_engineer" && selectedEvidence.approval_status === "pending_engineer") ||
                  ((currentRole === "project_manager" || currentRole === "super_admin") && selectedEvidence.approval_status === "pending_manager")) && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRejectingItem({ id: selectedEvidence.id, title: selectedEvidence.title })}
                      className="px-3 py-2 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprovePhoto(selectedEvidence)}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>{currentRole === "site_engineer" ? "Approve Photo (Site Engineer)" : "Final Sign-off (PM)"}</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedEvidence(null)}
                className="px-4 py-2 rounded-lg bg-construct-text text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Note Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-construct-surface border border-construct-border rounded-xl shadow-elevated p-5 space-y-4">
            <h3 className="font-heading font-bold text-sm text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>Return / Reject Field Photo</span>
            </h3>
            <p className="text-xs text-construct-text">
              Photo: <strong>{rejectingItem.title}</strong>
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
                placeholder="e.g. Rebar spacing does not match drawings, please rectify..."
                className="w-full p-2.5 border border-construct-border rounded-lg bg-construct-bg text-xs focus:outline-none focus:border-rose-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="px-3 py-1.5 rounded-lg border border-construct-border text-construct-secondary text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Upload Evidence / Video Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-construct-text/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-construct-surface border border-construct-border rounded-xl shadow-elevated p-6 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-construct-border">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-orange-100 text-construct-orange">
                  <Film className="w-4 h-4" />
                </div>
                <h3 className="font-heading font-extrabold text-base text-construct-text">
                  Upload Site Evidence or Video
                </h3>
              </div>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-construct-secondary hover:text-construct-text">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-construct-text mb-1">Evidence Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Column C-4 Rebar Spacing & Concrete Pour Video"
                  className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg focus:outline-none focus:border-construct-orange text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-construct-text mb-1">Evidence Category *</label>
                  <select
                    value={evidenceType}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEvidenceType(val);
                      if (val === "video") {
                        setFilePath("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4");
                        setFileType("video/mp4");
                      }
                    }}
                    className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg focus:outline-none focus:border-construct-orange text-xs font-semibold"
                  >
                    <option value="photo">📷 Site Photograph</option>
                    <option value="video">🎥 Site Video / Drone Footage</option>
                    <option value="document">📄 Test Document / Lab Certificate</option>
                    <option value="drawing">📐 As-Built Drawing</option>
                    <option value="inspection_sheet">📋 Inspection Checklist</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-construct-text mb-1">Linked Activity</label>
                  <select
                    value={activityId}
                    onChange={(e) => setActivityId(e.target.value)}
                    className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg focus:outline-none focus:border-construct-orange text-xs"
                  >
                    {activities.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code}: {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Direct File Picker Option */}
              <div className="p-3 rounded-lg border border-dashed border-construct-border bg-construct-bg/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-construct-text flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-construct-orange" />
                    Upload from Device (Video, Photo, PDF)
                  </span>
                  {fileName && (
                    <span className="text-[10px] font-mono text-emerald-600 font-bold truncate max-w-[150px]">
                      {fileName}
                    </span>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="video/*,image/*,application/pdf"
                  onChange={handleFileChange}
                  className="w-full text-xs text-construct-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-construct-orange file:text-white hover:file:bg-construct-orangeHover cursor-pointer"
                />
              </div>

              {/* Quick Field Stream Feeds */}
              {evidenceType === "video" && (
                <div className="p-2.5 rounded-lg bg-purple-50/70 border border-purple-200">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-900 block mb-1.5">
                    Live Field Surveillance & Drone Feeds:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleSelectSampleVideo(
                          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
                          "Drone Inspection - Raft Concreting"
                        )
                      }
                      className="p-1.5 rounded border border-purple-300 bg-white hover:bg-purple-100 text-[11px] font-medium text-purple-950 text-left transition-colors flex items-center gap-1.5"
                    >
                      <Video className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span className="truncate">Drone Flyover 4K</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleSelectSampleVideo(
                          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                          "Tower Alpha Level 01 Column Compaction"
                        )
                      }
                      className="p-1.5 rounded border border-purple-300 bg-white hover:bg-purple-100 text-[11px] font-medium text-purple-950 text-left transition-colors flex items-center gap-1.5"
                    >
                      <Video className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span className="truncate">Column Compaction</span>
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-construct-text mb-1">
                  File URL / Media Source Path *
                </label>
                <input
                  type="text"
                  required
                  value={filePath}
                  onChange={(e) => setFilePath(e.target.value)}
                  className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg font-mono focus:outline-none focus:border-construct-orange text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-construct-text mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="video, drone, concrete, qa-passed"
                  className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg font-mono focus:outline-none focus:border-construct-orange text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-construct-text mb-1">Inspection Notes & Findings</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe technical measurements, slump test results, or video observations..."
                  className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg focus:outline-none focus:border-construct-orange text-xs"
                />
              </div>

              <div className="pt-3 border-t border-construct-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-construct-border text-construct-secondary hover:bg-construct-muted text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-construct-orange text-white text-xs font-semibold hover:bg-construct-orangeHover shadow-sm flex items-center gap-1.5"
                >
                  {evidenceType === "video" ? <Video className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Upload & Register</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
