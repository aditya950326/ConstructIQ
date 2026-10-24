"use client";

import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

// Modern palette tailored for ConstructIQ
export const CHART_COLORS = {
  orange: "#F36B32",
  charcoal: "#202321",
  emerald: "#10b981",
  blue: "#3b82f6",
  purple: "#8b5cf6",
  amber: "#f59e0b",
  rose: "#ef4444",
  cyan: "#06b6d4",
  slate: "#64748b",
};

const PIE_PALETTE = [
  "#F36B32",
  "#3b82f6",
  "#10b981",
  "#8b5cf6",
  "#f59e0b",
  "#06b6d4",
  "#64748b",
];

// Custom Tooltip component for sleek dark floating stats
export function CustomChartTooltip({ active, payload, label, formatter }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900/95 border border-zinc-700/80 p-3 rounded-xl shadow-xl text-xs backdrop-blur-md z-50">
        <p className="font-mono font-bold text-zinc-200 mb-1.5 pb-1 border-b border-zinc-800">
          {label}
        </p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => {
            const formattedVal = formatter ? formatter(entry.value, entry.name) : entry.value;
            return (
              <div key={`tip-${index}`} className="flex items-center justify-between gap-4 font-mono">
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: entry.color || entry.fill }}
                  />
                  <span>{entry.name}:</span>
                </span>
                <span className="font-bold text-white">{formattedVal}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
}

// 1. Budget vs Actual Money Spent (Grouped Bar Chart)
interface BudgetVsSpentProps {
  data: {
    name: string;
    budget: number;
    spent: number;
    remaining?: number;
  }[];
  height?: number;
}

export function BudgetVsSpentChart({ data, height = 300 }: BudgetVsSpentProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div style={{ height }} className="w-full bg-construct-muted/40 rounded-xl animate-pulse" />;
  }

  const formatINR = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
    return `₹${val.toLocaleString()}`;
  };

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
          <XAxis
            dataKey="name"
            tick={{ fill: "#64748b", fontSize: 11, fontFamily: "monospace" }}
            tickLine={false}
            axisLine={{ stroke: "#cbd5e1" }}
          />
          <YAxis
            tickFormatter={formatINR}
            tick={{ fill: "#64748b", fontSize: 10, fontFamily: "monospace" }}
            tickLine={false}
            axisLine={{ stroke: "#cbd5e1" }}
            width={75}
          />
          <Tooltip content={<CustomChartTooltip formatter={formatINR} />} />
          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ paddingBottom: 10, fontSize: 12, fontFamily: "monospace" }}
          />
          <Bar dataKey="budget" name="Approved Budget" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
          <Bar dataKey="spent" name="Actual Money Spent" fill="#F36B32" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// 2. Physical vs Financial Progress S-Curve (Dual Area / Line Chart)
interface SCurveProps {
  data: {
    date: string;
    planned: number;
    actual: number;
    financial?: number;
  }[];
  height?: number;
}

export function ProgressSCurveChart({ data, height = 300 }: SCurveProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div style={{ height }} className="w-full bg-construct-muted/40 rounded-xl animate-pulse" />;
  }

  const formatPercent = (val: number) => `${val}%`;

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
          <defs>
            <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="plannedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#64748b", fontSize: 11, fontFamily: "monospace" }}
            tickLine={false}
            axisLine={{ stroke: "#cbd5e1" }}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={formatPercent}
            tick={{ fill: "#64748b", fontSize: 10, fontFamily: "monospace" }}
            tickLine={false}
            axisLine={{ stroke: "#cbd5e1" }}
            width={45}
          />
          <Tooltip content={<CustomChartTooltip formatter={formatPercent} />} />
          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ paddingBottom: 10, fontSize: 12, fontFamily: "monospace" }}
          />
          <Area
            type="monotone"
            dataKey="planned"
            name="Planned Target S-Curve"
            stroke="#64748b"
            strokeWidth={2}
            strokeDasharray="4 4"
            fillOpacity={1}
            fill="url(#plannedGrad)"
          />
          <Area
            type="monotone"
            dataKey="actual"
            name="Verified Physical Progress"
            stroke="#10b981"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#actualGrad)"
          />
          {data.some((d) => d.financial !== undefined) && (
            <Line
              type="monotone"
              dataKey="financial"
              name="Financial Budget Burn %"
              stroke="#F36B32"
              strokeWidth={2}
              dot={{ r: 3, fill: "#F36B32" }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// 3. Commercial Expenses by Category (Donut Chart)
interface ExpenseCategoryProps {
  data: {
    name: string;
    value: number;
  }[];
  height?: number;
}

export function ExpenseCategoryDonutChart({ data, height = 280 }: ExpenseCategoryProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div style={{ height }} className="w-full bg-construct-muted/40 rounded-xl animate-pulse" />;
  }

  const formatINR = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
    return `₹${val.toLocaleString()}`;
  };

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div style={{ width: "100%", height }} className="relative flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={95}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={PIE_PALETTE[index % PIE_PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomChartTooltip formatter={formatINR} />} />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ paddingTop: 10, fontSize: 11, fontFamily: "monospace" }}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Center Total Pill */}
      <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
        <span className="text-[10px] font-mono uppercase tracking-wider text-construct-secondary block">
          Total Spent
        </span>
        <span className="font-heading font-extrabold text-xs text-construct-text block">
          {formatINR(total)}
        </span>
      </div>
    </div>
  );
}

// 4. Daily Workforce Labor Attendance by Trade (Stacked Bar Chart)
interface LaborAttendanceProps {
  data: {
    date: string;
    carpenters: number;
    barBenders: number;
    masons: number;
    helpers: number;
    machinery?: number;
    total: number;
  }[];
  height?: number;
}

export function LaborHeadcountChart({ data, height = 280 }: LaborAttendanceProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div style={{ height }} className="w-full bg-construct-muted/40 rounded-xl animate-pulse" />;
  }

  const formatCount = (val: number) => `${val} workers`;

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#64748b", fontSize: 11, fontFamily: "monospace" }}
            tickLine={false}
            axisLine={{ stroke: "#cbd5e1" }}
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 10, fontFamily: "monospace" }}
            tickLine={false}
            axisLine={{ stroke: "#cbd5e1" }}
            width={35}
          />
          <Tooltip content={<CustomChartTooltip formatter={formatCount} />} />
          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ paddingBottom: 10, fontSize: 11, fontFamily: "monospace" }}
          />
          <Bar dataKey="carpenters" name="Shuttering Carpenters" stackId="labor" fill="#F36B32" />
          <Bar dataKey="barBenders" name="Bar Benders" stackId="labor" fill="#3b82f6" />
          <Bar dataKey="masons" name="Masons" stackId="labor" fill="#8b5cf6" />
          <Bar dataKey="helpers" name="Helpers & Unskilled" stackId="labor" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// 5. Material Inventory Stock vs Safety Buffer Threshold (Grouped Bar Chart)
interface MaterialStockProps {
  data: {
    material: string;
    currentStock: number;
    safetyBuffer: number;
    unit: string;
  }[];
  height?: number;
}

export function MaterialStockBufferChart({ data, height = 280 }: MaterialStockProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div style={{ height }} className="w-full bg-construct-muted/40 rounded-xl animate-pulse" />;
  }

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
          <XAxis
            dataKey="material"
            tick={{ fill: "#64748b", fontSize: 10, fontFamily: "monospace" }}
            tickLine={false}
            axisLine={{ stroke: "#cbd5e1" }}
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 10, fontFamily: "monospace" }}
            tickLine={false}
            axisLine={{ stroke: "#cbd5e1" }}
            width={45}
          />
          <Tooltip
            content={
              <CustomChartTooltip
                formatter={(val: number, name: string) => `${val}`}
              />
            }
          />
          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ paddingBottom: 10, fontSize: 11, fontFamily: "monospace" }}
          />
          <Bar dataKey="currentStock" name="Current Yard Stock" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="safetyBuffer" name="Minimum Buffer Threshold" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// 6. Milestone & Activity Progress Completion (Horizontal Bar Chart)
interface ActivityProgressProps {
  data: {
    code: string;
    name: string;
    percent: number;
    status: string;
  }[];
  height?: number;
}

export function ActivityMilestoneChart({ data, height = 280 }: ActivityProgressProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div style={{ height }} className="w-full bg-construct-muted/40 rounded-xl animate-pulse" />;
  }

  const formatPercent = (val: number) => `${val}%`;

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 10, right: 20, left: 50, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={formatPercent}
            tick={{ fill: "#64748b", fontSize: 10, fontFamily: "monospace" }}
            axisLine={{ stroke: "#cbd5e1" }}
          />
          <YAxis
            type="category"
            dataKey="code"
            tick={{ fill: "#202321", fontSize: 11, fontWeight: "bold", fontFamily: "monospace" }}
            axisLine={{ stroke: "#cbd5e1" }}
          />
          <Tooltip content={<CustomChartTooltip formatter={formatPercent} />} />
          <Bar dataKey="percent" name="% Verified Physical Progress" radius={[0, 6, 6, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  entry.percent === 100
                    ? "#10b981"
                    : entry.percent > 50
                    ? "#F36B32"
                    : "#3b82f6"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
