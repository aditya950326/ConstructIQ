"use client";

import React, { useState, useEffect } from "react";
import { Search, Bell, Plus, Database, Sparkles, LogOut, Check } from "lucide-react";
import { repository } from "@/lib/data/repository";
import { Profile } from "@/types/database";
import { GlobalSearchModal } from "@/components/search/GlobalSearchModal";
import { NotificationDrawer } from "@/components/notifications/NotificationDrawer";
import { isSupabaseConfigured } from "@/lib/supabase/client";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  activeProjectId?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, activeProjectId, actions }: HeaderProps) {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const syncUser = () => {
      setCurrentUser(repository.getCurrentUser());
      const notifs = repository.getNotifications();
      setUnreadCount(notifs.filter((n) => !n.is_read).length);
    };

    syncUser();
    window.addEventListener("constructiq-role-change", syncUser);
    window.addEventListener("storage", syncUser);

    return () => {
      window.removeEventListener("constructiq-role-change", syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, []);

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "super_admin":
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-purple-100 text-purple-700">SUPER ADMIN</span>;
      case "project_manager":
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-orange-100 text-construct-orange">PROJECT MANAGER</span>;
      case "site_engineer":
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-700">SITE ENGINEER</span>;
      case "site_supervisor":
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-100 text-blue-800">SITE SUPERVISOR</span>;
      default:
        return null;
    }
  };

  return (
    <>
      <header className="h-16 border-b border-construct-border bg-construct-surface px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
        {/* Title & Context */}
        <div className="flex items-center gap-4 min-w-0">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-heading font-bold text-lg text-construct-text tracking-tight truncate">
                {title || "ConstructIQ Platform"}
              </h1>
              {subtitle && (
                <span className="hidden sm:inline-block text-xs text-construct-secondary font-mono border-l border-construct-border pl-2.5">
                  {subtitle}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-3">
          {/* Custom page actions if passed */}
          {actions}

          {/* Quick Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-construct-border bg-construct-bg hover:bg-construct-muted text-xs text-construct-secondary transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Quick search...</span>
            <kbd className="hidden md:inline font-mono text-[10px] bg-construct-surface border border-construct-border px-1.5 py-0.5 rounded text-construct-secondary">
              Ctrl+K
            </kbd>
          </button>

          {/* Notifications Trigger */}
          <button
            onClick={() => setIsNotifOpen(true)}
            className="relative p-2 rounded-lg border border-construct-border bg-construct-surface hover:bg-construct-muted text-construct-text transition-colors"
            title="View Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-construct-orange text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-construct-border">
            <div className="w-8 h-8 rounded-full bg-construct-muted border border-construct-border flex items-center justify-center text-xs font-bold text-construct-text">
              {currentUser?.full_name?.charAt(0) || "U"}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-construct-text leading-tight truncate">
                {currentUser?.full_name || "Authorized Personnel"}
              </p>
              <div className="mt-0.5">{getRoleBadge(currentUser?.role)}</div>
            </div>

            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.href = "/login";
                }
              }}
              title="Sign Out of Site Session"
              className="ml-1 p-2 rounded-lg border border-construct-border/70 bg-construct-bg hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-construct-secondary transition-colors flex items-center gap-1.5 text-xs cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden xl:inline text-[11px] font-mono font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Global Modals */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        activeProjectId={activeProjectId}
      />
      <NotificationDrawer
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
      />
    </>
  );
}
