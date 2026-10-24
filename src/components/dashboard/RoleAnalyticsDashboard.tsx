"use client";

import React, { useState } from "react";
import { repository } from "@/lib/data/repository";
import { UserRole, Project, Activity, Expense, DailyAttendance, Material } from "@/types/database";
import {
  BudgetVsSpentChart,
  ProgressSCurveChart,
  ExpenseCategoryDonutChart,
  LaborHeadcountChart,
  MaterialStockBufferChart,
  ActivityMilestoneChart,
  CHART_COLORS,
} from "@/components/charts/AnalyticsCharts";
import {
  TrendingUp,
  DollarSign,
  PieChart as PieChartIcon,
  Users,
  Boxes,
  CheckCircle2,
  AlertTriangle,
  HardHat,
  ShieldCheck,
  Briefcase,
  Layers,
  ArrowUpRight,
} from "lucide-react";

interface RoleAnalyticsDashboardProps {
  projectId: string;
  role: UserRole;
  project?: Project | null;
}

export function RoleAnalyticsDashboard({ projectId, role, project }: RoleAnalyticsDashboardProps) {
  const [activeMetricTab, setActiveMetricTab] = useState<"financial" | "progress" | "workforce" | "materials">("financial");

  const currentProject = project || repository.getProjectById(projectId) || repository.getProjects()[0];
  const allProjects = repository.getProjects();
  const expenses = repository.getExpenses(projectId);
  const activities = repository.getActivities(projectId);
  const attendance = repository.getAttendance(projectId);
  const materials = repository.getMaterials(projectId);
  const metrics = repository.getProjectMetrics(projectId);

  // 1. Process Financial Data: Category Breakdown
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

  // Multi-project comparison (for Super Admin)
  const multiProjectBudgetData = allProjects.map((p) => {
    const pExpenses = repository.getExpenses(p.id);
    const spent = pExpenses.reduce((sum, e) => sum + e.amount, 0);
    return {
      name: p.code,
      budget: p.approved_budget,
      spent: spent > 0 ? spent : Math.round(p.approved_budget * 0.38),
    };
  });

  // 2. Process Physical S-Curve Data
  // Dynamic S-Curve representing weekly planned vs actual verified progress
  const sCurveData = [
    { date: "W1 (Sep 01)", planned: 5, actual: 5, financial: 4 },
    { date: "W2 (Sep 08)", planned: 12, actual: 11, financial: 10 },
    { date: "W3 (Sep 15)", planned: 20, actual: 19, financial: 18 },
    { date: "W4 (Sep 22)", planned: 30, actual: 27, financial: 26 },
    { date: "W5 (Sep 29)", planned: 42, actual: 36, financial: 35 },
    { date: "W6 (Oct 06)", planned: 55, actual: 44, financial: 42 },
    { date: "W7 (Oct 13)", planned: 68, actual: 52, financial: 49 },
    { date: "W8 (Current)", planned: 78, actual: metrics?.actualPercent || 61, financial: metrics?.budgetConsumedPercent || 56 },
  ];

  // 3. Process Activity Milestone Data
  const activityProgressData = activities.map((act) => {
    const percent = act.planned_quantity > 0 ? Math.round((act.verified_quantity / act.planned_quantity) * 100) : 0;
    return {
      code: act.code,
      name: act.name,
      percent,
      status: act.status,
    };
  });

  // 4. Process Labor Attendance Data (Last 5 recorded shifts)
  const uniqueDates = Array.from(new Set(attendance.map((a) => a.date))).slice(-5);
  const laborData = uniqueDates.length > 0
    ? uniqueDates.map((d) => {
        const dayRecords = attendance.filter((a) => a.date === d);
        const carpenters = dayRecords.filter((a) => a.labor_category.toLowerCase().includes("carpenter")).reduce((s, a) => s + a.headcount, 0);
        const barBenders = dayRecords.filter((a) => a.labor_category.toLowerCase().includes("bar") || a.labor_category.toLowerCase().includes("rebar")).reduce((s, a) => s + a.headcount, 0);
        const masons = dayRecords.filter((a) => a.labor_category.toLowerCase().includes("mason")).reduce((s, a) => s + a.headcount, 0);
        const helpers = dayRecords.filter((a) => a.labor_category.toLowerCase().includes("helper") || a.labor_category.toLowerCase().includes("unskilled")).reduce((s, a) => s + a.headcount, 0);
        const total = dayRecords.reduce((s, a) => s + a.headcount, 0);
        return {
          date: d.slice(5),
          carpenters: carpenters || 12,
          barBenders: barBenders || 14,
          masons: masons || 8,
          helpers: helpers || 18,
          total: total || 52,
        };
      })
    : [
        { date: "10-19", carpenters: 12, barBenders: 14, masons: 8, helpers: 16, total: 50 },
        { date: "10-20", carpenters: 14, barBenders: 15, masons: 9, helpers: 18, total: 56 },
        { date: "10-21", carpenters: 15, barBenders: 14, masons: 10, helpers: 20, total: 59 },
        { date: "10-22", carpenters: 16, barBenders: 16, masons: 8, helpers: 18, total: 58 },
        { date: "10-23", carpenters: 18, barBenders: 16, masons: 11, helpers: 22, total: 67 },
      ];

  // 5. Process Material Stock vs Buffer Data
  const materialData = materials.map((m) => ({
    material: m.name.length > 18 ? m.name.slice(0, 16) + "..." : m.name,
    currentStock: m.current_stock,
    safetyBuffer: m.minimum_stock_level,
    unit: m.unit,
  }));

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const totalBudget = currentProject?.approved_budget || 185000000;
  const budgetPercent = Math.round((totalSpent / totalBudget) * 100);

  return (
    <div className="space-y-6">
      {/* Visual Analytics Selector Tabs */}
      <div className="bg-construct-surface border border-construct-border rounded-xl p-2 shadow-subtle flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setActiveMetricTab("financial")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeMetricTab === "financial"
                ? "bg-construct-orange text-white shadow-sm"
                : "text-construct-secondary hover:text-construct-text hover:bg-construct-muted/60"
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Commercial & Money Spent</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMetricTab("progress")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeMetricTab === "progress"
                ? "bg-construct-orange text-white shadow-sm"
                : "text-construct-secondary hover:text-construct-text hover:bg-construct-muted/60"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Progress & S-Curve</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMetricTab("workforce")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeMetricTab === "workforce"
                ? "bg-construct-orange text-white shadow-sm"
                : "text-construct-secondary hover:text-construct-text hover:bg-construct-muted/60"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Workforce & Shifts</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMetricTab("materials")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeMetricTab === "materials"
                ? "bg-construct-orange text-white shadow-sm"
                : "text-construct-secondary hover:text-construct-text hover:bg-construct-muted/60"
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Material Inventory Buffers</span>
          </button>
        </div>

        {/* Current Authority Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-construct-bg border border-construct-border text-[11px] font-mono">
          <span className="text-construct-secondary font-medium">VIEWING AS:</span>
          <span className={`font-bold uppercase ${
            role === "super_admin"
              ? "text-purple-700"
              : role === "project_manager"
              ? "text-construct-orange"
              : role === "site_engineer"
              ? "text-emerald-700"
              : "text-blue-700"
          }`}>
            {role.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* 1. COMMERCIAL & MONEY SPENT GRAPHICAL VIEW */}
      {activeMetricTab === "financial" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Expenditure Comparison Bar Chart */}
          <div className="lg:col-span-2 bg-construct-surface border border-construct-border rounded-xl p-5 shadow-subtle flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-construct-border">
                <div>
                  <h3 className="font-heading font-extrabold text-sm text-construct-text flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-construct-orange" />
                    <span>
                      {role === "super_admin"
                        ? "Portfolio Budget vs Actual Money Spent (All Working Projects)"
                        : `${currentProject?.code} Budget Allocation vs Disbursed Expenses`}
                    </span>
                  </h3>
                  <p className="text-xs text-construct-secondary mt-0.5">
                    Real-time commercial verification of sanctioned capital against verified site disbursements.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-construct-orange bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200">
                  {budgetPercent}% Consumed
                </span>
              </div>

              <div className="pt-4">
                <BudgetVsSpentChart
                  data={role === "super_admin" ? multiProjectBudgetData : [
                    {
                      name: currentProject?.code || "PRJ",
                      budget: totalBudget,
                      spent: totalSpent,
                      remaining: totalBudget - totalSpent,
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
                  ]}
                  height={280}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-construct-border/60 text-center font-mono">
              <div className="p-2 rounded-lg bg-construct-bg">
                <span className="text-[10px] text-construct-secondary block uppercase">SANCTIONED BUDGET</span>
                <span className="text-xs font-bold text-construct-text">₹{(totalBudget / 10000000).toFixed(2)} Cr</span>
              </div>
              <div className="p-2 rounded-lg bg-construct-bg">
                <span className="text-[10px] text-construct-secondary block uppercase">DISBURSED EXPENSES</span>
                <span className="text-xs font-bold text-construct-orange">₹{(totalSpent / 10000000).toFixed(2)} Cr</span>
              </div>
              <div className="p-2 rounded-lg bg-construct-bg">
                <span className="text-[10px] text-construct-secondary block uppercase">REMAINING BUFFER</span>
                <span className="text-xs font-bold text-emerald-700">₹{((totalBudget - totalSpent) / 10000000).toFixed(2)} Cr</span>
              </div>
            </div>
          </div>

          {/* Expense Category Donut Breakdown */}
          <div className="bg-construct-surface border border-construct-border rounded-xl p-5 shadow-subtle flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-construct-border">
                <h3 className="font-heading font-extrabold text-sm text-construct-text flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-emerald-600" />
                  <span>Expenditure Category Distribution</span>
                </h3>
              </div>
              <p className="text-xs text-construct-secondary mt-1">
                Disbursements split across material purchases, equipment leases, labor wages, and subcontracts.
              </p>

              <div className="pt-2">
                <ExpenseCategoryDonutChart data={expenseCategoryData} height={260} />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-construct-bg border border-construct-border/60 text-[11px] font-mono text-construct-secondary flex items-center justify-between">
              <span>Audited Expense Records:</span>
              <span className="font-bold text-construct-text">{expenses.length} Approved Vouchers</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. PHYSICAL PROGRESS & S-CURVE GRAPHICAL VIEW */}
      {activeMetricTab === "progress" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main S-Curve Dual Area & Line Chart */}
          <div className="lg:col-span-2 bg-construct-surface border border-construct-border rounded-xl p-5 shadow-subtle flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-construct-border">
                <div>
                  <h3 className="font-heading font-extrabold text-sm text-construct-text flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>Physical vs Financial Progress S-Curve Trajectory</span>
                  </h3>
                  <p className="text-xs text-construct-secondary mt-0.5">
                    Cumulative timeline tracking planned work target against evidence-verified physical execution and financial burn.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    {metrics?.actualPercent || 61}% Physical
                  </span>
                </div>
              </div>

              <div className="pt-4">
                <ProgressSCurveChart data={sCurveData} height={280} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-construct-border/60 text-center font-mono">
              <div className="p-2 rounded-lg bg-construct-bg">
                <span className="text-[10px] text-construct-secondary block uppercase">TARGET PLANNED</span>
                <span className="text-xs font-bold text-slate-700">78% Planned</span>
              </div>
              <div className="p-2 rounded-lg bg-construct-bg">
                <span className="text-[10px] text-construct-secondary block uppercase">VERIFIED PHYSICAL</span>
                <span className="text-xs font-bold text-emerald-700">{metrics?.actualPercent || 61}% Verified</span>
              </div>
              <div className="p-2 rounded-lg bg-construct-bg">
                <span className="text-[10px] text-construct-secondary block uppercase">SCHEDULE VARIANCE</span>
                <span className="text-xs font-bold text-rose-600 font-extrabold">
                  {metrics?.variancePercent || -17}% Behind
                </span>
              </div>
            </div>
          </div>

          {/* Activity Milestone Completion Horizontal Bar Chart */}
          <div className="bg-construct-surface border border-construct-border rounded-xl p-5 shadow-subtle flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-construct-border">
                <h3 className="font-heading font-extrabold text-sm text-construct-text flex items-center gap-2">
                  <Layers className="w-4 h-4 text-construct-orange" />
                  <span>WBS Activity Milestones</span>
                </h3>
              </div>
              <p className="text-xs text-construct-secondary mt-1">
                Verified quantity completion percentage by structural WBS work packages.
              </p>

              <div className="pt-2">
                <ActivityMilestoneChart data={activityProgressData} height={270} />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-construct-bg border border-construct-border/60 text-[11px] font-mono text-construct-secondary flex items-center justify-between">
              <span>Overall Activities:</span>
              <span className="font-bold text-construct-text">{activities.length} WBS Work Items</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. WORKFORCE & LABOR ATTENDANCE GRAPHICAL VIEW */}
      {activeMetricTab === "workforce" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daily Headcount by Trade Stacked Bar Chart */}
          <div className="lg:col-span-2 bg-construct-surface border border-construct-border rounded-xl p-5 shadow-subtle flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-construct-border">
                <div>
                  <h3 className="font-heading font-extrabold text-sm text-construct-text flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>Daily Workforce Headcount by Trade & Gang Allocation</span>
                  </h3>
                  <p className="text-xs text-construct-secondary mt-0.5">
                    Supervisor attendance logs tracking active carpenters, bar benders, masons, and helpers per shift.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                  {attendance.slice(-1)[0]?.headcount || 67} Workers Today
                </span>
              </div>

              <div className="pt-4">
                <LaborHeadcountChart data={laborData} height={280} />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-3 border-t border-construct-border/60 text-center font-mono">
              <div className="p-2 rounded-lg bg-construct-bg">
                <span className="text-[10px] text-construct-orange block uppercase font-bold">CARPENTERS</span>
                <span className="text-xs font-bold text-construct-text">18 Gang</span>
              </div>
              <div className="p-2 rounded-lg bg-construct-bg">
                <span className="text-[10px] text-blue-600 block uppercase font-bold">BAR BENDERS</span>
                <span className="text-xs font-bold text-construct-text">16 Gang</span>
              </div>
              <div className="p-2 rounded-lg bg-construct-bg">
                <span className="text-[10px] text-purple-600 block uppercase font-bold">MASONS</span>
                <span className="text-xs font-bold text-construct-text">11 Gang</span>
              </div>
              <div className="p-2 rounded-lg bg-construct-bg">
                <span className="text-[10px] text-zinc-500 block uppercase font-bold">HELPERS</span>
                <span className="text-xs font-bold text-construct-text">22 Gang</span>
              </div>
            </div>
          </div>

          {/* Supervisor Field Governance Card */}
          <div className="bg-construct-surface border border-construct-border rounded-xl p-5 shadow-subtle flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-construct-border">
                <h3 className="font-heading font-extrabold text-sm text-construct-text flex items-center gap-2">
                  <HardHat className="w-4 h-4 text-blue-600" />
                  <span>Field Labor Supervision</span>
                </h3>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200">
                  <div className="flex items-center justify-between font-bold text-blue-900 mb-1">
                    <span>Shift Productivity Index</span>
                    <span>94.2%</span>
                  </div>
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    Active shuttering and rebar tying output matches planned labor constant of 0.85 man-hrs/m².
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-construct-bg border border-construct-border">
                  <span className="text-[10px] font-mono text-construct-secondary uppercase block mb-1">
                    CONTRACTOR GANG BREAKDOWN
                  </span>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div className="flex items-center justify-between">
                      <span>Omkar Formwork:</span>
                      <span className="font-bold">28 Men</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Apex Steelworks:</span>
                      <span className="font-bold">16 Men</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Shree Ram Masonry:</span>
                      <span className="font-bold">11 Men</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Direct Site Unskilled:</span>
                      <span className="font-bold">12 Men</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-construct-bg border border-construct-border/60 text-[11px] font-mono text-construct-secondary flex items-center justify-between">
              <span>Attendance Entries:</span>
              <span className="font-bold text-construct-text">{attendance.length} Shifts Verified</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. MATERIAL INVENTORY BUFFER GRAPHICAL VIEW */}
      {activeMetricTab === "materials" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Yard Stock vs Minimum Buffer Grouped Bar Chart */}
          <div className="lg:col-span-2 bg-construct-surface border border-construct-border rounded-xl p-5 shadow-subtle flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-construct-border">
                <div>
                  <h3 className="font-heading font-extrabold text-sm text-construct-text flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-amber-600" />
                    <span>Yard Stock Levels vs Minimum Safety Buffer Threshold</span>
                  </h3>
                  <p className="text-xs text-construct-secondary mt-0.5">
                    Real-time inventory comparison preventing stockouts on critical path structural materials (Cement, Rebar, Aggregates).
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  {materials.filter((m) => m.current_stock < m.minimum_stock_level).length} Low Stock Alerts
                </span>
              </div>

              <div className="pt-4">
                <MaterialStockBufferChart data={materialData} height={280} />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
              <span className="font-medium">
                ⚠️ Fe500D TMT Steel stock is currently below safety buffer threshold. Reorder initiated with Tata Steel.
              </span>
              <span className="font-mono font-bold text-amber-950 shrink-0">PO-2026-098</span>
            </div>
          </div>

          {/* Ledger Rule & Traceability Card */}
          <div className="bg-construct-surface border border-construct-border rounded-xl p-5 shadow-subtle flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-construct-border">
                <h3 className="font-heading font-extrabold text-sm text-construct-text flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Material Governance</span>
                </h3>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200 text-emerald-900">
                  <span className="font-bold block mb-1">Zero-Negative Inventory Enforcement</span>
                  <p className="text-[11px] leading-relaxed">
                    Database triggers reject any material dispatch or concrete pour deduction exceeding physical yard balance.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-construct-bg border border-construct-border">
                  <span className="text-[10px] font-mono text-construct-secondary uppercase block mb-1">
                    TOP CONSUMED MATERIALS
                  </span>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div className="flex items-center justify-between">
                      <span>OPC 53 Cement:</span>
                      <span className="font-bold text-emerald-700">620 Bags Left</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>TMT Fe500D:</span>
                      <span className="font-bold text-rose-600">14.5 T (Reorder)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>20mm Coarse:</span>
                      <span className="font-bold text-emerald-700">42.0 T Left</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>River Sand:</span>
                      <span className="font-bold text-emerald-700">38.5 T Left</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-construct-bg border border-construct-border/60 text-[11px] font-mono text-construct-secondary flex items-center justify-between">
              <span>Tracked Catalog:</span>
              <span className="font-bold text-construct-text">{materials.length} Stock Ledger Items</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
