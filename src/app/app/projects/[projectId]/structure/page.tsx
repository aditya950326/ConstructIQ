"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { repository } from "@/lib/data/repository";
import { HierarchyNode, Activity } from "@/types/database";
import {
  Layers,
  Plus,
  FolderTree,
  ChevronRight,
  ChevronDown,
  Building,
  Box,
  MapPin,
  CheckCircle2,
  Clock,
  X,
} from "lucide-react";

export default function SiteHierarchyPage() {
  const params = useParams();
  const projectId = (params?.projectId as string) || "b0000000-0000-0000-0000-000000000001";

  const [nodes, setNodes] = useState<HierarchyNode[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Node Form State
  const [nodeType, setNodeType] = useState("Floor");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [parentId, setParentId] = useState<string>("");

  useEffect(() => {
    const hNodes = repository.getHierarchy(projectId);
    setNodes(hNodes);
    setActivities(repository.getActivities(projectId));
    if (hNodes.length > 0 && !selectedNodeId) {
      setSelectedNodeId(hNodes[0].id);
    }
  }, [projectId]);

  const handleAddNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;

    const newNode = repository.addHierarchyNode({
      project_id: projectId,
      parent_id: parentId ? parentId : null,
      node_type: nodeType,
      name,
      code,
      order_index: nodes.length + 1,
    });

    const updated = repository.getHierarchy(projectId);
    setNodes(updated);
    setSelectedNodeId(newNode.id);
    setIsAddModalOpen(false);
    setName("");
    setCode("");
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const nodeActivities = activities.filter((a) => a.hierarchy_node_id === selectedNodeId);

  // Build tree structure
  const rootNodes = nodes.filter((n) => !n.parent_id);
  const getChildNodes = (parentId: string) => nodes.filter((n) => n.parent_id === parentId);

  return (
    <AppShell
      title="Configurable Site Hierarchy"
      subtitle="Architectural Breakdown Structure (WBS & Location)"
      activeProjectId={projectId}
      headerActions={
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-construct-orange text-white text-xs font-semibold hover:bg-construct-orangeHover shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Hierarchy Node</span>
        </button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Interactive Hierarchy Tree */}
        <div className="bg-construct-surface border border-construct-border rounded-xl p-5 shadow-subtle">
          <div className="flex items-center justify-between pb-3 border-b border-construct-border">
            <div className="flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-construct-orange" />
              <h3 className="font-heading font-bold text-sm text-construct-text">Location Breakdown</h3>
            </div>
            <span className="text-[10px] font-mono text-construct-secondary">
              {nodes.length} Elements
            </span>
          </div>

          <div className="mt-4 space-y-1">
            {rootNodes.map((root) => {
              const children = getChildNodes(root.id);
              const isSelected = selectedNodeId === root.id;
              return (
                <div key={root.id} className="space-y-1">
                  <button
                    onClick={() => setSelectedNodeId(root.id)}
                    className={`w-full text-left flex items-center justify-between p-2.5 rounded-lg text-xs transition-all ${
                      isSelected
                        ? "bg-construct-orange text-white font-bold shadow-sm"
                        : "text-construct-text hover:bg-construct-muted/60"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Building className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-white" : "text-construct-secondary"}`} />
                      <span className="font-mono text-[10px] opacity-80">{root.node_type}:</span>
                      <span className="truncate">{root.name}</span>
                    </div>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                      isSelected ? "bg-white/20 text-white" : "bg-construct-muted text-construct-secondary"
                    }`}>
                      {root.code}
                    </span>
                  </button>

                  {/* Level 2 Children */}
                  {children.map((child) => {
                    const grandChildren = getChildNodes(child.id);
                    const isChildSelected = selectedNodeId === child.id;
                    return (
                      <div key={child.id} className="pl-4 space-y-1">
                        <button
                          onClick={() => setSelectedNodeId(child.id)}
                          className={`w-full text-left flex items-center justify-between p-2 rounded-lg text-xs transition-all ${
                            isChildSelected
                              ? "bg-construct-orange text-white font-bold shadow-sm"
                              : "text-construct-text hover:bg-construct-muted/60"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Layers className={`w-3.5 h-3.5 shrink-0 ${isChildSelected ? "text-white" : "text-construct-secondary"}`} />
                            <span className="font-mono text-[10px] opacity-80">{child.node_type}:</span>
                            <span className="truncate">{child.name}</span>
                          </div>
                          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                            isChildSelected ? "bg-white/20 text-white" : "bg-construct-muted text-construct-secondary"
                          }`}>
                            {child.code}
                          </span>
                        </button>

                        {/* Level 3 Grandchildren */}
                        {grandChildren.map((gc) => {
                          const isGcSelected = selectedNodeId === gc.id;
                          return (
                            <div key={gc.id} className="pl-4">
                              <button
                                onClick={() => setSelectedNodeId(gc.id)}
                                className={`w-full text-left flex items-center justify-between p-1.5 rounded-md text-xs transition-all ${
                                  isGcSelected
                                    ? "bg-construct-orange text-white font-bold shadow-sm"
                                    : "text-construct-text hover:bg-construct-muted/60"
                                }`}
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <MapPin className={`w-3 h-3 shrink-0 ${isGcSelected ? "text-white" : "text-construct-secondary"}`} />
                                  <span className="truncate">{gc.name}</span>
                                </div>
                                <span className={`text-[9px] font-mono px-1 py-0.2 rounded ${
                                  isGcSelected ? "bg-white/20 text-white" : "bg-construct-muted text-construct-secondary"
                                }`}>
                                  {gc.code}
                                </span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Cols: Selected Node Details & Connected Activities */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-construct-surface border border-construct-border rounded-xl p-5 shadow-subtle">
            <div className="flex items-center justify-between pb-3 border-b border-construct-border">
              <div>
                <span className="text-[10px] font-mono uppercase text-construct-orange font-bold">
                  {selectedNode?.node_type || "NODE"} ATTRIBUTES
                </span>
                <h3 className="text-lg font-heading font-extrabold text-construct-text mt-0.5">
                  {selectedNode?.name}
                </h3>
              </div>
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-construct-muted text-construct-text border border-construct-border">
                {selectedNode?.code}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4 text-xs font-mono">
              <div className="p-3 rounded-lg bg-construct-bg border border-construct-border/60">
                <span className="text-construct-secondary text-[10px] block">NODE CLASSIFICATION</span>
                <span className="font-bold text-construct-text mt-1 block">{selectedNode?.node_type}</span>
              </div>
              <div className="p-3 rounded-lg bg-construct-bg border border-construct-border/60">
                <span className="text-construct-secondary text-[10px] block">BOUND ACTIVITIES</span>
                <span className="font-bold text-construct-text mt-1 block">{nodeActivities.length} Operations</span>
              </div>
              <div className="p-3 rounded-lg bg-construct-bg border border-construct-border/60">
                <span className="text-construct-secondary text-[10px] block">PARENT IDENTIFIER</span>
                <span className="font-bold text-construct-text mt-1 block">
                  {selectedNode?.parent_id ? nodes.find((n) => n.id === selectedNode.parent_id)?.name : "Root Level"}
                </span>
              </div>
            </div>
          </div>

          {/* Activities Bound to this Hierarchy Node */}
          <div className="bg-construct-surface border border-construct-border rounded-xl p-5 shadow-subtle">
            <div className="flex items-center justify-between pb-3 border-b border-construct-border">
              <h4 className="font-heading font-bold text-sm text-construct-text">
                Activities Operating in {selectedNode?.name}
              </h4>
              <span className="text-xs font-mono text-construct-secondary">
                {nodeActivities.length} assigned
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {nodeActivities.length === 0 ? (
                <div className="py-12 text-center text-xs text-construct-secondary">
                  No construction activities assigned to this zone yet. Use the Schedule module to bind activities here.
                </div>
              ) : (
                nodeActivities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3.5 rounded-lg border border-construct-border bg-construct-bg hover:border-construct-orange/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-construct-text">{act.code}</span>
                        <span className="text-xs font-bold text-construct-text">{act.name}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        act.status === "completed"
                          ? "bg-emerald-100 text-emerald-800"
                          : act.status === "in_progress"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-construct-muted text-construct-secondary"
                      }`}>
                        {act.status.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-xs text-construct-secondary mt-1">{act.description}</p>

                    <div className="mt-3 flex items-center justify-between text-xs font-mono text-construct-secondary pt-2 border-t border-construct-border/60">
                      <span>Target: {act.planned_quantity} {act.unit}</span>
                      <span className="font-bold text-construct-text">Verified: {act.verified_quantity} {act.unit}</span>
                      <span>Timeline: {act.start_date} → {act.planned_finish_date}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Hierarchy Node Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-construct-text/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-construct-surface border border-construct-border rounded-xl shadow-elevated p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-construct-border">
              <h3 className="font-heading font-extrabold text-base text-construct-text">
                Add Site Hierarchy Element
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-construct-secondary hover:text-construct-text">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNode} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-construct-text mb-1">Parent Element</label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg focus:outline-none focus:border-construct-orange text-xs"
                >
                  <option value="">-- No Parent (Top Level Element) --</option>
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.node_type}: {n.name} ({n.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-construct-text mb-1">Element Type *</label>
                  <input
                    type="text"
                    required
                    value={nodeType}
                    onChange={(e) => setNodeType(e.target.value)}
                    placeholder="e.g. Floor, Section, Zone"
                    className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg focus:outline-none focus:border-construct-orange text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-construct-text mb-1">Element Code *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. TOW-A-L02"
                    className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg font-mono focus:outline-none focus:border-construct-orange text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-construct-text mb-1">Element Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Level 02 Residential Typical Floor"
                  className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg focus:outline-none focus:border-construct-orange text-xs"
                />
              </div>

              <div className="pt-3 border-t border-construct-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-construct-border text-construct-secondary hover:bg-construct-muted text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-construct-orange text-white text-xs font-semibold hover:bg-construct-orangeHover shadow-sm"
                >
                  Save Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
