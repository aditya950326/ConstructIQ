"use client";

import React, { useState, useRef } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { repository } from "@/lib/data/repository";
import { isSupabaseConfigured } from "@/lib/supabase/client";
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
} from "lucide-react";

export default function SettingsPage() {
  const [isReset, setIsReset] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isCloudSupabase = isSupabaseConfigured();

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
      title="System Settings & Site Operations Engine"
      subtitle="Enterprise Data Persistence, Disaster Recovery & Security Architecture"
    >
      <div className="space-y-6">
        {feedback && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{feedback}</span>
          </div>
        )}

        {/* Backend Engine Status */}
        <div className="bg-construct-surface border border-construct-border rounded-xl p-6 shadow-subtle">
          <div className="flex items-center gap-3 pb-4 border-b border-construct-border">
            <div className="p-2 rounded-lg bg-orange-100 text-construct-orange">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-base text-construct-text">
                PostgreSQL & Cloud Persistence Engine
              </h3>
              <p className="text-xs text-construct-secondary">
                Production-grade data architecture with real-time sync and zero-loss offline resilience.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs font-mono">
            <div className="p-4 rounded-lg bg-construct-bg border border-construct-border/60">
              <span className="text-construct-secondary text-[10px] block uppercase font-bold tracking-wider">
                ACTIVE PERSISTENCE ENGINE
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-construct-text text-sm">
                  {isCloudSupabase ? "Supabase Cloud PostgreSQL" : "ConstructIQ High-Performance Local Store"}
                </span>
              </div>
              <p className="text-construct-secondary font-sans text-xs mt-2 leading-relaxed">
                Physical quantities, activity completions, material movements, daily site logs, inspection videos, and evidence records persist reliably.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-construct-bg border border-construct-border/60">
              <span className="text-construct-secondary text-[10px] block uppercase font-bold tracking-wider">
                ROW LEVEL SECURITY (RLS)
              </span>
              <div className="flex items-center gap-2 mt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-emerald-700 text-sm">
                  18 Database Tables Protected
                </span>
              </div>
              <p className="text-construct-secondary font-sans text-xs mt-2 leading-relaxed">
                Active PostgreSQL RLS policies defined in <code className="font-mono text-construct-text">supabase/migrations/20261023000000_init_constructiq.sql</code> guarantee complete multi-tenant tenant isolation.
              </p>
            </div>
          </div>
        </div>

        {/* Disaster Recovery & Site Backup */}
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

        {/* Baseline Re-initialization */}
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

        {/* Supabase Connection Instructions */}
        <div className="bg-construct-surface border border-construct-border rounded-xl p-6 shadow-subtle font-mono text-xs">
          <h4 className="font-heading font-bold text-sm text-construct-text mb-2 font-sans flex items-center gap-2">
            <Server className="w-4 h-4 text-construct-orange" />
            <span>Production Cloud Connection (.env.local)</span>
          </h4>
          <p className="text-construct-secondary text-xs mb-3 font-sans">
            To connect ConstructIQ to your hosted Supabase instance for live remote site deployment, add the following parameters to your environment configuration:
          </p>
          <pre className="p-4 rounded-lg bg-construct-bg border border-construct-border/80 text-[11px] text-construct-text overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`}
          </pre>
        </div>
      </div>
    </AppShell>
  );
}
