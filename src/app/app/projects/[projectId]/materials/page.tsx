"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { repository } from "@/lib/data/repository";
import { Material, StockMovement, Activity } from "@/types/database";
import {
  Boxes,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  Package,
  Layers,
  History,
  AlertCircle,
  X,
  CheckCircle2,
} from "lucide-react";

export default function MaterialsPage() {
  const params = useParams();
  const projectId = (params?.projectId as string) || "b0000000-0000-0000-0000-000000000001";

  const [materials, setMaterials] = useState<Material[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Movement Form State
  const [materialId, setMaterialId] = useState("");
  const [movementType, setMovementType] = useState<any>("issue");
  const [quantity, setQuantity] = useState(10);
  const [activityId, setActivityId] = useState("");
  const [referenceNo, setReferenceNo] = useState("ISS-003");
  const [notes, setNotes] = useState("Issued for column casting reinforcement");

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = () => {
    const mats = repository.getMaterials(projectId);
    setMaterials(mats);
    if (mats.length > 0 && !materialId) setMaterialId(mats[0].id);
    setMovements(repository.getStockMovements(projectId));
    const acts = repository.getActivities(projectId);
    setActivities(acts);
    if (acts.length > 0 && !activityId) setActivityId(acts[0].id);
  };

  const handleRecordMovement = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const targetMat = materials.find((m) => m.id === materialId);
    if (!targetMat) return;

    const user = repository.getCurrentUser();
    const result = repository.recordStockMovement({
      project_id: projectId,
      material_id: materialId,
      activity_id: activityId,
      movement_type: movementType,
      quantity: Number(quantity),
      unit_cost: targetMat.unit_cost,
      reference_no: referenceNo,
      notes,
      performed_by: user.id,
    });

    if (result.error) {
      setErrorMessage(result.error);
      return;
    }

    loadData();
    setIsMovementModalOpen(false);
  };

  const totalStockValuation = materials.reduce(
    (sum, m) => sum + m.current_stock * m.unit_cost,
    0
  );
  const lowStockCount = materials.filter((m) => m.current_stock < m.minimum_stock_level).length;

  return (
    <AppShell
      title="Materials & Inventory Ledger"
      subtitle="Stock Movements, Non-Negative Audits & Buffer Depletion Alerts"
      activeProjectId={projectId}
      headerActions={
        <button
          onClick={() => {
            setErrorMessage("");
            setIsMovementModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-construct-orange text-white text-xs font-semibold hover:bg-construct-orangeHover shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Record Stock Movement</span>
        </button>
      }
    >
      {/* Inventory KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl border border-construct-border bg-construct-surface shadow-subtle">
          <span className="text-xs font-mono text-construct-secondary block">TOTAL ON-SITE INVENTORY VALUE</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-heading font-extrabold text-construct-text">
              ₹{(totalStockValuation / 100000).toFixed(1)} Lakhs
            </span>
          </div>
          <p className="text-xs text-construct-secondary mt-2">
            Across {materials.length} tracked materials and aggregates.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-construct-border bg-construct-surface shadow-subtle">
          <span className="text-xs font-mono text-construct-secondary block">BUFFER SHORTAGE ALERTS</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-heading font-extrabold ${lowStockCount > 0 ? "text-construct-orange" : "text-emerald-700"}`}>
              {lowStockCount}
            </span>
            <span className="text-xs font-mono text-construct-secondary">
              materials below safety stock
            </span>
          </div>
          <p className="text-xs text-construct-secondary mt-2">
            {lowStockCount > 0 ? "Shortages immediately trigger schedule risk engine." : "All buffer thresholds satisfied."}
          </p>
        </div>

        <div className="p-5 rounded-xl border border-construct-border bg-construct-surface shadow-subtle">
          <span className="text-xs font-mono text-construct-secondary block">STOCK INTEGRITY STATUS</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-heading font-extrabold text-emerald-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Non-Negative Ledger
            </span>
          </div>
          <p className="text-xs text-construct-secondary mt-2">
            Database transactions enforce that issues cannot exceed available balance.
          </p>
        </div>
      </div>

      {/* Materials Catalogue Table */}
      <div className="bg-construct-surface border border-construct-border rounded-xl shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-construct-border flex items-center justify-between">
          <h3 className="font-heading font-bold text-sm text-construct-text">
            Site Material Catalogue & Real-Time Balances
          </h3>
          <span className="text-xs font-mono text-construct-secondary">
            Continuous Ledger Reconciliation
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-construct-border bg-construct-bg text-[11px] font-mono font-bold text-construct-secondary">
                <th className="py-3 px-4">CODE</th>
                <th className="py-3 px-4">MATERIAL NAME</th>
                <th className="py-3 px-4">CATEGORY</th>
                <th className="py-3 px-4">CURRENT BALANCE</th>
                <th className="py-3 px-4">MIN BUFFER</th>
                <th className="py-3 px-4">UNIT COST</th>
                <th className="py-3 px-4">TOTAL VALUATION</th>
                <th className="py-3 px-4">SUPPLIER</th>
                <th className="py-3 px-4">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-construct-border/60">
              {materials.map((mat) => {
                const isShortage = mat.current_stock < mat.minimum_stock_level;
                const totalValue = mat.current_stock * mat.unit_cost;
                return (
                  <tr key={mat.id} className="hover:bg-construct-muted/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-construct-orange">{mat.code}</td>
                    <td className="py-3 px-4 font-semibold text-construct-text">{mat.name}</td>
                    <td className="py-3 px-4 font-mono text-construct-secondary">{mat.category}</td>
                    <td className="py-3 px-4 font-mono font-bold">
                      <span className={isShortage ? "text-construct-orange" : "text-construct-text"}>
                        {mat.current_stock} {mat.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-construct-secondary">
                      {mat.minimum_stock_level} {mat.unit}
                    </td>
                    <td className="py-3 px-4 font-mono text-construct-secondary">
                      ₹{mat.unit_cost.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-construct-text">
                      ₹{(totalValue / 100000).toFixed(2)} L
                    </td>
                    <td className="py-3 px-4 text-construct-secondary">{mat.supplier_name || "Primary Vendor"}</td>
                    <td className="py-3 px-4">
                      {isShortage ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-100 text-construct-orange border border-orange-200 flex items-center gap-1 w-fit">
                          <AlertTriangle className="w-3 h-3" /> LOW STOCK
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                          NORMAL
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Movement Audit Log */}
      <div className="bg-construct-surface border border-construct-border rounded-xl shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-construct-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-construct-orange" />
            <h3 className="font-heading font-bold text-sm text-construct-text">
              Material Movement Ledger (Inward Receipts & Activity Issues)
            </h3>
          </div>
          <span className="text-xs font-mono text-construct-secondary">
            {movements.length} Transactions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-construct-border bg-construct-bg text-[11px] font-mono font-bold text-construct-secondary">
                <th className="py-3 px-4">REF NO</th>
                <th className="py-3 px-4">DATE & TIME</th>
                <th className="py-3 px-4">TYPE</th>
                <th className="py-3 px-4">MATERIAL</th>
                <th className="py-3 px-4">QUANTITY</th>
                <th className="py-3 px-4">LINKED ACTIVITY</th>
                <th className="py-3 px-4">REMARKS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-construct-border/60">
              {movements.map((mov) => {
                const mat = materials.find((m) => m.id === mov.material_id);
                const act = activities.find((a) => a.id === mov.activity_id);
                const isReceipt = mov.quantity > 0;
                return (
                  <tr key={mov.id} className="hover:bg-construct-muted/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-construct-text">{mov.reference_no}</td>
                    <td className="py-3 px-4 font-mono text-construct-secondary">
                      {new Date(mov.created_at).toLocaleDateString()} {new Date(mov.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase flex items-center gap-1 w-fit ${
                        isReceipt ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                      }`}>
                        {isReceipt ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        {mov.movement_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-construct-text">{mat?.name || "Material"}</td>
                    <td className="py-3 px-4 font-mono font-bold">
                      <span className={isReceipt ? "text-emerald-700" : "text-construct-text"}>
                        {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity} {mat?.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-construct-secondary">
                      {act ? `${act.code}: ${act.name}` : "General Storage Yard"}
                    </td>
                    <td className="py-3 px-4 text-construct-secondary">{mov.notes || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Stock Movement Modal */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-construct-text/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-construct-surface border border-construct-border rounded-xl shadow-elevated p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-construct-border">
              <h3 className="font-heading font-extrabold text-base text-construct-text">
                Record Stock Movement
              </h3>
              <button onClick={() => setIsMovementModalOpen(false)} className="text-construct-secondary hover:text-construct-text">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleRecordMovement} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-construct-text mb-1">Transaction Type *</label>
                  <select
                    value={movementType}
                    onChange={(e) => setMovementType(e.target.value)}
                    className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg focus:outline-none focus:border-construct-orange text-xs"
                  >
                    <option value="issue">Issue to Activity (Deduct)</option>
                    <option value="receipt">Goods Inward Receipt (Add)</option>
                    <option value="wastage">Site Wastage Record (Deduct)</option>
                    <option value="return">Return to Store (Add)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-construct-text mb-1">Reference No *</label>
                  <input
                    type="text"
                    required
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    placeholder="e.g. ISS-004 or PO-2026-101"
                    className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg font-mono focus:outline-none focus:border-construct-orange text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-construct-text mb-1">Select Material *</label>
                <select
                  value={materialId}
                  onChange={(e) => setMaterialId(e.target.value)}
                  className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg focus:outline-none focus:border-construct-orange text-xs"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.code}: {m.name} (Stock: {m.current_stock} {m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-construct-text mb-1">Quantity *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg font-mono focus:outline-none focus:border-construct-orange text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-construct-text mb-1">Target Activity</label>
                  <select
                    value={activityId}
                    onChange={(e) => setActivityId(e.target.value)}
                    className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg focus:outline-none focus:border-construct-orange text-xs"
                  >
                    <option value="">-- General / Non-Activity --</option>
                    {activities.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code}: {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-construct-text mb-1">Transaction Notes & Dispatch Details</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Issued for casting Columns C1 to C4"
                  className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg focus:outline-none focus:border-construct-orange text-xs"
                />
              </div>

              <div className="pt-3 border-t border-construct-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-construct-border text-construct-secondary hover:bg-construct-muted text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-construct-orange text-white text-xs font-semibold hover:bg-construct-orangeHover shadow-sm"
                >
                  Post Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
