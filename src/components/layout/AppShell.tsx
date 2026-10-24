"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  activeProjectId?: string;
  headerActions?: React.ReactNode;
}

export function AppShell({
  children,
  title,
  subtitle,
  activeProjectId,
  headerActions,
}: AppShellProps) {
  return (
    <div className="flex h-screen bg-construct-bg overflow-hidden text-construct-text">
      {/* Fixed Sidebar */}
      <Sidebar activeProjectId={activeProjectId} />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title={title}
          subtitle={subtitle}
          activeProjectId={activeProjectId}
          actions={headerActions}
        />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
