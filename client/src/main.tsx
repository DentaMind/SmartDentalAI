// Import preamble fix before any React code
import "./vite-preamble-fix.js";

// Standard React + Vite imports
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n";

// Ensure HMR works properly
const prepare = () => {
  console.log("[main] Preparing to render application");
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    console.error("[main] Failed to find the root element");
    throw new Error("Failed to find the root element");
  }
  
  let root;
  // Check if we already have a root to prevent double rendering
  if (!(window as any).__APP_ROOT__) {
    console.log("[main] Creating new root");
    root = createRoot(rootElement);
    (window as any).__APP_ROOT__ = root;
  } else {
    console.log("[main] Using existing root");
    root = (window as any).__APP_ROOT__;
  }
  
  console.log("[main] Rendering application");
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  console.log("[main] Application rendered successfully");
};

// Execute immediately
prepare();

// Enable HMR support - basic version
if (import.meta.hot) {
  import.meta.hot.accept();
  console.log("[HMR] Hot module replacement enabled");
}