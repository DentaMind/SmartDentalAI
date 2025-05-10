// Import preamble fix before any React code
import "./vite-preamble-fix.js";

// Add to debug info
if (window.APP_DEBUG) {
  window.APP_DEBUG.initSteps.push('main.tsx loaded');
}

// Standard React + Vite imports
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/globals.css"; // Import our global CSS with dark/light mode variables
import "./i18n";

console.log('[DEBUG] main.tsx execution started, environment:', {
  NODE_ENV: import.meta.env.MODE,
  BASE_URL: import.meta.env.BASE_URL,
  CURRENT_URL: window.location.href
});

// Store debug info
if (window.APP_DEBUG) {
  window.APP_DEBUG.environment = {
    mode: import.meta.env.MODE,
    baseUrl: import.meta.env.BASE_URL,
    currentUrl: window.location.href
  };
}

// Prevent redirect loop by storing a flag in sessionStorage
if (window.location.pathname === "/auth") {
  console.log('[DEBUG] Setting inAuthPage flag in sessionStorage');
  sessionStorage.setItem("inAuthPage", "true");
} else if (sessionStorage.getItem("inAuthPage") === "true") {
  // If we are redirected from the auth page, don't go back there immediately
  console.log('[DEBUG] Removing inAuthPage flag from sessionStorage');
  sessionStorage.removeItem("inAuthPage");
}

/**
 * This is the main entry point for the application
 * We use a functional approach to prepare and render the application
 * with proper HMR (Hot Module Replacement) support 
 */

// Global variable to store our app root instance
declare global {
  interface Window {
    __APP_ROOT__: any;
    __vite_plugin_react_preamble_installed__: boolean;
    $RefreshReg$: (type: any, id: string) => void;
    $RefreshSig$: () => (type: any) => any;
    __REACT_REFRESH_RUNTIME__: { 
      performReactRefresh: () => void;
    };
    APP_DEBUG?: {
      loaded: string;
      initSteps: string[];
      environment?: any;
      errors?: any[];
    };
  }
}

// Add error tracking to debug object
if (window.APP_DEBUG && !window.APP_DEBUG.errors) {
  window.APP_DEBUG.errors = [];
  window.addEventListener('error', (event) => {
    console.error('[CAPTURED ERROR]', event.error);
    if (window.APP_DEBUG?.errors) {
      window.APP_DEBUG.errors.push({
        time: new Date().toISOString(),
        message: event.error?.message || 'Unknown error',
        stack: event.error?.stack,
        source: event.filename,
        line: event.lineno,
        column: event.colno
      });
    }
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[CAPTURED PROMISE REJECTION]', event.reason);
    if (window.APP_DEBUG?.errors) {
      window.APP_DEBUG.errors.push({
        time: new Date().toISOString(),
        type: 'unhandledrejection',
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
      });
    }
  });
}

// Prepare and render the application
const prepare = async () => {
  try {
    console.log("[main] Preparing to render application");
    
    // Store debug info
    if (window.APP_DEBUG) {
      window.APP_DEBUG.initSteps.push('prepare() called');
    }
    
    // 1. Find the root element
    const rootElement = document.getElementById("root");
    if (!rootElement) {
      console.error("[main] Failed to find the root element");
      if (window.APP_DEBUG) {
        window.APP_DEBUG.initSteps.push('ERROR: Failed to find root element');
      }
      throw new Error("Failed to find the root element");
    }
    
    // Store debug info
    if (window.APP_DEBUG) {
      window.APP_DEBUG.initSteps.push('Found root element');
    }
    
    let root;
    // 2. Check if we already have a root (useful for HMR)
    if (!window.__APP_ROOT__) {
      console.log("[main] Creating new root");
      if (window.APP_DEBUG) {
        window.APP_DEBUG.initSteps.push('Creating new React root');
      }
      root = createRoot(rootElement);
      window.__APP_ROOT__ = root;
    } else {
      console.log("[main] Using existing root");
      if (window.APP_DEBUG) {
        window.APP_DEBUG.initSteps.push('Using existing React root');
      }
      root = window.__APP_ROOT__;
    }
    
    // 3. Render the application
    console.log("[main] Rendering application");
    if (window.APP_DEBUG) {
      window.APP_DEBUG.initSteps.push('About to render application');
    }
    
    try {
      // In development, start the MSW to intercept API requests
      if (import.meta.env.DEV) {
        try {
          const { startMockServer } = await import('./mocks/browser');
          await startMockServer();
          console.log('Mock Service Worker initialized');
        } catch (error) {
          console.error('Error initializing Mock Service Worker:', error);
        }
      }

      root.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
      console.log("[main] Application rendered successfully");
      if (window.APP_DEBUG) {
        window.APP_DEBUG.initSteps.push('Application rendered successfully');
      }
    } catch (renderError) {
      console.error("[main] Error during React render:", renderError);
      if (window.APP_DEBUG) {
        window.APP_DEBUG.initSteps.push(`Error during React render: ${renderError.message}`);
        if (!window.APP_DEBUG.errors) window.APP_DEBUG.errors = [];
        window.APP_DEBUG.errors.push({
          time: new Date().toISOString(),
          source: 'React render',
          message: renderError.message,
          stack: renderError.stack
        });
      }
      throw renderError;
    }
    
    return root;
  } catch (error) {
    console.error("[main] Error preparing application:", error);
    if (window.APP_DEBUG) {
      window.APP_DEBUG.initSteps.push(`Error preparing application: ${error.message}`);
    }
    throw error;
  }
};

// Execute immediately - with error handling
let root;
try {
  console.log("[main] Starting application preparation");
  try {
    root = await prepare();
    console.log("[main] Application preparation completed successfully");
  } catch (err) {
    console.error("[main] Application preparation failed with error:", err);
    // Display additional debugging info
    console.log("[main] Environment details:", {
      windowLocation: window.location.href,
      rootElement: document.getElementById("root") ? "Found" : "Not found",
      currentTime: new Date().toISOString()
    });
    throw err;
  }
} catch (startupError) {
  console.error("[main] Fatal error during application startup:", startupError);
  
  // Show error message on page instead of white screen
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="font-family: system-ui, -apple-system, sans-serif; padding: 20px; text-align: center;">
        <h2 style="color: #e11d48;">Application Error</h2>
        <p>There was a problem starting the application. Please try refreshing the page.</p>
        <details style="margin-top: 20px; text-align: left; border: 1px solid #e2e8f0; padding: 10px; border-radius: 4px;">
          <summary style="cursor: pointer; color: #6366f1;">Technical Details</summary>
          <pre style="overflow: auto; margin-top: 10px; background: #f1f5f9; padding: 10px; border-radius: 4px;">${startupError.stack || startupError.message}</pre>
        </details>
      </div>
    `;
  }
}

// Enable HMR support - enhanced version
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    console.log("[HMR] Hot module replacement triggered");
    if (window.APP_DEBUG) {
      window.APP_DEBUG.initSteps.push('HMR update triggered');
    }
    
    if (root && window.__APP_ROOT__) {
      try {
        // This ensures the updates are applied without full page reload
        prepare();
        console.log("[HMR] Application successfully updated");
        if (window.APP_DEBUG) {
          window.APP_DEBUG.initSteps.push('HMR update completed successfully');
        }
      } catch (err) {
        console.error("[HMR] Error during hot update:", err);
        if (window.APP_DEBUG) {
          window.APP_DEBUG.initSteps.push(`HMR update failed: ${err.message}`);
        }
      }
    }
  });
  
  console.log("[HMR] Hot module replacement configured");
  if (window.APP_DEBUG) {
    window.APP_DEBUG.initSteps.push('HMR configured');
  }
}