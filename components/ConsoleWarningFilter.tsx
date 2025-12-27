"use client";

import { useEffect } from "react";

/**
 * Suppresses harmless console warnings from third-party libraries
 * Only suppresses in production to keep development warnings visible
 */
export function ConsoleWarningFilter() {
  useEffect(() => {
    // Only suppress warnings in production
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    const originalWarn = console.warn;
    const originalError = console.error;

    // Filter passive event listener warnings (harmless, from third-party libraries)
    console.warn = (...args: any[]) => {
      const message = args[0]?.toString() || "";
      if (
        message.includes("Unable to preventDefault inside passive event listener") ||
        message.includes("passive event listener")
      ) {
        // Suppress these warnings
        return;
      }
      originalWarn.apply(console, args);
    };

    // Filter Cross-Origin-Opener-Policy warnings (harmless, related to popup windows)
    console.error = (...args: any[]) => {
      const message = args[0]?.toString() || "";
      if (
        message.includes("Cross-Origin-Opener-Policy") ||
        message.includes("window.closed call")
      ) {
        // Suppress these warnings
        return;
      }
      originalError.apply(console, args);
    };

    // Cleanup on unmount
    return () => {
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  return null;
}

