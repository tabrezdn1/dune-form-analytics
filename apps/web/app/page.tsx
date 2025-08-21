"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/lib/contexts/AppContext";

export default function HomePage() {
  const router = useRouter();
  const { state } = useAppContext();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (state.auth.isAuthenticated && !state.auth.isLoading) {
      router.push("/dashboard");
    }
  }, [state.auth.isAuthenticated, state.auth.isLoading, router]);

  // Show loading while checking authentication
  if (state.auth.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't show landing page if authenticated (will redirect)
  if (state.auth.isAuthenticated) {
    return null;
  }

  // Show landing page for unauthenticated users
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Complementary Theme Spotlight Background */}
      <div className="absolute inset-0 bg-white dark:bg-gray-900"></div>

      {/* Light Theme: Normal Green Spotlight */}
      <div
        className="absolute inset-0 dark:hidden"
        style={{
          background: `radial-gradient(ellipse 140% 100% at 50% 50%, 
            transparent 0%, 
            transparent 25%, 
            rgb(34 197 94 / 0.08) 45%,
            rgb(22 163 74 / 0.15) 65%,
            rgb(21 128 61 / 0.25) 85%,
            rgb(20 83 45 / 0.35) 100%)`,
        }}
      ></div>

      {/* Dark Theme: Deep Emerald Spotlight */}
      <div
        className="absolute inset-0 hidden dark:block"
        style={{
          background: `radial-gradient(ellipse 140% 100% at 50% 50%, 
            transparent 0%, 
            transparent 20%, 
            rgb(6 78 59 / 0.15) 40%,
            rgb(6 78 59 / 0.3) 60%,
            rgb(4 47 46 / 0.5) 80%,
            rgb(6 78 59 / 0.7) 100%)`,
        }}
      ></div>

      {/* Light Theme: Corner Effects */}
      <div
        className="absolute inset-0 opacity-60 dark:hidden"
        style={{
          background: `
            radial-gradient(circle at 0% 0%, rgb(21 128 61 / 0.2) 0%, transparent 50%),
            radial-gradient(circle at 100% 0%, rgb(34 197 94 / 0.15) 0%, transparent 50%),
            radial-gradient(circle at 0% 100%, rgb(22 163 74 / 0.15) 0%, transparent 50%),
            radial-gradient(circle at 100% 100%, rgb(21 128 61 / 0.2) 0%, transparent 50%)`,
        }}
      ></div>

      {/* Dark Theme: Deep Emerald Corners */}
      <div
        className="absolute inset-0 opacity-80 hidden dark:block"
        style={{
          background: `
            radial-gradient(circle at 0% 0%, rgb(6 78 59 / 0.4) 0%, transparent 50%),
            radial-gradient(circle at 100% 0%, rgb(4 47 46 / 0.3) 0%, transparent 50%),
            radial-gradient(circle at 0% 100%, rgb(6 78 59 / 0.3) 0%, transparent 50%),
            radial-gradient(circle at 100% 100%, rgb(4 47 46 / 0.5) 0%, transparent 50%)`,
        }}
      ></div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Dune Forms
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
              Create, edit, and share professional forms with real-time analytics,
              trend insights, and intelligent data protection
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transition-all"
              >
                Get Started Free
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Getting Started Section */}
          <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/90 dark:backdrop-blur-sm rounded-2xl border border-emerald-200/50 dark:border-emerald-700/30 p-8 shadow-xl mb-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Getting Started
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Follow these steps to maximize your form analytics platform
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex flex-col items-center text-center p-4 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-4">
                  <span className="text-lg font-bold text-white">1</span>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Create Your First Form
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Use the form builder to create dynamic forms with various
                  field types
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-4 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-4">
                  <span className="text-lg font-bold text-white">2</span>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Share & Collect Responses
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Publish your form and share the unique link to start
                  collecting responses
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-4 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl flex items-center justify-center mb-4">
                  <span className="text-lg font-bold text-white">3</span>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  View Real-Time Analytics
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Monitor responses and analytics in real-time with WebSocket
                  updates
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-4 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-4">
                  <span className="text-lg font-bold text-white">4</span>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Export & Analyze
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Download response data as CSV and analyze trends over time
                </p>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16" id="features">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-emerald-600 dark:text-emerald-400"
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
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Dynamic Form Builder
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Create forms with text fields, multiple choice, checkboxes, and
                rating fields using our intuitive drag-and-drop interface
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600 dark:text-green-400"
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
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Real-Time Analytics
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Watch responses come in live with instant analytics, trends, and
                visual breakdowns that update as users submit
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-teal-600 dark:text-teal-400"
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
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Easy Sharing
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Generate unique shareable links for your forms and collect
                responses from anywhere with professional layouts
              </p>
            </div>
          </div>

          {/* Key Features Details */}
          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                Powerful Form Builder
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mt-1 mr-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">
                    <strong>Custom Form Logic</strong> - No third-party
                    dependencies, built from scratch
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mt-1 mr-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">
                    <strong>Drag & Drop Interface</strong> - Intuitive field
                    reordering and management
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mt-1 mr-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">
                    <strong>Field Validation</strong> - Comprehensive validation
                    rules and error handling
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mt-1 mr-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">
                    <strong>Conditional Fields</strong> - Show/hide fields based
                    on previous answers
                  </span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                Advanced Analytics
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mt-1 mr-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">
                    <strong>Real-Time Updates</strong> - WebSocket-powered live
                    analytics
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mt-1 mr-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">
                    <strong>Visual Breakdowns</strong> - Charts and trends for
                    each form field
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mt-1 mr-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">
                    <strong>Export Capabilities</strong> - Download responses and analytics data as CSV and PDF files
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mt-1 mr-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">
                    <strong>Survey Trends</strong> - Average ratings, response
                    patterns, and insights
                  </span>
                </li>
              </ul>
            </div>
          </div>



          {/* Technical Stack */}
          <div className="text-center mb-16">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Built for Performance & Scale
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Powered by Next.js 14, Go Fiber API, MongoDB, and WebSocket
              technology for enterprise-grade form analytics with real-time
              capabilities and secure user authentication.
            </p>
          </div>

          {/* Developer Section */}
          <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/90 dark:backdrop-blur-sm rounded-2xl border border-emerald-200/50 dark:border-emerald-700/30 shadow-xl p-8 mb-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-8">
                Developed by
              </h2>

                             <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
                 {/* Profile Image */}
                 <div className="flex-shrink-0">
                   <img
                     src="/images/team/shaik-tabrez.png"
                     alt="Shaik Tabrez - Software Engineer"
                     className="w-32 h-32 rounded-full shadow-lg object-cover border-4 border-emerald-200/50 dark:border-emerald-700/50"
                   />
                 </div>

                {/* Developer Info */}
                <div className="flex-1 text-center lg:text-left">
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Shaik Tabrez
                  </h3>

                  <div className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                    Software Engineer · Full-Stack · Machine Learning · Cloud
                    Solutions · Generative AI
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6 max-w-3xl">
                    Tabrez is a Software Engineer with 5 years of experience in
                    full-stack development, Generative AI, and cloud-native
                    solutions. He's worked with startups and enterprises,
                    building scalable apps using JavaScript, Python, Node.js,
                    FastAPI, React, Next.js, and more. Tabrez is passionate
                    about Machine Learning, Generative AI, Cloud Automation, and
                    delivering real impactful results fast.
                  </p>

                                     {/* Skills Tags */}
                   <div className="flex flex-wrap gap-3 justify-center lg:justify-start mb-6">
                     <span className="px-4 py-2 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium border border-emerald-200 dark:border-emerald-700/50">
                       Full-Stack
                     </span>
                     <span className="px-4 py-2 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium border border-emerald-200 dark:border-emerald-700/50">
                       Machine Learning
                     </span>
                     <span className="px-4 py-2 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium border border-emerald-200 dark:border-emerald-700/50">
                       Cloud Solutions
                     </span>
                     <span className="px-4 py-2 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium border border-emerald-200 dark:border-emerald-700/50">
                       Microservices
                     </span>
                     <span className="px-4 py-2 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium border border-emerald-200 dark:border-emerald-700/50">
                       Generative AI
                     </span>
                   </div>

                   {/* Contact Links */}
                   <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                     <a
                       href="mailto:tabrezdn1@gmail.com"
                       className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400"
                     >
                       <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                         <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                         <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                       </svg>
                       Email
                     </a>
                     
                     <a
                       href="https://www.linkedin.com/in/shaik-tabrez/"
                       target="_blank"
                       rel="noopener noreferrer"
                       className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                     >
                       <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                         <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
                       </svg>
                       LinkedIn
                     </a>
                     
                     <a
                       href="https://github.com/tabrezdn1"
                       target="_blank"
                       rel="noopener noreferrer"
                       className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                     >
                       <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                         <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                       </svg>
                       GitHub
                     </a>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
