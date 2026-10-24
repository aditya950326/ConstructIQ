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

  // Form State
  const [category, setCategory] = useState<any>("Materials");
  const [expenseDate, setExpenseDate] = useState("2026-10-23");
  const [amount, setAmount] = useState(250000);
  const [payee, setPayee] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = () => {
    setProject(repository.getProjectById(projectId) || null);
    setExpenses(repository.getExpenses(projectId));
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

      {/* Expenses Breakdown Table */}
      <div className="bg-construct-surface border border-construct-border rounded-xl shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-construct-border flex items-center justify-between">
          <h3 className="font-heading font-bold text-sm text-construct-text">
            Commercial Expense Disbursements Ledger
          </h3>
          <span className="text-xs font-mono text-construct-secondary">
            {expenses.length} Approved Vouchers
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
                <th className="py-3 px-4">DISBURSED AMOUNT</th>
                <th className="py-3 px-4">STATUS</th>
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
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                      APPROVED
                    </span>
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
              <button onClick={() => setIsAddModalOpen(false)} className="text-construct-secondary hover:text-construct-text">
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
                  />
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
                  className="px-4 py-2 rounded-lg border border-construct-border text-construct-secondary hover:bg-construct-muted text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-construct-orange text-white text-xs font-semibold hover:bg-construct-orangeHover shadow-sm"
                >
                  Disburse & Authorize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
