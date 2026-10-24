"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { repository } from "@/lib/data/repository";
import { AuditLog } from "@/types/database";
import { History, ShieldCheck, Clock, User, Filter } from "lucide-react";

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    setLogs(repository.getAuditLogs());
  }, []);

  return (
    <AppShell
      title="System Audit Trail & Compliance Log"
      subtitle="Immutable Chronicle of Approval Sign-Offs, Stock Transactions & Edits"
    >
      <div className="bg-construct-surface border border-construct-border rounded-xl shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-construct-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-construct-orange" />
            <h3 className="font-heading font-bold text-sm text-construct-text">
              Operational Traceability & Governance Log
            </h3>
          </div>
          <span className="text-xs font-mono text-construct-secondary">
            {logs.length} Audited Events
          </span>
        </div>

        <div className="divide-y divide-construct-border/60">
          {logs.map((log) => (
            <div key={log.id} className="p-4 hover:bg-construct-muted/40 transition-colors text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-construct-orange">{log.action}</span>
                  <span className="px-2 py-0.2 rounded text-[10px] font-mono font-semibold bg-construct-muted text-construct-secondary uppercase">
                    {log.entity_type}
                  </span>
                </div>
                <p className="font-mono text-construct-text text-[11px]">
                  Payload: {log.details}
                </p>
              </div>

              <div className="text-right font-mono text-[11px] text-construct-secondary shrink-0">
                <div className="flex items-center gap-1 sm:justify-end">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(log.created_at).toLocaleString()}</span>
                </div>
                <span className="text-[10px] text-construct-secondary block mt-0.5">Event ID: {log.id}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
