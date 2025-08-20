"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Form, Analytics, FieldAnalytics, AnalyticsUpdate } from "@/lib/types";
import { useFormAnalyticsWebSocket } from "@/lib/websocket";
import { AnalyticsCard } from "@/components/charts/AnalyticsCard";
import { api, formUtils } from "@/lib/api";
import toast from "react-hot-toast";

interface FormAnalyticsProps {
  form: Form;
  initialAnalytics?: Analytics;
}

export function FormAnalytics({ form, initialAnalytics }: FormAnalyticsProps) {
  const [analytics, setAnalytics] = useState<Analytics | null>(
    initialAnalytics || null,
  );
  const [isLoading, setIsLoading] = useState(!initialAnalytics);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const hasLoadedRef = useRef(false);

  // Handle real-time analytics updates
  const handleAnalyticsUpdate = (data: AnalyticsUpdate) => {
    console.log("📊 Real-time analytics update received:", data);
    
    setAnalytics((prev) => {
      if (!prev) {
        console.warn("⚠️ Received analytics update but no previous analytics data exists");
        return null;
      }

      // Create new analytics object with deep merge
      const updatedAnalytics = {
        ...prev,
        updatedAt: data.updatedAt || new Date().toISOString(),
      };

      // Handle byField updates with proper merging
      if (data.byField) {
        updatedAnalytics.byField = {
          ...prev.byField,
          ...Object.fromEntries(
            Object.entries(data.byField).map(([fieldId, fieldData]) => [
              fieldId,
              {
                ...(prev.byField[fieldId] || {}),
                ...fieldData,
              }
            ])
          )
        };
        console.log("🔄 Updated field analytics:", Object.keys(data.byField));
      }

      // Handle totalResponses update
      if (data.totalResponses !== undefined) {
        updatedAnalytics.totalResponses = data.totalResponses;
        console.log("📈 Updated total responses:", data.totalResponses);
      }

      return updatedAnalytics;
    });

    setLastUpdated(new Date());
    toast.success("Real-time update received!", { duration: 2000 });
  };

  // WebSocket connection for real-time updates
  const { connectionStatus } =
    useFormAnalyticsWebSocket(form.id, handleAnalyticsUpdate);

  // Provide user feedback for connection status changes
  React.useEffect(() => {
    if (connectionStatus === 'connected') {
      console.log("🟢 WebSocket connected successfully for real-time updates");
    } else if (connectionStatus === 'error') {
      console.error("🔴 WebSocket connection failed - real-time updates unavailable");
      toast.error("Real-time connection failed", { duration: 3000 });
    } else if (connectionStatus === 'disconnected') {
      console.warn("🟡 WebSocket disconnected - attempting to reconnect");
    }
  }, [connectionStatus]);

  // Load analytics if not provided initially
  useEffect(() => {
    if (!initialAnalytics && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadAnalytics();
    }
  }, []);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await api.getAnalytics(form.id);
      setAnalytics(response.data || null);
    } catch (error) {
      toast.error("Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  };

  const exportCSV = async () => {
    try {
      const blob = await api.exportResponsesCSV(form.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${form.title}-responses.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("CSV exported successfully!");
    } catch (error) {
      toast.error("Failed to export responses");
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-xl w-1/3 mb-6"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/2 mb-8"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl"
            ></div>
          ))}
        </div>
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Modern Status Bar */}
      <div className="mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              {/* Real-time Connection Status */}
              <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl ${
                connectionStatus === 'connected' ? 'bg-emerald-50 dark:bg-emerald-900/20' :
                connectionStatus === 'connecting' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                connectionStatus === 'error' ? 'bg-red-50 dark:bg-red-900/20' : 
                'bg-gray-50 dark:bg-gray-900/20'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-emerald-500' :
                  connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                  connectionStatus === 'error' ? 'bg-red-500' : 'bg-gray-400'
                }`} />
                <span className={`text-sm font-medium ${
                  connectionStatus === 'connected' ? 'text-emerald-700 dark:text-emerald-300' :
                  connectionStatus === 'connecting' ? 'text-yellow-700 dark:text-yellow-300' :
                  connectionStatus === 'error' ? 'text-red-700 dark:text-red-300' :
                  'text-gray-600 dark:text-gray-400'
                }`}>
                  {connectionStatus === 'connected' ? 'Live Updates' :
                   connectionStatus === 'connecting' ? 'Connecting...' :
                   connectionStatus === 'error' ? 'Connection Failed' : 'Offline'}
                </span>
              </div>

              {/* Form Status */}
              <span
                className={`px-3 py-1.5 rounded-xl text-sm font-semibold ${
                  form.status === "published"
                    ? "bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 dark:from-emerald-900/30 dark:to-teal-900/30 dark:text-emerald-200"
                    : "bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 dark:from-yellow-900/30 dark:to-orange-900/30 dark:text-yellow-200"
                }`}
              >
                {form.status === "published" ? "Published" : "Draft"}
              </span>
            </div>

            <div className="flex items-center space-x-3">
              {/* Export Button */}
              <button
                onClick={exportCSV}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-xl hover:from-emerald-700 hover:to-teal-700 hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-semibold"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>Export CSV</span>
              </button>

              {/* Share Link */}
              <Link
                href={formUtils.getFormShareURL(form.shareSlug)}
                target="_blank"
                className="inline-flex items-center space-x-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 hover:shadow-md transition-all duration-200 font-semibold"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                <span>View Form</span>
              </Link>
            </div>
          </div>

          {/* Last Updated */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* Modern Summary Stats */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl shadow-lg border border-emerald-200 dark:border-emerald-800/30 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Total Responses
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {analytics.totalResponses.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-2xl shadow-lg border border-teal-200 dark:border-teal-800/30 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Form Fields
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {form.fields.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Insights Section */}
      {analytics ? (
        <div className="space-y-8">
          {/* Insights Overview */}
          <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/90 dark:backdrop-blur-sm rounded-2xl shadow-xl border border-emerald-200/50 dark:border-emerald-700/30 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
                <span>Trends & Insights</span>
              </h2>
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 px-4 py-2 rounded-xl">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {Object.keys(analytics.byField).length} fields analyzed
                </span>
              </div>
            </div>

            {/* Key Insights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Average Rating Insight */}
              {(() => {
                const ratingFields = form.fields.filter(
                  (f) => f.type === "rating",
                );
                const ratingAnalytics = ratingFields
                  .map((f) => analytics.byField[f.id])
                  .filter(Boolean);
                const avgRating =
                  ratingAnalytics.length > 0
                    ? ratingAnalytics.reduce(
                        (sum, a) => sum + (a.average || 0),
                        0,
                      ) / ratingAnalytics.length
                    : 0;

                return (
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-yellow-200/30 dark:border-yellow-700/30">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Average Rating
                        </p>
                        <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                          {avgRating > 0 ? avgRating.toFixed(1) : "N/A"}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {ratingFields.length > 0
                        ? `Across ${ratingFields.length} rating field${ratingFields.length !== 1 ? "s" : ""}`
                        : "No rating fields"}
                    </p>
                  </div>
                );
              })()}

              {/* Most Common Response */}
              {(() => {
                const choiceFields = form.fields.filter(
                  (f) => f.type === "mcq" || f.type === "checkbox",
                );
                const choiceAnalytics = choiceFields
                  .map((f) => analytics.byField[f.id])
                  .filter(Boolean);

                let mostCommon = { option: "N/A", count: 0, field: "" };
                choiceAnalytics.forEach((fieldAnalytics) => {
                  if (fieldAnalytics.distribution) {
                    Object.entries(fieldAnalytics.distribution).forEach(
                      ([optionId, count]) => {
                        if (count > mostCommon.count) {
                          const field = choiceFields.find(
                            (f) => analytics.byField[f.id] === fieldAnalytics,
                          );
                          const option = field?.options?.find(
                            (opt) => opt.id === optionId,
                          );
                          mostCommon = {
                            option: option?.label || optionId,
                            count: count,
                            field: field?.label || "",
                          };
                        }
                      },
                    );
                  }
                });

                return (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200/30 dark:border-blue-700/30">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Most Common
                        </p>
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {mostCommon.count > 0 ? mostCommon.count : "N/A"}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {mostCommon.count > 0
                        ? `"${mostCommon.option}" in ${mostCommon.field}`
                        : "No choice responses yet"}
                    </p>
                  </div>
                );
              })()}

              {/* Most Skipped Questions */}
              {(() => {
                // Look at ALL fields to find the most skipped one
                const allFields = form.fields;
                const totalResponses = analytics.totalResponses;

                let mostSkipped = { field: "N/A", skipped: 0, rate: 0 };
                
                // Find the field with the highest skip rate (lowest response rate)
                allFields.forEach((field) => {
                  const fieldAnalytics = analytics.byField[field.id];
                  if (fieldAnalytics && totalResponses > 0) {
                    const skipped = totalResponses - fieldAnalytics.count;
                    const skipRate = (skipped / totalResponses) * 100;
                    
                    // Find the field with the highest skip rate
                    if (skipRate > mostSkipped.rate) {
                      mostSkipped = {
                        field: field.label,
                        skipped: skipped,
                        rate: skipRate,
                      };
                    }
                  }
                });

                return (
                  <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-red-200/30 dark:border-red-700/30">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Most Skipped
                        </p>
                        <p className="text-lg font-bold text-red-600 dark:text-red-400">
                          {mostSkipped.rate > 0
                            ? `${mostSkipped.rate.toFixed(1)}%`
                            : "0%"}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {mostSkipped.skipped > 0
                        ? `"${mostSkipped.field}" (${mostSkipped.skipped} skipped)`
                        : "All questions answered"}
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="grid gap-6">
            {form.fields.map((field) => {
              const fieldAnalytics = analytics.byField[field.id];

              if (!fieldAnalytics) {
                return (
                  <div
                    key={field.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8"
                  >
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span>{field.label}</span>
                    </h3>
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg
                          className="w-8 h-8 text-gray-400 dark:text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                          />
                        </svg>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-lg">
                        No data available for this field
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <AnalyticsCard
                  key={field.id}
                  field={field}
                  analytics={fieldAnalytics}
                  totalFormResponses={analytics.totalResponses}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-12">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-emerald-600 dark:text-emerald-400"
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
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              No Analytics Available
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg max-w-md mx-auto">
              Analytics will appear here once responses are submitted.
            </p>
            <Link
              href={formUtils.getFormShareURL(form.shareSlug)}
              target="_blank"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-4 rounded-xl hover:from-emerald-700 hover:to-teal-700 hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-semibold text-lg"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                />
              </svg>
              <span>Share Form</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
