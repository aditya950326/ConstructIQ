"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Bell, AlertTriangle, CheckCircle2, Package, ShieldAlert, ArrowRight } from "lucide-react";
import { repository } from "@/lib/data/repository";
import { NotificationItem } from "@/types/database";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setNotifications(repository.getNotifications());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleItemClick = (item: NotificationItem) => {
    repository.markNotificationRead(item.id);
    setNotifications(repository.getNotifications());
    if (item.link_url) {
      onClose();
      router.push(item.link_url);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "risk_alert":
        return <AlertTriangle className="w-4 h-4 text-construct-orange" />;
      case "material_shortage":
        return <Package className="w-4 h-4 text-amber-600" />;
      case "quality_issue":
        return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-construct-text/30 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md h-full bg-construct-surface border-l border-construct-border shadow-elevated flex flex-col animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-construct-border">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-construct-orange" />
            <h3 className="font-heading font-bold text-construct-text text-base">Project Notifications</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-construct-secondary hover:text-construct-text hover:bg-construct-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="py-16 text-center text-xs text-construct-secondary">
              No recent notifications or alerts.
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`p-3.5 rounded-lg border transition-all cursor-pointer group ${
                  item.is_read
                    ? "bg-construct-surface border-construct-border text-construct-secondary"
                    : "bg-construct-muted/40 border-construct-orange/30 shadow-subtle text-construct-text"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-md bg-construct-surface border border-construct-border/60 shrink-0 mt-0.5">
                    {getIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-construct-text group-hover:text-construct-orange transition-colors truncate">
                        {item.title}
                      </h4>
                      {!item.is_read && (
                        <span className="w-2 h-2 rounded-full bg-construct-orange shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-construct-secondary mt-1 leading-relaxed">
                      {item.message}
                    </p>
                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-construct-border/40 text-[10px] text-construct-secondary font-mono">
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      <span className="inline-flex items-center gap-1 font-sans text-construct-orange font-medium group-hover:translate-x-0.5 transition-transform">
                        View record <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-construct-border bg-construct-bg text-center">
          <p className="text-[11px] text-construct-secondary font-mono">
            Notifications are synchronized with live site intelligence rules.
          </p>
        </div>
      </div>
    </div>
  );
}
