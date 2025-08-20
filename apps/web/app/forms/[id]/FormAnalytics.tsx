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
  const [showResponseAnimation, setShowResponseAnimation] = useState(false);
  const [previousResponseCount, setPreviousResponseCount] = useState(
    initialAnalytics?.totalResponses || 0
  );
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const hasLoadedRef = useRef(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // Handle real-time analytics updates
  const handleAnalyticsUpdate = (data: AnalyticsUpdate) => {
    setAnalytics((prev) => {
      if (!prev) {
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
      }

      // Handle totalResponses update
      if (data.totalResponses !== undefined) {
        updatedAnalytics.totalResponses = data.totalResponses;
        
        // Trigger animation if response count increased
        if (data.totalResponses > previousResponseCount) {
          setShowResponseAnimation(true);
          setPreviousResponseCount(data.totalResponses);
          setTimeout(() => setShowResponseAnimation(false), 2000);
        }
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
    if (connectionStatus === 'error') {
      toast.error("Real-time connection failed", { duration: 3000 });
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

  // Handle clicking outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const exportCSV = async () => {
    setShowExportDropdown(false);
    try {
      // Generate timestamp for unique filename
      const timestamp = new Date().toISOString()
        .replace(/T/, '_')
        .replace(/:/g, '-')
        .replace(/\..+/, '');
      
      // Export analytics CSV instead of raw responses
      const blob = await api.exportAnalyticsCSV(form.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${form.title}_${timestamp}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Analytics CSV exported successfully!");
    } catch (error) {
      toast.error("Failed to export analytics");
    }
  };

  const exportPDF = async () => {
    setShowExportDropdown(false);
    
    if (!analytics) {
      toast.error("No analytics data to export");
      return;
    }

    toast.loading("Generating PDF report...");

    try {
      // Dynamic imports for libraries to avoid SSR issues
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas')
      ]);
      
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // Add Dune Forms branding header
      doc.setFillColor(147, 51, 234); // Purple color
      doc.rect(0, 0, pageWidth, 30, 'F');
      
      // Add logo/title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text("Dune Forms", 10, 18);
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text("Analytics Report", pageWidth - 10, 18, { align: 'right' });

      // Form Title
      yPosition = 40;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text(form.title, 10, yPosition);
      
      // Form Details
      yPosition += 8;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 10, yPosition);
      
      yPosition += 5;
      doc.text(`Total Responses: ${analytics.totalResponses} | Form Fields: ${form.fields.length}`, 10, yPosition);
      
      // Separator line
      yPosition += 5;
      doc.setDrawColor(200, 200, 200);
      doc.line(10, yPosition, pageWidth - 10, yPosition);
      
      yPosition += 10;

      // Capture analytics dashboard elements section by section
      const analyticsContainer = document.getElementById('analytics-content');
      if (analyticsContainer) {
        // Temporarily hide elements we don't want in the PDF
        const exportButton = document.querySelector('[data-export-dropdown]') as HTMLElement;
        if (exportButton) exportButton.style.display = 'none';
        
        // Find all major sections to capture separately
        const sections = analyticsContainer.querySelectorAll('.bg-white\\/80, .bg-gray-800\\/90');
        
        for (let i = 0; i < sections.length; i++) {
          const section = sections[i] as HTMLElement;
          
          // Skip if section is not visible
          if (section.offsetHeight === 0) continue;
          
          // Capture this section
          const canvas = await html2canvas(section, {
            logging: false,
            useCORS: true,
            backgroundColor: '#ffffff',
            windowWidth: section.scrollWidth,
            windowHeight: section.scrollHeight
          } as any);
          
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = pageWidth - 20; // 10mm margins on each side
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          // Check if we need a new page for this section
          const spaceNeeded = imgHeight + 10; // Add some spacing between sections
          const availableSpace = pageHeight - yPosition - 10; // Leave 10mm bottom margin
          
          if (spaceNeeded > availableSpace && yPosition > 40) {
            // Start a new page if this section won't fit
            doc.addPage();
            yPosition = 20;
          }
          
          // Check if section is still too tall for a single page
          if (imgHeight > pageHeight - 40) {
            // Scale down the image to fit on one page
            const scaleFactor = (pageHeight - 40) / imgHeight;
            const scaledWidth = imgWidth * scaleFactor;
            const scaledHeight = imgHeight * scaleFactor;
            
            // Center the scaled image
            const xOffset = (pageWidth - scaledWidth) / 2;
            doc.addImage(imgData, 'PNG', xOffset, yPosition, scaledWidth, scaledHeight);
            yPosition += scaledHeight + 10;
          } else {
            // Add the section as-is
            doc.addImage(imgData, 'PNG', 10, yPosition, imgWidth, imgHeight);
            yPosition += imgHeight + 10;
          }
          
          // Check if we need a new page for the next section
          if (yPosition > pageHeight - 40 && i < sections.length - 1) {
            doc.addPage();
            yPosition = 20;
          }
        }
        
        // Restore hidden elements
        if (exportButton) exportButton.style.display = '';
      } else {
        // Fallback to text-only version if capture fails
        doc.setFontSize(12);
        doc.text("Unable to capture visual elements. Please try again.", 10, yPosition);
      }
      
      // Footer on last page
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      const totalPages = (doc as any).getNumberOfPages ? (doc as any).getNumberOfPages() : 1;
      for (let i = 1; i <= totalPages; i++) {
        if ((doc as any).setPage) {
          (doc as any).setPage(i);
        }
        doc.text(
          `Page ${i} of ${totalPages} | Generated by Dune Forms Analytics`,
          pageWidth / 2,
          pageHeight - 5,
          { align: 'center' }
        );
      }
      
      // Generate timestamp for unique filename
      const timestamp = new Date().toISOString()
        .replace(/T/, '_')
        .replace(/:/g, '-')
        .replace(/\..+/, '');
      
      // Save the PDF
      doc.save(`${form.title}_${timestamp}.pdf`);
      toast.dismiss();
      toast.success("PDF exported successfully with all charts and visualizations!");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to export PDF");
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
      {/* Unified Analytics Dashboard Header */}
      {analytics && (
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 overflow-hidden mb-8">
          {/* Subtle gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-t-2xl"></div>
          
          <div className="relative">
            {/* Top Row: Title, Status, and Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
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
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-900 dark:text-gray-100 text-lg font-semibold">Live Analytics Dashboard</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Real-time form statistics</p>
                </div>
              </div>
              
                            {/* Status Badges and Actions */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Connection Status */}
                <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full ${
                  connectionStatus === 'connected'
                    ? 'bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30'
                    : 'bg-red-100 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    connectionStatus === 'connected'
                      ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse'
                      : 'bg-red-500 dark:bg-red-400'
                  }`} />
                  <span className="text-gray-700 dark:text-gray-200 text-sm font-medium">
                    {connectionStatus === 'connected' ? 'Live Updates' : 'Offline'}
                  </span>
                </div>
                
                {/* Form Status */}
                <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                  form.status === "published"
                    ? "bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                    : "bg-yellow-100 dark:bg-yellow-500/10 border border-yellow-300 dark:border-yellow-500/30 text-yellow-700 dark:text-yellow-400"
                }`}>
                  {form.status === "published" ? "Published" : "Draft"}
                </span>
                
                {/* Export Dropdown */}
                <div className="relative" ref={exportDropdownRef} data-export-dropdown>
                  <button
                    onClick={() => setShowExportDropdown(!showExportDropdown)}
                    className="inline-flex items-center space-x-2 bg-gray-100 dark:bg-gray-700/50 backdrop-blur-sm text-gray-700 dark:text-gray-200 px-4 py-1.5 rounded-full border border-gray-300 dark:border-gray-600/50 hover:bg-gray-200 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-600 transition-all duration-200 font-medium text-sm"
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
                    <span>Export</span>
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showExportDropdown && (
                    <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                      <button
                        onClick={exportCSV}
                        className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
                      >
                        <svg
                          className="w-4 h-4 text-green-600 dark:text-green-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <span className="font-medium text-gray-700 dark:text-gray-200">CSV</span>
                      </button>
                      
                      <button
                        onClick={() => exportPDF()}
                        className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2 border-t border-gray-200 dark:border-gray-700"
                      >
                        <svg
                          className="w-4 h-4 text-red-600 dark:text-red-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="font-medium text-gray-700 dark:text-gray-200">PDF</span>
                      </button>
                    </div>
                  )}
                </div>
                
                <Link
                  href={formUtils.getFormShareURL(form.shareSlug)}
                  target="_blank"
                  className="inline-flex items-center space-x-2 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-4 py-1.5 rounded-full border border-emerald-300 dark:border-emerald-500/30 hover:bg-emerald-200 dark:hover:bg-emerald-500/20 transition-all duration-200 font-medium text-sm"
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
            
            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Total Responses */}
              <div className="bg-gray-50 dark:bg-gray-700/30 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-gray-600/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">
                      Total Responses
                    </p>
                    <div className="flex items-center space-x-2">
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {analytics.totalResponses.toLocaleString()}
                      </p>
                      {showResponseAnimation && (
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 animate-bounce">+1</span>
                      )}
                    </div>
                  </div>
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
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
              </div>
              
              {/* Form Fields */}
              <div className="bg-gray-50 dark:bg-gray-700/30 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-gray-600/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">
                      Form Fields
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {form.fields.length}
                    </p>
                  </div>
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
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
              </div>
              
              {/* Last Updated */}
              <div className="bg-gray-50 dark:bg-gray-700/30 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-gray-600/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">
                      Last Updated
                    </p>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {lastUpdated.toLocaleTimeString()}
                    </p>
                  </div>
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          {/* Animation Overlay */}
          {showResponseAnimation && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 opacity-10 animate-ping" />
            </div>
          )}
        </div>
      )}

      {/* Form Insights Section */}
      <div id="analytics-content">
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

          {/* Field Response Rate Ranking */}
          <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/90 dark:backdrop-blur-sm rounded-2xl shadow-xl border border-emerald-200/50 dark:border-emerald-700/30 p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <span>Field Response Rate Ranking</span>
            </h2>
            
            <div className="space-y-3">
              {(() => {
                // Calculate response rates for all fields
                const fieldRates = form.fields.map((field) => {
                  const fieldAnalytics = analytics.byField[field.id];
                  const responseRate = fieldAnalytics && analytics.totalResponses > 0
                    ? (fieldAnalytics.count / analytics.totalResponses) * 100
                    : 0;
                  
                  return {
                    field: field.label,
                    rate: responseRate,
                    count: fieldAnalytics?.count || 0,
                    required: field.required,
                    type: field.type
                  };
                }).sort((a, b) => b.rate - a.rate); // Sort by response rate descending
                
                return fieldRates.map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    {/* Rank Badge */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm
                      ${index === 0 ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white' :
                        index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800' :
                        index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                      {index + 1}
                    </div>
                    
                    {/* Field Name and Metadata */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {item.field}
                          </span>
                          {item.required && (
                            <span className="px-2 py-0.5 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                              Required
                            </span>
                          )}
                          <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                            {item.type}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {item.count} responses
                          </span>
                          <span className={`font-bold text-sm ${
                            item.rate >= 90 ? 'text-green-600 dark:text-green-400' :
                            item.rate >= 70 ? 'text-yellow-600 dark:text-yellow-400' :
                            item.rate >= 50 ? 'text-orange-600 dark:text-orange-400' :
                            'text-red-600 dark:text-red-400'
                          }`}>
                            {item.rate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 rounded-full ${
                            item.rate >= 90 ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                            item.rate >= 70 ? 'bg-gradient-to-r from-yellow-500 to-amber-600' :
                            item.rate >= 50 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                            'bg-gradient-to-r from-red-500 to-pink-600'
                          }`}
                          style={{ width: `${item.rate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ));
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
    </div>
  );
}

