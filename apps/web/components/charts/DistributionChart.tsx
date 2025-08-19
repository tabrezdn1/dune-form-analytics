"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { FieldAnalytics, FormField } from "@/lib/types";

interface DistributionChartProps {
  field: FormField;
  analytics: FieldAnalytics;
  chartType?: "bar" | "pie";
  className?: string;
}

export function DistributionChart({
  field,
  analytics,
  chartType = "bar",
  className = "",
}: DistributionChartProps) {
  if (
    !analytics.distribution ||
    Object.keys(analytics.distribution).length === 0
  ) {
    return (
      <div
        className={`flex items-center justify-center h-64 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200/30 dark:border-emerald-700/30 ${className}`}
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
            No Responses Yet
          </h4>
          <p className="text-gray-600 dark:text-gray-400">
            Waiting for form submissions
          </p>
        </div>
      </div>
    );
  }

  // Prepare data for charts
  const data = Object.entries(analytics.distribution)
    .map(([optionId, count]) => {
      const option = field.options?.find((opt) => opt.id === optionId);
      const fullName = option?.label || optionId;
      return {
        name:
          fullName.length > 15 ? fullName.substring(0, 12) + "..." : fullName,
        fullName: fullName,
        value: count,
        percentage:
          analytics.count > 0 ? Math.round((count / analytics.count) * 100) : 0,
      };
    })
    .sort((a, b) => b.value - a.value);

  // Vibrant Distinct Colors for Data Visualization
  const COLORS = [
    "#10b981", // Emerald
    "#3b82f6", // Blue
    "#f59e0b", // Amber
    "#ef4444", // Red
    "#8b5cf6", // Violet
    "#06b6d4", // Cyan
    "#84cc16", // Lime
    "#f97316", // Orange
    "#ec4899", // Pink
    "#6366f1", // Indigo
  ];

  // Render the chart content based on type
  const renderChartContent = () => {
    if (chartType === "pie") {
      return (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ percentage }) =>
                  percentage > 8 ? `${percentage}%` : ""
                } // Only show percentage for slices > 8%
                outerRadius={85}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [value, "Responses"]}
                labelFormatter={(name) => {
                  const item = data.find((d) => d.name === name);
                  return item?.fullName || name;
                }}
                labelStyle={{ color: "#374151" }}
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid rgba(229, 231, 235, 0.5)",
                  borderRadius: "0.75rem",
                  boxShadow:
                    "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                  backdropFilter: "blur(8px)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      );
    }

    return (
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 15, right: 20, left: 15, bottom: 25 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              opacity={0.6}
            />
            <XAxis
              dataKey="name"
              stroke="#6b7280"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              height={20}
              interval={0}
              tick={{
                fontSize: 11,
                fill: "#6b7280",
              }}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(value: number) => [value, "Responses"]}
              labelFormatter={(name) => {
                const item = data.find((d) => d.name === name);
                return item?.fullName || name;
              }}
              labelStyle={{ color: "#374151" }}
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid rgba(229, 231, 235, 0.5)",
                borderRadius: "0.75rem",
                boxShadow:
                  "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                backdropFilter: "blur(8px)",
              }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className={className}>
      {/* Chart Content */}
      {renderChartContent()}

      {/* Shared Legend for Both Chart Types */}
      <div className="mt-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-emerald-200/30 dark:border-emerald-700/30">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Response Breakdown
        </h4>
        <div className="grid grid-cols-1 gap-2">
          {data.map((item, index) => (
            <div
              key={item.name}
              className="flex items-center justify-between bg-white/40 dark:bg-gray-800/40 rounded-lg p-3 backdrop-blur-sm"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div
                  className="w-3 h-3 rounded-full shadow-sm flex-shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span
                  className="text-sm text-gray-700 dark:text-gray-300 font-medium truncate"
                  title={item.fullName}
                >
                  {item.fullName}
                </span>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {item.value}
                </span>
                <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-1 rounded">
                  {item.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
