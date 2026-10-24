"use client";

import React, { useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { repository } from "@/lib/data/repository";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { supabaseSyncService, SyncStatus } from "@/lib/supabase/sync-service";
import {
  Settings,
  Database,
  ShieldCheck,
  Check,
  Server,
  Lock,
  RefreshCw,
  HardDrive,
  Download,
  UploadCloud,
  FileCheck2,
  Activity,
  AlertCircle,
  Copy,
  ExternalLink,
  Zap,
} from "lucide-react";

export default function SettingsPage() {
  const [isReset, setIsReset] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isCloudSupabase = isSupabaseConfigured();

  // Supabase Sync States
  const [isTesting, setIsTesting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [tableCounts, setTableCounts] = useState<{ [table: string]: number }>({});
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    if (isCloudSupabase) {
      checkSupabaseConnection();
    }
  }, [isCloudSupabase]);

  const checkSupabaseConnection = async () => {
    setIsTesting(true);
    const res = await supabaseSyncService.testConnection();
    setSyncStatus(res);
    if (res.connected) {
      const counts = await supabaseSyncService.getTableCounts();
      setTableCounts(counts);
    }
    setIsTesting(false);
  };

  const handlePushToSupabase = async () => {
    if (!confirm("Upload and synchronize all local projects, activities, materials, attendance, and evidence to Supabase PostgreSQL?")) {
      return;
    }
    setIsPushing(true);
    setFeedback("Pushing all records to Supabase Cloud PostgreSQL...");

    const res = await supabaseSyncService.pushAllLocalDataToSupabase();
    setIsPushing(false);

    if (res.success) {
      setFeedback(`Successfully synchronized ${res.syncedRows} records to Supabase tables!`);
      const counts = await supabaseSyncService.getTableCounts();
      setTableCounts(counts);
    } else {
      setFeedback(`Sync failed: ${res.error || "Unknown error"}`);
    }

    setTimeout(() => setFeedback(null), 6000);
  };

  const handleResetData = () => {
    if (confirm("Re-initialize site database to initial baseline state? All custom entries will be restored to defaults.")) {
      repository.restoreBaselineData();
      setIsReset(true);
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  const handleExportBackup = () => {
    try {
      const dataStr = repository.exportSiteDataJson();
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateStr = new Date().toISOString().split("T")[0];
      link.href = url;
      link.download = `constructiq-site-backup-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setFeedback("Database backup exported successfully!");
      setTimeout(() => setFeedback(null), 4000);
    } catch (e) {
      console.error("Export backup error:", e);
      alert("Failed to export database backup.");
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonStr = event.target?.result as string;
        const success = repository.importSiteDataJson(jsonStr);
        if (success) {
          alert("Site database backup imported successfully! Reloading system...");
          window.location.reload();
        } else {
          alert("Invalid backup file format. Please upload a valid ConstructIQ database backup.");
        }
      } catch (err) {
        console.error("Import backup error:", err);
        alert("Failed to read backup file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <AppShell
      title="System Settings & Database Integration Engine"
      subtitle="Enterprise Data Persistence, Supabase Cloud PostgreSQL Sync & Security Architecture"
    >
      <div className="space-y-6">
        {feedback && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 shadow-xs">
            <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{feedback}</span>
          </div>
        )}

        {/* 1. Supabase Cloud PostgreSQL Sync Hub */}
        <div className="bg-construct-surface border border-construct-border rounded-xl p-6 shadow-subtle">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-construct-border">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-extrabold text-base text-construct-text">
                    Supabase PostgreSQL Cloud Integration
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                      isCloudSupabase
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : "bg-amber-100 text-amber-800 border border-amber-200"
                    }`}
                  >
                    {isCloudSupabase ? "Credentials Detected" : "Awaiting .env.local"}
                  </span>
                </div>
                <p className="text-xs text-construct-secondary mt-0.5">
                  Synchronize physical site quantities, employee attendance, material buffers, daily logs, and commercial bills directly with Supabase.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={checkSupabaseConnection}
                disabled={isTesting}
                className="px-3 py-1.5 rounded-lg bg-construct-surface border border-construct-border hover:bg-construct-muted text-xs font-semibold text-construct-text transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-construct-orange ${isTesting ? "animate-spin" : ""}`} />
                <span>{isTesting ? "Testing Ping..." : "Test Connection"}</span>
              </button>

              <button
                onClick={handlePushToSupabase}
                disabled={!isCloudSupabase || isPushing}
                className="px-3.5 py-1.5 rounded-lg bg-construct-orange text-white hover:bg-construct-orangeHover text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UploadCloud className={`w-3.5 h-3.5 ${isPushing ? "animate-bounce" : ""}`} />
                <span>{isPushing ? "Syncing..." : "Push Data to Supabase"}</span>
              </button>
            </div>
          </div>

          {/* Connection Diagnostics Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-construct-bg border border-construct-border/60">
              <span className="text-construct-secondary text-[10px] block uppercase font-bold tracking-wider">
                CONNECTION STATUS
              </span>
              <div className="flex items-center gap-2 mt-1.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    syncStatus?.connected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                  }`}
                />
                <span className="font-bold text-construct-text text-sm">
                  {syncStatus?.connected
                    ? "Connected to Live Cloud"
                    : isCloudSupabase
                    ? "Configured (Testing Needed)"
                    : "Local Offline Store Active"}
                </span>
              </div>
              <p className="text-construct-secondary font-sans text-[11px] mt-1.5">
                {syncStatus?.message || "Using in-memory/localStorage with automatic fallback."}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-construct-bg border border-construct-border/60">
              <span className="text-construct-secondary text-[10px] block uppercase font-bold tracking-wider">
                NETWORK LATENCY & HOST
              </span>
              <div className="flex items-center gap-2 mt-1.5">
                <Activity className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-construct-text text-sm">
                  {syncStatus?.latencyMs ? `${syncStatus.latencyMs} ms` : "—"}
                </span>
              </div>
              <p className="text-construct-secondary font-mono text-[11px] mt-1.5 truncate">
                Host: {process.env.NEXT_PUBLIC_SUPABASE_URL || "Local Dev Sandbox"}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-construct-bg border border-construct-border/60">
              <span className="text-construct-secondary text-[10px] block uppercase font-bold tracking-wider">
                CLOUD TABLE ROW COUNTS
              </span>
              <div className="flex items-center gap-2 mt-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-emerald-700 text-sm">
                  {Object.values(tableCounts).reduce((a, b) => a + b, 0)} Records in Cloud
                </span>
              </div>
              <p className="text-construct-secondary font-sans text-[11px] mt-1.5">
                {tableCounts.projects ? `${tableCounts.projects} projects, ` : ""}
                {tableCounts.activities ? `${tableCounts.activities} activities, ` : ""}
                {tableCounts.daily_attendance ? `${tableCounts.daily_attendance} attendance logs` : ""}
              </p>
            </div>
          </div>
        </div>

        {/* 2. Step-by-Step Instructions & Setup */}
        <div className="bg-construct-surface border border-construct-border rounded-xl p-6 shadow-subtle">
          <div className="flex items-center gap-3 pb-4 border-b border-construct-border">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-base text-construct-text">
                How to Connect Your Supabase Project (Microsteps)
              </h3>
              <p className="text-xs text-construct-secondary">
                Follow these 4 simple steps to integrate your hosted Supabase instance.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-lg bg-construct-bg border border-construct-border/70">
                <span className="font-bold text-construct-orange font-mono text-[11px]">STEP 1: CREATE PROJECT</span>
                <p className="text-construct-text font-medium mt-1">
                  Go to <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-blue-600 underline font-bold inline-flex items-center gap-0.5">Supabase Dashboard <ExternalLink className="w-3 h-3" /></a> and create a new project named <strong>ConstructIQ</strong>.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-construct-bg border border-construct-border/70">
                <span className="font-bold text-construct-orange font-mono text-[11px]">STEP 2: RUN SQL MIGRATION</span>
                <p className="text-construct-text font-medium mt-1">
                  In Supabase left menu, click <strong>SQL Editor</strong> &rarr; <strong>New Query</strong>. Paste the schema from <code className="font-mono text-construct-orange">supabase/migrations/20261023000000_init_constructiq.sql</code> and click <strong>Run</strong>.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-construct-bg border border-construct-border/70">
                <span className="font-bold text-construct-orange font-mono text-[11px]">STEP 3: COPY API KEYS</span>
                <p className="text-construct-text font-medium mt-1">
                  Go to <strong>Project Settings</strong> &rarr; <strong>API</strong>. Copy your <strong>Project URL</strong> and <strong>anon / public key</strong>.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-construct-bg border border-construct-border/70">
                <span className="font-bold text-construct-orange font-mono text-[11px]">STEP 4: SYNC DATA</span>
                <p className="text-construct-text font-medium mt-1">
                  Add them to your <code className="font-mono text-construct-orange">.env.local</code> file and click <strong>"Push Data to Supabase"</strong> above to upload all initial records!
                </p>
              </div>
            </div>

            {/* Code Box */}
            <div className="flex flex-col justify-between p-4 rounded-xl bg-zinc-950 text-zinc-200 font-mono text-xs border border-zinc-800">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800 mb-3 text-zinc-400 text-[11px]">
                  <span>.env.local CONFIGURATION</span>
                  <span className="text-emerald-400 font-bold">READY TO POPULATE</span>
                </div>
                <pre className="text-xs text-emerald-300 overflow-x-auto leading-relaxed">
{`# Add these 2 lines to your .env.local:
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>`}
                </pre>
              </div>

              <div className="pt-4 border-t border-zinc-800/80 text-[11px] text-zinc-400 flex items-center justify-between">
                <span>Migration File:</span>
                <span className="text-zinc-200">supabase/migrations/init_constructiq.sql</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Disaster Recovery & Site Backup */}
        <div className="bg-construct-surface border border-construct-border rounded-xl p-6 shadow-subtle">
          <div className="flex items-center gap-3 pb-4 border-b border-construct-border">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-base text-construct-text">
                Disaster Recovery & Offline Site Backups
              </h3>
              <p className="text-xs text-construct-secondary">
                Export and archive full project databases for PMC audit compliance or restore an earlier site snapshot.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="p-4 rounded-xl border border-construct-border bg-construct-bg flex flex-col justify-between">
              <div>
                <h4 className="font-heading font-bold text-sm text-construct-text flex items-center gap-2">
                  <Download className="w-4 h-4 text-construct-orange" />
                  <span>Export Site Database (.JSON)</span>
                </h4>
                <p className="text-xs text-construct-secondary mt-1">
                  Downloads an encrypted JSON archive containing all projects, daily logs, material movements, bills, attendance, and evidence records.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportBackup}
                className="mt-4 px-4 py-2 rounded-lg bg-construct-text text-white text-xs font-bold hover:bg-black transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Download className="w-4 h-4 text-construct-orange" />
                <span>Download Full Database Backup</span>
              </button>
            </div>

            <div className="p-4 rounded-xl border border-construct-border bg-construct-bg flex flex-col justify-between">
              <div>
                <h4 className="font-heading font-bold text-sm text-construct-text flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-emerald-600" />
                  <span>Restore from Backup (.JSON)</span>
                </h4>
                <p className="text-xs text-construct-secondary mt-1">
                  Upload a previously saved ConstructIQ database snapshot to restore project history, logs, and material tracking.
                </p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json,application/json"
                onChange={handleImportBackup}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 px-4 py-2 rounded-lg bg-construct-surface border border-construct-border text-construct-text text-xs font-bold hover:bg-construct-muted transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <UploadCloud className="w-4 h-4 text-emerald-600" />
                <span>Select & Restore Backup File</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4. Baseline Re-initialization */}
        <div className="bg-construct-surface border border-construct-border rounded-xl p-6 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h4 className="font-heading font-bold text-sm text-construct-text flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-construct-orange" />
              <span>Site Baseline Re-initialization</span>
            </h4>
            <p className="text-xs text-construct-secondary mt-0.5 max-w-xl">
              Re-initialize all project hierarchies, materials catalogs, standard WBS activities, and baseline site data.
            </p>
          </div>

          <button
            onClick={handleResetData}
            className="px-4 py-2 rounded-lg bg-construct-surface border border-construct-border hover:bg-construct-muted text-xs font-semibold text-construct-text transition-colors flex items-center gap-2 shadow-sm cursor-pointer shrink-0"
          >
            {isReset ? <Check className="w-4 h-4 text-emerald-600" /> : <RefreshCw className="w-4 h-4 text-construct-orange" />}
            <span>{isReset ? "Database Reset" : "Re-initialize Baseline"}</span>
          </button>
        </div>
      </div>
    </AppShell>
  );
}
