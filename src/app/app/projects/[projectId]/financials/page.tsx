"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { repository } from "@/lib/data/repository";
import { Expense, Project } from "@/types/database";
import {
  DollarSign,
  Plus,
  TrendingDown,
  PieChart,
  CheckCircle2,
  Clock,
  X,
  Building2,
  BarChart3,
  Check,
  HardHat,
  Briefcase,
  FileText,
  AlertCircle,
  Eye,
} from "lucide-react";
import {
  BudgetVsSpentChart,
  ExpenseCategoryDonutChart,
} from "@/components/charts/AnalyticsCharts";

export default function FinancialsPage() {
  const params = useParams();
  const projectId = (params?.projectId as string) || "b0000000-0000-0000-0000-000000000001";

  const [project, setProject] = useState<Project | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentRole, setCurrentRole] = useState<any>("site_engineer");

  const [rejectingItem, setRejectingItem] = useState<{ id: string; title: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);

  // Form State
  const [category, setCategory] = useState<any>("Materials");
  const [expenseDate, setExpenseDate] = useState("2026-10-23");
  const [amount, setAmount] = useState(250000);
  const [payee, setPayee] = useState("");
  const [description, setDescription] = useState("");

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
    setProject(repository.getProjectById(projectId) || null);
    setExpenses(repository.getExpenses(projectId));
  };

  const handleApproveBill = (bill: Expense) => {
    if (currentRole === "site_engineer") {
      repository.approveExpenseByEngineer(
        bill.id,
        currentUser?.id,
        `Voucher and materials physically checked on site by Site Engineer ${currentUser?.full_name || ""}`
      );
    } else {
      repository.approveExpenseByManager(
        bill.id,
        currentUser?.id,
        `Commercial payment disbursement authorized by Project Manager ${currentUser?.full_name || ""}`
      );
    }
    loadData();
  };

  const handleConfirmReject = () => {
    if (!rejectingItem) return;
    repository.rejectExpense(rejectingItem.id, currentUser?.id, rejectReason || "Rejected during commercial review");
    setRejectingItem(null);
    setRejectReason("");
    loadData();
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payee || !amount) return;

    repository.addExpense({
      project_id: projectId,
      category,
      expense_date: expenseDate,
      amount: Number(amount),
      currency: "INR",
      payee,
      description,
      status: "approved",
    });

    loadData();
    setIsAddModalOpen(false);
    setPayee("");
    setDescription("");
  };

  const totalBudget = project?.approved_budget || 185000000;
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const budgetUtilization = Math.round((totalSpent / totalBudget) * 100);

  // Group expenses by category for Donut chart
  const categoryMap: { [cat: string]: number } = {};
  expenses.forEach((e) => {
    categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
  });
  const expenseCategoryData = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value,
  }));
  if (expenseCategoryData.length === 0) {
    expenseCategoryData.push(
      { name: "Materials", value: 3850000 },
      { name: "Equipment Lease", value: 1250000 },
      { name: "Labor Wages", value: 1800000 },
      { name: "Subcontractor", value: 2450000 },
      { name: "Permits & Safety", value: 450000 }
    );
  }

  const budgetComparisonData = [
    {
      name: project?.code || "Overall",
      budget: totalBudget,
      spent: totalSpent,
    },
    {
      name: "Civil / Structure",
      budget: Math.round(totalBudget * 0.55),
      spent: Math.round(totalSpent * 0.65),
    },
    {
      name: "Finishes / MEP",
      budget: Math.round(totalBudget * 0.30),
      spent: Math.round(totalSpent * 0.25),
    },
    {
      name: "Site Ops & Fuel",
      budget: Math.round(totalBudget * 0.15),
      spent: Math.round(totalSpent * 0.10),
    },
  ];

  return (
    <AppShell
      title="Financials & Budget Burn-Down"
      subtitle="Project Expenditure, Cost Tracking & Commercial Governance"
      activeProjectId={projectId}
      headerActions={
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-construct-orange text-white text-xs font-semibold hover:bg-construct-orangeHover shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Record Expense</span>
        </button>
      }
    >
      {/* Financial Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl border border-construct-border bg-construct-surface shadow-subtle">
          <span className="text-xs font-mono text-construct-secondary block">APPROVED BASELINE BUDGET</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-heading font-extrabold text-construct-text">
              ₹{(totalBudget / 10000000).toFixed(2)} Cr
            </span>
          </div>
          <p className="text-xs text-construct-secondary mt-2">
            Sanctioned contract commercial allocation.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-construct-border bg-construct-surface shadow-subtle">
          <span className="text-xs font-mono text-construct-secondary block">COMMITTED & APPROVED EXPENSES</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-heading font-extrabold text-construct-orange">
              ₹{(totalSpent / 10000000).toFixed(2)} Cr
            </span>
            <span className="text-xs font-mono text-construct-secondary">
              ({budgetUtilization}%)
            </span>
          </div>
          <div className="w-full bg-construct-border h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-construct-orange h-full rounded-full transition-all duration-300"
              style={{ width: `${budgetUtilization}%` }}
            />
          </div>
        </div>

        <div className="p-5 rounded-xl border border-construct-border bg-construct-surface shadow-subtle">
          <span className="text-xs font-mono text-construct-secondary block">REMAINING CASH BUFFER</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-heading font-extrabold text-emerald-700">
              ₹{((totalBudget - totalSpent) / 10000000).toFixed(2)} Cr
            </span>
          </div>
          <p className="text-xs text-emerald-700 mt-2 font-medium">
            Cashflow within approved risk tolerance.
          </p>
        </div>
      </div>

      {/* Graphical Commercial Analytics Suite */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-construct-surface border border-construct-border rounded-xl p-5 shadow-subtle">
          <div className="flex items-center justify-between pb-3 border-b border-construct-border mb-4">
            <div>
              <h3 className="font-heading font-extrabold text-sm text-construct-text flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-construct-orange" />
                <span>Commercial Budget Allocation vs Disbursed Spend</span>
              </h3>
              <p className="text-xs text-construct-secondary mt-0.5">
                Breakdown of allocated funds against verified expenses by major trade category.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-construct-orange bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200">
              {budgetUtilization}% Spent
            </span>
          </div>
          <BudgetVsSpentChart data={budgetComparisonData} height={270} />
        </div>

        <div className="bg-construct-surface border border-construct-border rounded-xl p-5 shadow-subtle">
          <div className="flex items-center justify-between pb-3 border-b border-construct-border mb-4">
            <h3 className="font-heading font-extrabold text-sm text-construct-text flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-600" />
              <span>Spend by Category</span>
            </h3>
          </div>
          <p className="text-xs text-construct-secondary mb-2">
            Disbursements distribution across trade classifications.
          </p>
          <ExpenseCategoryDonutChart data={expenseCategoryData} height={250} />
        </div>
      </div>

      {/* PENDING BILLS APPROVAL SECTION */}
      {(() => {
        const pendingBills = expenses.filter((e) => {
          if (currentRole === "site_engineer") return e.status === "pending_engineer";
          if (currentRole === "project_manager") return e.status === "pending_manager";
          return e.status === "pending_engineer" || e.status === "pending_manager";
        });

        if (pendingBills.length === 0) return null;

        return (
          <div className="bg-construct-surface border-2 border-construct-orange/40 rounded-xl shadow-subtle overflow-hidden animate-in fade-in">
            <div className="p-4 border-b border-construct-border bg-orange-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-lg ${currentRole === "site_engineer" ? "bg-emerald-100 text-emerald-800" : "bg-orange-100 text-construct-orange"}`}>
                  {currentRole === "site_engineer" ? <HardHat className="w-5 h-5" /> : <Briefcase className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-sm text-construct-text">
                    {currentRole === "site_engineer"
                      ? `Supervisor Site Bills Awaiting Site Engineer Review (${pendingBills.length})`
                      : `Engineer-Approved Site Bills Awaiting PM Authorization (${pendingBills.length})`}
                  </h3>
                  <p className="text-xs text-construct-secondary">
                    {currentRole === "site_engineer"
                      ? "Vouchers and bills uploaded by site supervisor. Physically inspect and approve to forward to the Project Manager."
                      : "Site Engineer Kalyani Jadhav has inspected and verified these bills. Click physical Authorize & Disburse button to release funds."}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-construct-orange text-white">
                Action Required
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-construct-border bg-construct-bg text-[11px] font-mono font-bold text-construct-secondary">
                    <th className="py-3 px-4">DATE</th>
                    <th className="py-3 px-4">CATEGORY</th>
                    <th className="py-3 px-4">PAYEE / VENDOR</th>
                    <th className="py-3 px-4">PURPOSE & DESCRIPTION</th>
                    <th className="py-3 px-4">AMOUNT</th>
                    <th className="py-3 px-4">VOUCHER</th>
                    <th className="py-3 px-4">GOVERNANCE</th>
                    <th className="py-3 px-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-construct-border/60">
                  {pendingBills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-construct-muted/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-construct-secondary">{bill.expense_date}</td>
                      <td className="py-3 px-4 font-mono font-bold text-construct-orange">{bill.category}</td>
                      <td className="py-3 px-4 font-semibold text-construct-text">{bill.payee}</td>
                      <td className="py-3 px-4 text-construct-secondary">{bill.description}</td>
                      <td className="py-3 px-4 font-mono font-bold text-construct-text text-sm">
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
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          bill.status === "pending_manager" ? "bg-blue-100 text-blue-800 border border-blue-200" : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}>
                          {bill.status === "pending_manager" ? "STAGE 2: AWAITING PM" : "STAGE 1: AWAITING ENG"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setRejectingItem({ id: bill.id, title: `${bill.payee} (₹${bill.amount})` })}
                            className="px-2.5 py-1.5 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApproveBill(bill)}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>
                              {currentRole === "site_engineer" ? "Approve Bill (Site Engineer)" : "Authorize & Disburse (PM)"}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* Expenses Breakdown Table */}
      <div className="bg-construct-surface border border-construct-border rounded-xl shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-construct-border flex items-center justify-between">
          <h3 className="font-heading font-bold text-sm text-construct-text">
            Commercial Expense Disbursements Ledger
          </h3>
          <span className="text-xs font-mono text-construct-secondary">
            {expenses.length} Total Vouchers in Scope
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-construct-border bg-construct-bg text-[11px] font-mono font-bold text-construct-secondary">
                <th className="py-3 px-4">DATE</th>
                <th className="py-3 px-4">CATEGORY</th>
                <th className="py-3 px-4">PAYEE / VENDOR</th>
                <th className="py-3 px-4">PURPOSE & DESCRIPTION</th>
                <th className="py-3 px-4">AMOUNT</th>
                <th className="py-3 px-4">VOUCHER</th>
                <th className="py-3 px-4">GOVERNANCE STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-construct-border/60">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-construct-muted/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-construct-secondary">{exp.expense_date}</td>
                  <td className="py-3 px-4 font-mono font-bold text-construct-orange">{exp.category}</td>
                  <td className="py-3 px-4 font-semibold text-construct-text">{exp.payee}</td>
                  <td className="py-3 px-4 text-construct-secondary">{exp.description}</td>
                  <td className="py-3 px-4 font-mono font-bold text-construct-text">
                    ₹{exp.amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    {exp.receipt_url ? (
                      <button
                        type="button"
                        onClick={() => setPreviewReceiptUrl(exp.receipt_url!)}
                        className="inline-flex items-center gap-1 text-purple-700 font-bold hover:underline cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Voucher</span>
                      </button>
                    ) : (
                      <span className="text-construct-secondary font-mono text-[11px]">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {exp.status === "approved" ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                        APPROVED
                      </span>
                    ) : exp.status === "pending_manager" ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800">
                        AWAITING PM
                      </span>
                    ) : exp.status === "pending_engineer" ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800">
                        AWAITING SITE ENG
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-800">
                        {exp.status.toUpperCase()}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-construct-text/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-construct-surface border border-construct-border rounded-xl shadow-elevated p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-construct-border">
              <h3 className="font-heading font-extrabold text-base text-construct-text">
                Record Commercial Expense Disbursement
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-construct-secondary hover:text-construct-text cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-construct-text mb-1">Expense Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg focus:outline-none focus:border-construct-orange text-xs"
                  >
                    <option value="Materials">Materials & Aggregates</option>
                    <option value="Labor">Site Labor & Gangs</option>
                    <option value="Equipment">Heavy Plant & Machinery</option>
                    <option value="Subcontractor">Specialist Subcontractor</option>
                    <option value="Permits & Safety">Permits, Testing & Safety</option>
                    <option value="Overhead">Overheads & Site Office</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-construct-text mb-1">Disbursement Date</label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg font-mono focus:outline-none focus:border-construct-orange text-xs"
                  >
                  </input>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-construct-text mb-1">Amount (INR) *</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg font-mono focus:outline-none focus:border-construct-orange text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-construct-text mb-1">Vendor / Payee *</label>
                  <input
                    type="text"
                    required
                    value={payee}
                    onChange={(e) => setPayee(e.target.value)}
                    placeholder="e.g. Tata Steel Ltd"
                    className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg focus:outline-none focus:border-construct-orange text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-construct-text mb-1">Description & Purpose</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Consignment invoice for Fe500D rebar delivery..."
                  className="w-full p-2 border border-construct-border rounded-lg bg-construct-bg focus:outline-none focus:border-construct-orange text-xs"
                />
              </div>

              <div className="pt-3 border-t border-construct-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-construct-border text-construct-secondary hover:bg-construct-muted text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-construct-orange text-white text-xs font-semibold hover:bg-construct-orangeHover shadow-sm cursor-pointer"
                >
                  Disburse & Authorize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rejection Note Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-construct-surface border border-construct-border rounded-xl shadow-elevated p-5 space-y-4">
            <h3 className="font-heading font-bold text-sm text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>Return / Reject Site Bill</span>
            </h3>
            <p className="text-xs text-construct-text">
              Bill: <strong>{rejectingItem.title}</strong>
            </p>
            <div>
              <label className="block text-xs font-bold text-construct-text mb-1">
                Reason for Rejection / Return Note *
              </label>
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Rate per liter does not match contract rate, please revise..."
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

      {/* Voucher Preview Modal */}
      {previewReceiptUrl && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-construct-surface border border-construct-border rounded-xl shadow-elevated p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-construct-border">
              <h3 className="font-heading font-bold text-sm text-construct-text">Voucher & Receipt Document</h3>
              <button onClick={() => setPreviewReceiptUrl(null)} className="text-construct-secondary hover:text-construct-text cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-lg overflow-hidden bg-black flex items-center justify-center max-h-96">
              <img src={previewReceiptUrl} alt="Receipt" className="max-h-96 w-auto object-contain" />
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPreviewReceiptUrl(null)}
                className="px-4 py-1.5 rounded-lg bg-construct-text text-white text-xs font-bold cursor-pointer"
              >
                Close Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
