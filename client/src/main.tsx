// Import preamble fix before any React code
import "./vite-preamble-fix.js";

// Standard React + Vite imports
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n";

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
  }
}

// Prepare and render the application
const prepare = () => {
  try {
    console.log("[main] Preparing to render application");
    
    // 1. Find the root element
    const rootElement = document.getElementById("root");
    if (!rootElement) {
      console.error("[main] Failed to find the root element");
      throw new Error("Failed to find the root element");
    }
    
    let root;
    // 2. Check if we already have a root (useful for HMR)
    if (!window.__APP_ROOT__) {
      console.log("[main] Creating new root");
      root = createRoot(rootElement);
      window.__APP_ROOT__ = root;
    } else {
      console.log("[main] Using existing root");
      root = window.__APP_ROOT__;
    }
    
    // 3. Render the application
    console.log("[main] Rendering application");
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    console.log("[main] Application rendered successfully");
    return root;
  } catch (error) {
    console.error("[main] Error preparing application:", error);
    throw error;
  }
};

// Execute immediately
const root = prepare();

// Enable HMR support - enhanced version
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    console.log("[HMR] Hot module replacement triggered");
    if (root && window.__APP_ROOT__) {
      try {
        // This ensures the updates are applied without full page reload
        prepare();
        console.log("[HMR] Application successfully updated");
      } catch (err) {
        console.error("[HMR] Error during hot update:", err);
      }
    }
  });
  
  console.log("[HMR] Hot module replacement configured");
}