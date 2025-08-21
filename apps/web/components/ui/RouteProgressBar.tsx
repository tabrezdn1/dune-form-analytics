'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function RouteProgressBar() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();
  const navigationStartedRef = useRef(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPathnameRef = useRef(pathname);

  const startProgress = useCallback(() => {
    if (isLoading || navigationStartedRef.current) return;

    navigationStartedRef.current = true;
    setIsLoading(true);
    setProgress(20); // Start with meaningful progress

    // Animate progress more slowly and realistically
    let currentProgress = 20;
    progressIntervalRef.current = setInterval(() => {
      // Very slow progress that stops at 85% until page is ready
      const increment =
        currentProgress < 40
          ? 6
          : currentProgress < 60
            ? 3
            : currentProgress < 75
              ? 1.5
              : currentProgress < 85
                ? 0.5
                : 0;

      if (increment > 0) {
        currentProgress = Math.min(currentProgress + increment, 85);
        setProgress(currentProgress);
      }
    }, 300); // Slower intervals for more realistic feel
  }, [isLoading]);

  const completeProgress = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Jump to 100% for completion
    setProgress(100);

    // Hide progress bar after completion animation
    setTimeout(() => {
      setIsLoading(false);
      setProgress(0);
      navigationStartedRef.current = false;
    }, 500);
  }, []);

  const checkPageReady = useCallback(() => {
    // Check if the page content has actually changed and rendered
    const pageContentSelectors = [
      'main',
      '[role="main"]',
      '.max-w-7xl', // Common container in your app
      'h1', // Page titles
      '.relative.z-10', // Content wrapper in your pages
    ];

    let contentFound = false;
    for (const selector of pageContentSelectors) {
      const element = document.querySelector(selector);
      if (
        element &&
        element.textContent &&
        element.textContent.trim().length > 0
      ) {
        contentFound = true;
        break;
      }
    }

    return contentFound && document.readyState === 'complete';
  }, []);

  // Handle link clicks to start progress
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Don't interfere with drag operations
      if (
        target.closest('[draggable="true"]') ||
        target.hasAttribute('draggable')
      ) {
        return;
      }

      const link = target.closest('a');

      if (
        link &&
        link.getAttribute('href') &&
        !link.getAttribute('href')?.startsWith('#') &&
        !link.getAttribute('href')?.startsWith('mailto:') &&
        !link.getAttribute('href')?.startsWith('tel:') &&
        !link.hasAttribute('target') &&
        !link.hasAttribute('download') &&
        link.getAttribute('href') !== pathname
      ) {
        startProgress();
      }
    };

    // Use normal phase instead of capture to avoid interfering with other event handlers
    document.addEventListener('click', handleClick, false);
    return () => document.removeEventListener('click', handleClick, false);
  }, [pathname, startProgress]);

  // This effect runs when the pathname changes
  useEffect(() => {
    if (pathname !== lastPathnameRef.current && navigationStartedRef.current) {
      lastPathnameRef.current = pathname;

      // Wait for the new page to render its content
      const checkAndComplete = () => {
        if (checkPageReady()) {
          completeProgress();
        } else {
          // Keep checking until page is ready
          setTimeout(checkAndComplete, 100);
        }
      };

      // Small delay to let React render the new page
      setTimeout(checkAndComplete, 200);
    }
  }, [pathname, checkPageReady, completeProgress]);

  // Watch for DOM changes to detect when content is loaded
  useEffect(() => {
    if (!isLoading || !navigationStartedRef.current) return;

    let observer: MutationObserver | null = null;
    let checkCount = 0;
    const maxChecks = 50; // 5 seconds maximum

    const startObserving = () => {
      observer = new MutationObserver(() => {
        checkCount++;
        if (checkPageReady()) {
          if (observer) {
            observer.disconnect();
            observer = null;
          }
          completeProgress();
        } else if (checkCount >= maxChecks) {
          // Fallback - complete anyway
          if (observer) {
            observer.disconnect();
            observer = null;
          }
          completeProgress();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false,
      });
    };

    // Start observing after a small delay
    const observerTimeout = setTimeout(startObserving, 100);

    return () => {
      clearTimeout(observerTimeout);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [isLoading, checkPageReady, completeProgress]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      if (!navigationStartedRef.current) {
        startProgress();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [startProgress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!isLoading) return null;

  return (
    <>
      {/* Progress bar */}
      <div className='fixed top-0 left-0 right-0 z-50 h-1'>
        <div
          className='h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 transition-all duration-700 ease-out shadow-sm'
          style={{ width: `${progress}%` }}
        >
          {/* Shimmer effect - only show when actively progressing */}
          {progress < 100 && (
            <div className='h-full w-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse' />
          )}
        </div>
      </div>

      {/* Subtle glow effect */}
      <div
        className='fixed top-1 left-0 h-1 bg-emerald-400 blur-sm opacity-30 transition-all duration-700 ease-out z-40'
        style={{ width: `${Math.max(0, progress - 10)}%` }}
      />
    </>
  );
}
