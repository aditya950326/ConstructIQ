"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X, FolderKanban, Calendar, Package, AlertTriangle, ShieldAlert } from "lucide-react";
import { repository } from "@/lib/data/repository";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProjectId?: string;
}

export function GlobalSearchModal({ isOpen, onClose, activeProjectId }: GlobalSearchModalProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const results = repository.search(query, activeProjectId);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Project":
        return <FolderKanban className="w-4 h-4 text-construct-orange" />;
      case "Activity":
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case "Material":
        return <Package className="w-4 h-4 text-amber-600" />;
      case "Quality":
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case "Safety":
        return <ShieldAlert className="w-4 h-4 text-emerald-600" />;
      default:
        return <Search className="w-4 h-4 text-construct-secondary" />;
    }
  };

  const handleSelect = (link: string) => {
    onClose();
    router.push(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-construct-text/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xl bg-construct-surface border border-construct-border rounded-xl shadow-elevated overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-construct-border gap-3 bg-construct-bg/50">
          <Search className="w-5 h-5 text-construct-secondary shrink-0" />
          <input
            type="text"
            placeholder="Search projects, activities, materials, quality defects... (ESC to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm text-construct-text placeholder:text-construct-secondary/70 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-construct-secondary hover:text-construct-text">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {query.trim() === "" ? (
            <div className="p-8 text-center text-xs text-construct-secondary">
              <p className="font-medium text-construct-text mb-1">Search ConstructIQ</p>
              <p>Type keywords to search across active schedules, logs, inventory, and observations.</p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-xs text-construct-secondary">
              No matching records found for <span className="font-mono text-construct-text">"{query}"</span>.
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((res) => (
                <button
                  key={`${res.category}-${res.id}`}
                  onClick={() => handleSelect(res.link)}
                  className="w-full text-left flex items-start gap-3 p-2.5 rounded-lg hover:bg-construct-muted/60 transition-colors group"
                >
                  <div className="p-1.5 rounded-md bg-construct-bg border border-construct-border/60 shrink-0 mt-0.5">
                    {getCategoryIcon(res.category)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-construct-text group-hover:text-construct-orange transition-colors truncate">
                        {res.title}
                      </span>
                      <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-construct-muted text-construct-secondary">
                        {res.category}
                      </span>
                    </div>
                    <p className="text-xs text-construct-secondary truncate mt-0.5">{res.snippet}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-construct-border bg-construct-bg text-[11px] text-construct-secondary flex items-center justify-between font-mono">
          <span>Navigate with mouse or Tab</span>
          <span>ConstructIQ Intelligence Search</span>
        </div>
      </div>
    </div>
  );
}
