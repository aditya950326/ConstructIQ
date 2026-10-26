"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { repository } from "@/lib/data/repository";
import { mediaStorage } from "@/lib/storage/media-storage";
import { ResolvedMedia } from "@/components/media/ResolvedMedia";
import { DailyAttendance, EvidenceFile, Expense, Activity, HierarchyNode } from "@/types/database";
import {
  Users,
  Camera,
  Receipt,
  Plus,
  CheckCircle2,
  Calendar,
  Building2,
  UploadCloud,
  X,
  Clock,
  Trash2,
  DollarSign,
  HardHat,
  Video,
  Play,
  FileText,
  Upload,
  Eye,
  Check,
  AlertCircle,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import {
  LaborHeadcountChart,
  ExpenseCategoryDonutChart,
} from "@/components/charts/AnalyticsCharts";

function SupervisorPortalContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "attendance";

  const [activeTab, setActiveTab] = useState<"attendance" | "photos" | "bills">(
    initialTab === "photos" ? "photos" : initialTab === "bills" ? "bills" : "attendance"
  );

  const [projectId, setProjectId] = useState("b0000000-0000-0000-0000-000000000001");
  const [attendanceList, setAttendanceList] = useState<DailyAttendance[]>([]);
  const [evidenceList, setEvidenceList] = useState<EvidenceFile[]>([]);
  const [billsList, setBillsList] = useState<Expense[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [nodes, setNodes] = useState<HierarchyNode[]>([]);

  // Modal Triggers
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);

  // Inspector Preview Modals
  const [previewMedia, setPreviewMedia] = useState<EvidenceFile | null>(null);
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);

  // Form State: Work 1 - Attendance
  const [attDate, setAttDate] = useState("2026-10-23");
  const [laborCategory, setLaborCategory] = useState("Carpenters (Shuttering)");
  const [headcount, setHeadcount] = useState(12);
  const [shift, setShift] = useState<any>("day");
  const [contractorName, setContractorName] = useState("Omkar Formwork Contractors");
  const [attNotes, setAttNotes] = useState("Columns C1-C8 shuttering gang");

  // Form State: Work 2 - Photos & Videos
  const [photoTitle, setPhotoTitle] = useState("");
  const [mediaType, setMediaType] = useState<"photo" | "video">("photo");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoActivityId, setPhotoActivityId] = useState("");
  const [photoNotes, setPhotoNotes] = useState("");
  const [selectedMediaFile, setSelectedMediaFile] = useState<File | null>(null);
  const [mediaFileName, setMediaFileName] = useState("");
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const mediaFileInputRef = useRef<HTMLInputElement>(null);

  // Form State: Work 3 - Bills
  const [billCategory, setBillCategory] = useState<any>("Materials");
  const [billAmount, setBillAmount] = useState(18500);
  const [billPayee, setBillPayee] = useState("Local Hardware & Diesel Store");
  const [billDate, setBillDate] = useState("2026-10-23");
  const [billDesc, setBillDesc] = useState("Vibrator fuel (50L diesel) + binding wire 10kg");
  const [selectedReceiptFile, setSelectedReceiptFile] = useState<File | null>(null);
  const [receiptFileName, setReceiptFileName] = useState("");
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const receiptFileInputRef = useRef<HTMLInputElement>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentRole, setCurrentRole] = useState<any>("site_supervisor");

  // Rejection modal
  const [rejectingItem, setRejectingItem] = useState<{ type: "photo" | "bill"; id: string; title: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

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
    setAttendanceList(repository.getAttendance(projectId));
    setEvidenceList(
      repository
        .getAllEvidence(projectId)
        .filter((e) => e.evidence_type === "photo" || e.evidence_type === "video")
    );
    setBillsList(repository.getAllExpenses(projectId));
    const acts = repository.getActivities(projectId);
    setActivities(acts);
    if (acts.length > 0 && !photoActivityId) setPhotoActivityId(acts[0].id);
    setNodes(repository.getHierarchy(projectId));
  };

  const handleApprovePhotoDirect = (photo: EvidenceFile) => {
    if (currentRole === "site_engineer") {
      repository.approveEvidenceByEngineer(photo.id, currentUser?.id, `Approved on site by Site Engineer ${currentUser?.full_name || ""}`);
    } else {
      repository.approveEvidenceByManager(photo.id, currentUser?.id, `Authorized and verified by Project Manager ${currentUser?.full_name || ""}`);
    }
    loadData();
  };

  const handleApproveBillDirect = (bill: Expense) => {
    if (currentRole === "site_engineer") {
      repository.approveExpenseByEngineer(bill.id, currentUser?.id, `Voucher and receipt verified by Site Engineer ${currentUser?.full_name || ""}`);
    } else {
      repository.approveExpenseByManager(bill.id, currentUser?.id, `Payment disbursement authorized by Project Manager ${currentUser?.full_name || ""}`);
    }
    loadData();
  };

  const handleConfirmReject = () => {
    if (!rejectingItem) return;
    if (rejectingItem.type === "photo") {
      repository.rejectEvidence(rejectingItem.id, currentUser?.id, rejectReason || "Rejected during inspection");
    } else {
      repository.rejectExpense(rejectingItem.id, currentUser?.id, rejectReason || "Rejected during audit");
    }
    setRejectingItem(null);
    setRejectReason("");
    loadData();
  };

  // Submit Work 1: Attendance
  const handleSaveAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    const user = repository.getCurrentUser();

    repository.recordAttendance({
      project_id: projectId,
      date: attDate,
      supervisor_id: user.id,
      labor_category: laborCategory,
      headcount: Number(headcount),
      shift,
      contractor_name: contractorName,
      notes: attNotes,
    });

    loadData();
    setIsAttendanceModalOpen(false);
  };

  // File change handler for Media
  const handleMediaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedMediaFile(file);
      setMediaFileName(file.name);
      if (file.type.startsWith("video/")) {
        setMediaType("video");
      } else if (file.type.startsWith("image/")) {
        setMediaType("photo");
      }
      if (!photoTitle) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        setPhotoTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  };

  // Submit Work 2: Photo or Video
  const handleSavePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoTitle) return;

    setIsUploadingMedia(true);
    try {
      let finalFilePath = photoUrl;
      let finalFileType = mediaType === "video" ? "video/mp4" : "image/jpeg";
      let finalSize = mediaType === "video" ? 18500000 : 2048000;
      const mediaId = `media-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      if (selectedMediaFile) {
        await mediaStorage.storeMediaBlob(mediaId, selectedMediaFile);
        finalFilePath = `indexeddb://${mediaId}`;
        finalFileType = selectedMediaFile.type || (mediaType === "video" ? "video/mp4" : "image/jpeg");
        finalSize = selectedMediaFile.size;
      } else if (!finalFilePath) {
        finalFilePath = mediaType === "video"
          ? "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
          : "https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?auto=format&fit=crop&w=1200&q=80";
      }

      const user = repository.getCurrentUser();

      repository.addEvidence({
        id: mediaId,
        project_id: projectId,
        activity_id: photoActivityId,
        evidence_type: mediaType,
        title: photoTitle,
        description: photoNotes || `Site execution ${mediaType} logged by supervisor`,
        uploader_id: user.id,
        uploader_role: "site_supervisor",
        file_path: finalFilePath,
        file_type: finalFileType,
        file_size_bytes: finalSize,
        capture_date: new Date().toISOString(),
        review_status: "unreviewed",
        approval_status: "pending_engineer",
        tags: ["supervisor-media", "field-execution", mediaType],
      });

      loadData();
      setIsPhotoModalOpen(false);
      setPhotoTitle("");
      setPhotoNotes("");
      setPhotoUrl("");
      setSelectedMediaFile(null);
      setMediaFileName("");
    } catch (err) {
      console.error("Save media error:", err);
      alert("Failed to save media record.");
    } finally {
      setIsUploadingMedia(false);
    }
  };

  // File change handler for Receipt
  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedReceiptFile(file);
      setReceiptFileName(file.name);
    }
  };

  // Submit Work 3: Bill / Receipt
  const handleSaveBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billPayee || !billAmount) return;

    setIsUploadingReceipt(true);
    try {
      let receiptUrl: string | undefined = undefined;
      if (selectedReceiptFile) {
        const receiptId = `receipt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        await mediaStorage.storeMediaBlob(receiptId, selectedReceiptFile);
        receiptUrl = `indexeddb://${receiptId}`;
      }

      const user = repository.getCurrentUser();

      repository.addExpense({
        project_id: projectId,
        category: billCategory,
        expense_date: billDate,
        amount: Number(billAmount),
        currency: "INR",
        payee: billPayee,
        description: billDesc,
        status: "pending_engineer",
        uploader_id: user.id,
        uploader_role: "site_supervisor",
        receipt_url: receiptUrl,
      });

      loadData();
      setIsBillModalOpen(false);
      setBillPayee("");
      setBillDesc("");
      setSelectedReceiptFile(null);
      setReceiptFileName("");
    } catch (err) {
      console.error("Save bill error:", err);
      alert("Failed to register bill.");
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  // Prepare Labor Headcount Data for Charts
  const uniqueDates = Array.from(new Set(attendanceList.map((a) => a.date))).slice(-5);
  const laborData = uniqueDates.length > 0
    ? uniqueDates.map((d) => {
        const dayRecords = attendanceList.filter((a) => a.date === d);
        const carpenters = dayRecords.filter((a) => a.labor_category.toLowerCase().includes("carpenter")).reduce((s, a) => s + a.headcount, 0);
        const barBenders = dayRecords.filter((a) => a.labor_category.toLowerCase().includes("bar") || a.labor_category.toLowerCase().includes("rebar")).reduce((s, a) => s + a.headcount, 0);
        const masons = dayRecords.filter((a) => a.labor_category.toLowerCase().includes("mason")).reduce((s, a) => s + a.headcount, 0);
        const helpers = dayRecords.filter((a) => a.labor_category.toLowerCase().includes("helper") || a.labor_category.toLowerCase().includes("unskilled")).reduce((s, a) => s + a.headcount, 0);
        const total = dayRecords.reduce((s, a) => s + a.headcount, 0);
        return {
          date: d.slice(5),
          carpenters: carpenters || 12,
          barBenders: barBenders || 14,
          masons: masons || 8,
          helpers: helpers || 18,
          total: total || 52,
        };
      })
    : [
        { date: "10-19", carpenters: 12, barBenders: 14, masons: 8, helpers: 16, total: 50 },
        { date: "10-20", carpenters: 14, barBenders: 15, masons: 9, helpers: 18, total: 56 },
        { date: "10-21", carpenters: 15, barBenders: 14, masons: 10, helpers: 20, total: 59 },
        { date: "10-22", carpenters: 16, barBenders: 16, masons: 8, helpers: 18, total: 58 },
        { date: "10-23", carpenters: 18, barBenders: 16, masons: 11, helpers: 22, total: 67 },
      ];

  // Prepare Expense Breakdown Data for Charts
  const categoryMap: { [cat: string]: number } = {};
  billsList.forEach((e) => {
    categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
  });
  const billCategoryData = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value,
  }));
  if (billCategoryData.length === 0) {
    billCategoryData.push(
      { name: "Materials", value: 385000 },
      { name: "Equipment", value: 125000 },
      { name: "Labor", value: 180000 },
      { name: "Permits & Safety", value: 45000 }
    );
  }

  const totalWorkersToday = attendanceList
    .filter((a) => a.date === "2026-10-23")
    .reduce((sum, a) => sum + a.headcount, 0);

  return (
    <AppShell
      title="Supervisor Field Desk"
      subtitle="Operational Shift Console: Daily Attendance, Field Photos/Videos & Site Bills"
      activeProjectId={projectId}
    >
      {/* Supervisor Header Banner */}
      <div className="bg-construct-surface border border-construct-border rounded-xl p-5 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-100 text-blue-700 shrink-0">
            <HardHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                FIELD SUPERVISOR DESK
              </span>
              <span className="text-xs text-construct-secondary font-mono">Shift: Oct 23, 2026</span>
            </div>
            <h2 className="text-xl font-heading font-extrabold text-construct-text mt-1">
              Field Execution & Daily Submissions
            </h2>
          </div>
        </div>

        {/* 3 Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAttendanceModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-construct-text text-white hover:bg-black text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-construct-orange" />
            <span>+ Log Attendance</span>
          </button>
          <button
            onClick={() => setIsPhotoModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-construct-orange text-white hover:bg-construct-orangeHover text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>+ Upload Photo / Video</span>
          </button>
          <button
            onClick={() => setIsBillModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-construct-surface border border-construct-border hover:bg-construct-muted text-xs font-bold text-construct-text transition-all shadow-sm cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5 text-emerald-600" />
            <span>+ Upload Bill</span>
          </button>
        </div>
      </div>

      {/* 3 Work Tabs */}
      <div className="flex items-center border-b border-construct-border gap-2 pb-px mt-6">
        <button
          onClick={() => setActiveTab("attendance")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "attendance"
              ? "border-construct-orange text-construct-orange bg-orange-50/40"
              : "border-transparent text-construct-secondary hover:text-construct-text hover:bg-construct-muted/40"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>1. Daily Labor Attendance</span>
          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-construct-muted text-construct-secondary font-normal">
            {totalWorkersToday} On Site
          </span>
        </button>

        <button
          onClick={() => setActiveTab("photos")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "photos"
              ? "border-construct-orange text-construct-orange bg-orange-50/40"
              : "border-transparent text-construct-secondary hover:text-construct-text hover:bg-construct-muted/40"
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>2. Work Done Photos & Videos</span>
          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-construct-muted text-construct-secondary font-normal">
            {evidenceList.length} Files
          </span>
        </button>

        <button
          onClick={() => setActiveTab("bills")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "bills"
              ? "border-construct-orange text-construct-orange bg-orange-50/40"
              : "border-transparent text-construct-secondary hover:text-construct-text hover:bg-construct-muted/40"
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>3. Upload Bills & Receipts</span>
          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-construct-muted text-construct-secondary font-normal">
            {billsList.length} Bills
          </span>
        </button>
      </div>

      {/* TAB 1: EMPLOYEE DAILY ATTENDANCE */}
      {activeTab === "attendance" && (
        <div className="space-y-4 mt-6">
          {/* Graphical Labor Workforce Trend */}
          <div className="bg-construct-surface border border-construct-border rounded-xl p-5 shadow-subtle">
            <div className="flex items-center justify-between pb-3 border-b border-construct-border mb-4">
              <div>
                <h3 className="font-heading font-extrabold text-sm text-construct-text flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span>Workforce Headcount Presence by Trade Over Recent Shifts</span>
                </h3>
                <p className="text-xs text-construct-secondary mt-0.5">
                  Visual distribution of shuttering carpenters, bar benders, masons, and helpers active on site.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                {totalWorkersToday} Present Today
              </span>
            </div>
            <LaborHeadcountChart data={laborData} height={250} />
          </div>

          <div className="bg-construct-surface border border-construct-border rounded-xl shadow-subtle overflow-hidden">
            <div className="p-4 border-b border-construct-border flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-sm text-construct-text">
                  On-Site Labor Headcount & Trade Attendance
                </h3>
                <p className="text-xs text-construct-secondary">
                  Recorded daily by Site Supervisor to verify workforce presence before shift sign-off.
                </p>
              </div>
              <button
                onClick={() => setIsAttendanceModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-construct-orange text-white text-xs font-bold hover:bg-construct-orangeHover flex items-center gap-1 shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Gang Headcount</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-construct-border bg-construct-bg text-[11px] font-mono font-bold text-construct-secondary">
                    <th className="py-3 px-4">DATE</th>
                    <th className="py-3 px-4">TRADE / CATEGORY</th>
                    <th className="py-3 px-4">HEADCOUNT</th>
                    <th className="py-3 px-4">SHIFT</th>
                    <th className="py-3 px-4">CONTRACTOR / GANG</th>
                    <th className="py-3 px-4">ASSIGNMENT / NOTES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-construct-border/60">
                  {attendanceList.map((att) => (
                    <tr key={att.id} className="hover:bg-construct-muted/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-construct-text">{att.date}</td>
                      <td className="py-3 px-4 font-semibold text-construct-text">{att.labor_category}</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-700 text-sm">
                        {att.headcount} Workers
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-800 uppercase">
                          {att.shift} Shift
                        </span>
                      </td>
                      <td className="py-3 px-4 text-construct-secondary">{att.contractor_name || "Direct Site Labor"}</td>
                      <td className="py-3 px-4 text-construct-secondary">{att.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WORK DONE PHOTOS & VIDEOS */}
      {activeTab === "photos" && (
        <div className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-construct-secondary">
              Upload photographs and inspection videos of work executed on site today (shuttering, concrete pours, rebar cages).
            </p>
            <button
              onClick={() => setIsPhotoModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-construct-orange text-white text-xs font-bold hover:bg-construct-orangeHover flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload Work Photo / Video</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {evidenceList.map((item) => {
              const act = activities.find((a) => a.id === item.activity_id);
              const isVideo = item.evidence_type === "video";
              return (
                <div
                  key={item.id}
                  onClick={() => setPreviewMedia(item)}
                  className="bg-construct-surface border border-construct-border rounded-xl overflow-hidden shadow-subtle group hover:border-construct-orange/40 transition-all flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    <div className="h-44 bg-black/90 relative overflow-hidden flex items-center justify-center">
                      <ResolvedMedia
                        filePath={item.file_path}
                        mediaType={isVideo ? "video" : "photo"}
                        controls={false}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {isVideo && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-white/90 text-purple-900 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Play className="w-5 h-5 fill-purple-900 ml-0.5" />
                          </div>
                        </div>
                      )}
                      <div className="absolute top-2.5 left-2.5 pointer-events-none">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${
                          isVideo ? "bg-purple-900/90 text-purple-200 border border-purple-400/40" : "bg-zinc-900/80 text-zinc-200"
                        }`}>
                          {isVideo ? <Video className="w-3 h-3" /> : <Camera className="w-3 h-3" />}
                          {isVideo ? "VIDEO" : "PHOTO"}
                        </span>
                      </div>
                      <div className="absolute top-2.5 right-2.5 pointer-events-none">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shadow-xs ${
                          item.approval_status === "approved"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : item.approval_status === "pending_manager"
                            ? "bg-blue-100 text-blue-800 border border-blue-200"
                            : item.approval_status === "rejected"
                            ? "bg-rose-100 text-rose-800 border border-rose-200"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}>
                          {item.approval_status === "approved"
                            ? "APPROVED BY PM"
                            : item.approval_status === "pending_manager"
                            ? "AWAITING PM APPROVAL"
                            : item.approval_status === "rejected"
                            ? "REJECTED"
                            : "AWAITING SITE ENG"}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="font-heading font-bold text-sm text-construct-text group-hover:text-construct-orange transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs text-construct-secondary mt-1 line-clamp-2">
                        {item.description}
                      </p>
                      {act && (
                        <div className="mt-2 text-[11px] font-mono text-construct-orange font-bold">
                          {act.code}: {act.name}
                        </div>
                      )}

                      {/* 3-Stage Governance Stepper */}
                      <div className="mt-3 space-y-1 pt-2.5 border-t border-construct-border/60 text-[10px] font-mono bg-construct-bg/50 p-2 rounded-lg">
                        <div className="flex items-center gap-1.5 text-construct-secondary">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span>1. Uploaded by Supervisor</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {item.approval_status === "pending_engineer" ? (
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                          ) : item.approval_status === "rejected" ? (
                            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          )}
                          <span className={item.approval_status === "pending_engineer" ? "text-amber-800 font-bold" : "text-construct-secondary"}>
                            2. Site Engineer: {item.engineer_approved_by ? "Approved" : "Pending Verification"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {item.approval_status === "approved" ? (
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          ) : item.approval_status === "pending_manager" ? (
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-construct-border"></span>
                          )}
                          <span className={item.approval_status === "approved" ? "text-emerald-700 font-bold" : item.approval_status === "pending_manager" ? "text-blue-700 font-bold" : "text-construct-secondary"}>
                            3. Project Manager: {item.approval_status === "approved" ? "Authorized" : "Awaiting Sign-off"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Physical Action Buttons on Card for Site Engineer / PM */}
                  {((currentRole === "site_engineer" && item.approval_status === "pending_engineer") ||
                    ((currentRole === "project_manager" || currentRole === "super_admin") && item.approval_status === "pending_manager")) && (
                    <div className="p-3 bg-construct-bg border-t border-construct-border flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setRejectingItem({ type: "photo", id: item.id, title: item.title })}
                        className="px-2.5 py-1 rounded text-[11px] font-bold border border-rose-300 text-rose-700 hover:bg-rose-50 cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprovePhotoDirect(item)}
                        className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>{currentRole === "site_engineer" ? "Approve Photo (Eng)" : "Authorize (PM)"}</span>
                      </button>
                    </div>
                  )}

                  <div className="p-4 pt-2 border-t border-construct-border/60 text-[11px] font-mono text-construct-secondary flex items-center justify-between">
                    <span>Captured: {item.capture_date ? new Date(item.capture_date).toLocaleDateString() : "Today"}</span>
                    <span className="uppercase text-[10px] font-bold text-construct-orange flex items-center gap-1">
                      <Eye className="w-3 h-3" /> View
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: UPLOAD BILLS & RECEIPTS */}
      {activeTab === "bills" && (
        <div className="space-y-4 mt-6">
          {/* Graphical Representation of Bills by Category */}
          <div className="bg-construct-surface border border-construct-border rounded-xl p-5 shadow-subtle">
            <div className="flex items-center justify-between pb-3 border-b border-construct-border mb-4">
              <div>
                <h3 className="font-heading font-extrabold text-sm text-construct-text flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-construct-orange" />
                  <span>Site Expenditure & Voucher Distribution by Trade</span>
                </h3>
                <p className="text-xs text-construct-secondary mt-0.5">
                  Graphical allocation of uploaded petty cash, materials, equipment fuel, and contractor challans.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-construct-orange bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200">
                ₹{billCategoryData.reduce((sum, item) => sum + item.value, 0).toLocaleString()} Total Vouched
              </span>
            </div>
            <div className="flex items-center justify-center">
              <ExpenseCategoryDonutChart data={billCategoryData} height={260} />
            </div>
          </div>

          <div className="bg-construct-surface border border-construct-border rounded-xl shadow-subtle overflow-hidden">
            <div className="p-4 border-b border-construct-border flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-sm text-construct-text">
                  Site Bills, Delivery Challans & Petty Cash Vouchers
                </h3>
                <p className="text-xs text-construct-secondary">
                  Supervisor uploads invoices and fuel receipts. First approved by Site Engineer, then authorized by Project Manager.
                </p>
              </div>
              <button
                onClick={() => setIsBillModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-construct-orange text-white text-xs font-bold hover:bg-construct-orangeHover flex items-center gap-1 shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload New Bill</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-construct-border bg-construct-bg text-[11px] font-mono font-bold text-construct-secondary">
                    <th className="py-3 px-4">DATE</th>
                    <th className="py-3 px-4">CATEGORY</th>
                    <th className="py-3 px-4">VENDOR / PAYEE</th>
                    <th className="py-3 px-4">DESCRIPTION / BILL ITEMS</th>
                    <th className="py-3 px-4">AMOUNT (INR)</th>
                    <th className="py-3 px-4">RECEIPT</th>
                    <th className="py-3 px-4">APPROVAL STAGE</th>
                    <th className="py-3 px-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-construct-border/60">
                  {billsList.map((bill) => (
                    <tr key={bill.id} className="hover:bg-construct-muted/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-construct-secondary">{bill.expense_date}</td>
                      <td className="py-3 px-4 font-mono font-bold text-construct-orange">{bill.category}</td>
                      <td className="py-3 px-4 font-semibold text-construct-text">{bill.payee}</td>
                      <td className="py-3 px-4 text-construct-secondary">{bill.description}</td>
                      <td className="py-3 px-4 font-mono font-bold text-construct-text">
                        ₹{bill.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        {bill.receipt_url ? (
                          <button
                            type="button"
                            onClick={() => setPreviewReceiptUrl(bill.receipt_url!)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors cursor-pointer"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Voucher</span>
                          </button>
                        ) : (
                          <span className="text-construct-secondary font-mono text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {bill.status === "pending_engineer" ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            1. AWAITING SITE ENG
                          </span>
                        ) : bill.status === "pending_manager" ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            2. AWAITING PM SIGN-OFF
                          </span>
                        ) : bill.status === "approved" ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            3. FULLY APPROVED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            REJECTED
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {currentRole === "site_engineer" && bill.status === "pending_engineer" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setRejectingItem({ type: "bill", id: bill.id, title: `${bill.payee} (₹${bill.amount})` })}
                              className="px-2 py-1 rounded text-[10px] font-bold border border-rose-300 text-rose-700 hover:bg-rose-50 cursor-pointer"
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApproveBillDirect(bill)}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                            >
                              <Check className="w-3 h-3 stroke-[2.5]" />
                              <span>Approve (Eng)</span>
                            </button>
                          </div>
                        ) : (currentRole === "project_manager" || currentRole === "super_admin") && bill.status === "pending_manager" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setRejectingItem({ type: "bill", id: bill.id, title: `${bill.payee} (₹${bill.amount})` })}
                              className="px-2 py-1 rounded text-[10px] font-bold border border-rose-300 text-rose-700 hover:bg-rose-50 cursor-pointer"
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApproveBillDirect(bill)}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                            >
                              <Check className="w-3 h-3 stroke-[2.5]" />
                              <span>Authorize (PM)</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] font-mono text-construct-secondary">In Order</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Add Daily Attendance */}
      {isAttendanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-construct-text/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-construct-surface border border-construct-border rounded-xl shadow-elevated p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-construct-border">
              <h3 className="font-heading font-extrabold text-base text-construct-text">
                Record Gang Attendance (Work 1)
              </h3>
              <button onClick={() => setIsAttendanceModalOpen(false)} className="text-construct-secondary hover:text-construct-text cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAttendance} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-construct-text mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={attDate}
                    onChange={(e) => setAttDate(e.target.value)}
                    className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg text-xs focus:outline-none focus:border-construct-orange font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-construct-text mb-1">Shift *</label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value)}
                    className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg text-xs focus:outline-none focus:border-construct-orange"
                  >
                    <option value="day">Day Shift (08:00 - 17:00)</option>
                    <option value="night">Night Shift (20:00 - 05:00)</option>
                    <option value="overtime">Overtime Gang (17:00 - 21:00)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-construct-text mb-1">Trade / Category *</label>
                <select
                  value={laborCategory}
                  onChange={(e) => setLaborCategory(e.target.value)}
                  className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg text-xs focus:outline-none focus:border-construct-orange"
                >
                  <option value="Carpenters (Shuttering)">Carpenters (Shuttering & Formwork)</option>
                  <option value="Bar Benders (Rebar)">Bar Benders (Rebar & Mesh)</option>
                  <option value="Masons (Brick & Block)">Masons (Brickwork & Plaster)</option>
                  <option value="Helpers / Unskilled Labor">Helpers & Unskilled Labor</option>
                  <option value="Electricians">Electricians & Conduit Workers</option>
                  <option value="Plumbers">Plumbers & Sanitary Fitters</option>
                  <option value="Plant & Machinery Operators">Machinery & Crane Operators</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-construct-text mb-1">Worker Headcount *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={headcount}
                  onChange={(e) => setHeadcount(Number(e.target.value))}
                  className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg font-mono text-xs focus:outline-none focus:border-construct-orange"
                />
              </div>

              <div>
                <label className="block font-bold text-construct-text mb-1">Contractor / Gang Name</label>
                <input
                  type="text"
                  value={contractorName}
                  onChange={(e) => setContractorName(e.target.value)}
                  placeholder="e.g. Omkar Formwork Gang"
                  className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg text-xs focus:outline-none focus:border-construct-orange"
                />
              </div>

              <div>
                <label className="block font-bold text-construct-text mb-1">Work Location & Assignment Notes</label>
                <input
                  type="text"
                  value={attNotes}
                  onChange={(e) => setAttNotes(e.target.value)}
                  placeholder="e.g. Level 01 Column shuttering & line dori check"
                  className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg text-xs focus:outline-none focus:border-construct-orange"
                />
              </div>

              <div className="pt-3 border-t border-construct-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAttendanceModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-construct-border text-construct-secondary hover:bg-construct-muted text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-construct-orange text-white text-xs font-semibold hover:bg-construct-orangeHover cursor-pointer shadow-sm"
                >
                  Save Attendance Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Upload Work Done Photo or Video */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-construct-text/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-construct-surface border border-construct-border rounded-xl shadow-elevated p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-construct-border">
              <h3 className="font-heading font-extrabold text-base text-construct-text flex items-center gap-2">
                <Camera className="w-4 h-4 text-construct-orange" />
                <span>Upload Work Photo / Video (Work 2)</span>
              </h3>
              <button onClick={() => setIsPhotoModalOpen(false)} className="text-construct-secondary hover:text-construct-text cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePhoto} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-construct-text mb-1">Media Type *</label>
                  <select
                    value={mediaType}
                    onChange={(e) => setMediaType(e.target.value as "photo" | "video")}
                    className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg text-xs font-semibold focus:outline-none focus:border-construct-orange"
                  >
                    <option value="photo">📷 Site Photo</option>
                    <option value="video">🎥 Site Video</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-construct-text mb-1">Linked Activity</label>
                  <select
                    value={photoActivityId}
                    onChange={(e) => setPhotoActivityId(e.target.value)}
                    className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg text-xs focus:outline-none focus:border-construct-orange"
                  >
                    {activities.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code}: {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Direct File Picker / Camera for site phones */}
              <div className="p-3.5 rounded-xl border border-dashed border-construct-border bg-construct-bg/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-construct-text flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-construct-orange" />
                    <span>Upload from Device / Camera</span>
                  </span>
                  {mediaFileName && (
                    <span className="text-[10px] font-mono text-emerald-600 font-bold truncate max-w-[180px]">
                      {mediaFileName}
                    </span>
                  )}
                </div>
                <input
                  type="file"
                  ref={mediaFileInputRef}
                  accept="video/*,image/*"
                  onChange={handleMediaFileChange}
                  className="w-full text-xs text-construct-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-construct-orange file:text-white hover:file:bg-construct-orangeHover cursor-pointer"
                />
                <p className="text-[10px] text-construct-secondary mt-1.5">
                  Directly capture from mobile camera or select MP4/MOV video or JPEG/PNG photo.
                </p>
              </div>

              <div>
                <label className="block font-bold text-construct-text mb-1">Title / Caption *</label>
                <input
                  type="text"
                  required
                  value={photoTitle}
                  onChange={(e) => setPhotoTitle(e.target.value)}
                  placeholder={mediaType === "video" ? "e.g. Needle Vibrator Compaction Video" : "e.g. Level 01 Column C-4 Shuttering Completed"}
                  className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg text-xs focus:outline-none focus:border-construct-orange font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-construct-text mb-1">Observation / Inspection Notes</label>
                <textarea
                  rows={2}
                  value={photoNotes}
                  onChange={(e) => setPhotoNotes(e.target.value)}
                  placeholder="e.g. Plumb line verified. Ready for engineer pre-pour inspection."
                  className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg text-xs focus:outline-none focus:border-construct-orange"
                />
              </div>

              <div className="pt-3 border-t border-construct-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-construct-border text-construct-secondary hover:bg-construct-muted text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingMedia}
                  className="px-4 py-2 rounded-lg bg-construct-orange text-white text-xs font-semibold hover:bg-construct-orangeHover flex items-center gap-1.5 cursor-pointer disabled:opacity-60 shadow-sm"
                >
                  {mediaType === "video" ? <Video className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
                  <span>{isUploadingMedia ? "Saving..." : "Save & Register Media"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Upload Bills & Receipts */}
      {isBillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-construct-text/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-construct-surface border border-construct-border rounded-xl shadow-elevated p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-construct-border">
              <h3 className="font-heading font-extrabold text-base text-construct-text flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>Upload Bill / Delivery Challan (Work 3)</span>
              </h3>
              <button onClick={() => setIsBillModalOpen(false)} className="text-construct-secondary hover:text-construct-text cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBill} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-construct-text mb-1">Bill Category</label>
                  <select
                    value={billCategory}
                    onChange={(e) => setBillCategory(e.target.value)}
                    className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg text-xs focus:outline-none focus:border-construct-orange"
                  >
                    <option value="Materials">Materials / Aggregates</option>
                    <option value="Equipment">Fuel / Equipment Lease</option>
                    <option value="Labor">Gang Petty Cash / Overtime</option>
                    <option value="Permits & Safety">Safety Gear / Consumables</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-construct-text mb-1">Amount (INR) *</label>
                  <input
                    type="number"
                    required
                    value={billAmount}
                    onChange={(e) => setBillAmount(Number(e.target.value))}
                    className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg font-mono text-xs focus:outline-none focus:border-construct-orange"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-construct-text mb-1">Vendor / Payee *</label>
                <input
                  type="text"
                  required
                  value={billPayee}
                  onChange={(e) => setBillPayee(e.target.value)}
                  placeholder="e.g. Mahavir Hardware & Building Supplies"
                  className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg text-xs focus:outline-none focus:border-construct-orange"
                />
              </div>

              {/* Physical Bill Attachment */}
              <div className="p-3.5 rounded-xl border border-dashed border-construct-border bg-construct-bg/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-construct-text flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Attach Bill Photo or Invoice PDF (Optional)</span>
                  </span>
                  {receiptFileName && (
                    <span className="text-[10px] font-mono text-emerald-600 font-bold truncate max-w-[180px]">
                      {receiptFileName}
                    </span>
                  )}
                </div>
                <input
                  type="file"
                  ref={receiptFileInputRef}
                  accept="image/*,application/pdf"
                  onChange={handleReceiptFileChange}
                  className="w-full text-xs text-construct-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-construct-text file:text-white hover:file:bg-black cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-bold text-construct-text mb-1">Bill Items & Purpose</label>
                <textarea
                  rows={2}
                  value={billDesc}
                  onChange={(e) => setBillDesc(e.target.value)}
                  placeholder="e.g. 50L diesel for transit mixer pump + 20kg binding wire challan"
                  className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg text-xs focus:outline-none focus:border-construct-orange"
                />
              </div>

              <div className="pt-3 border-t border-construct-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBillModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-construct-border text-construct-secondary hover:bg-construct-muted text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingReceipt}
                  className="px-4 py-2 rounded-lg bg-construct-orange text-white text-xs font-semibold hover:bg-construct-orangeHover cursor-pointer disabled:opacity-60 shadow-sm"
                >
                  {isUploadingReceipt ? "Uploading..." : "Submit Bill for PM Approval"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MEDIA INSPECTOR MODAL */}
      {previewMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-3xl bg-construct-surface border border-construct-border rounded-2xl shadow-elevated overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-construct-border flex items-center justify-between bg-construct-bg">
              <div className="flex items-center gap-2">
                {previewMedia.evidence_type === "video" ? (
                  <Video className="w-4 h-4 text-purple-600" />
                ) : (
                  <Camera className="w-4 h-4 text-construct-orange" />
                )}
                <h3 className="font-heading font-extrabold text-sm text-construct-text">
                  {previewMedia.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewMedia(null)}
                className="text-construct-secondary hover:text-construct-text p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="h-96 bg-black flex items-center justify-center overflow-hidden">
              <ResolvedMedia
                filePath={previewMedia.file_path}
                mediaType={previewMedia.evidence_type === "video" ? "video" : "photo"}
                controls={true}
                autoPlay={true}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="p-5 space-y-3 text-xs bg-construct-surface">
              <p className="text-construct-text font-medium leading-relaxed">
                {previewMedia.description}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-construct-secondary pt-3 border-t border-construct-border">
                <span>Date: {previewMedia.capture_date ? new Date(previewMedia.capture_date).toLocaleString() : "Today"}</span>
                <span>Type: {previewMedia.file_type}</span>
                <span>Size: {(previewMedia.file_size_bytes / 1024 / 1024).toFixed(2)} MB</span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold uppercase">
                  Verified by Supervisor
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT INSPECTOR MODAL */}
      {previewReceiptUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-construct-surface border border-construct-border rounded-2xl shadow-elevated overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-construct-border flex items-center justify-between bg-construct-bg">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <h3 className="font-heading font-extrabold text-sm text-construct-text">
                  Attached Voucher / Challan
                </h3>
              </div>
              <button
                onClick={() => setPreviewReceiptUrl(null)}
                className="text-construct-secondary hover:text-construct-text p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="h-80 bg-zinc-950 flex items-center justify-center p-4">
              <ResolvedMedia
                filePath={previewReceiptUrl}
                mediaType="photo"
                className="max-h-full max-w-full object-contain rounded-lg"
              />
            </div>

            <div className="p-4 text-right bg-construct-surface border-t border-construct-border">
              <button
                type="button"
                onClick={() => setPreviewReceiptUrl(null)}
                className="px-4 py-2 rounded-lg bg-construct-text text-white text-xs font-bold hover:bg-black transition-colors cursor-pointer"
              >
                Close Voucher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
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
                Reason for Return / Rejection Note *
              </label>
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Please re-check voucher total or rebar cover..."
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
    </AppShell>
  );
}

export default function SupervisorPortalPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-xs font-mono text-construct-secondary">Loading Supervisor Portal...</div>}>
      <SupervisorPortalContent />
    </React.Suspense>
  );
}
