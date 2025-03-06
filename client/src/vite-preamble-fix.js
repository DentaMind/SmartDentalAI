/**
 * This script runs before React initialization to fix the Vite preamble detection
 * Simply including this before any React code ensures the proper setup
 */

// Only run in development mode with HMR
if (import.meta.hot) {
  // Fix for @vitejs/plugin-react preamble detection
  window.__vite_plugin_react_preamble_installed__ = true;
  
  // Define the React refresh functions to prevent errors
  window.$RefreshReg$ = () => {};
  window.$RefreshSig$ = () => (type) => type;
  
  console.log('[vite-preamble-fix] React refresh preamble installed manually');
}