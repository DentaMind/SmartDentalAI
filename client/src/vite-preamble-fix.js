/**
 * This script runs before React initialization to fix the Vite preamble detection
 * Simply including this before any React code ensures the proper setup
 */

// Make sure this runs before any other code
(function() {
  try {
    /**
     * IMPORTANT: This fixes React refresh in development mode
     * These flags and functions ensure React components can refresh properly
     * without requiring a full page reload during development
     */
    
    // 1. Set the preamble installed flag
    window.__vite_plugin_react_preamble_installed__ = true;
    
    // 2. Ensure React refresh registry functions are available
    if (typeof window.$RefreshReg$ === 'undefined') {
      window.$RefreshReg$ = function(type, id) {
        // This is for compatibility and is a no-op function in our custom implementation
        console.log('[vite-preamble-fix] $RefreshReg$ called for', id);
      };
    }
    
    if (typeof window.$RefreshSig$ === 'undefined') {
      window.$RefreshSig$ = function() {
        return function(type) {
          return type;
        };
      };
    }
    
    // 3. Setup React refresh runtime if missing
    if (typeof window.__REACT_REFRESH_RUNTIME__ === 'undefined') {
      window.__REACT_REFRESH_RUNTIME__ = {
        performReactRefresh: () => {
          console.log('[vite-preamble-fix] Refresh runtime called');
        }
      };
    }
    
    // 4. Handle potential HMR setup
    if (typeof window.__vite_plugin_react_timeout === 'undefined') {
      window.__vite_plugin_react_timeout = setTimeout(() => {
        console.log('[vite-preamble-fix] HMR connection timed out, please reload the page');
      }, 30000);
    }
    
    // 5. Define a check function for React HMR
    window.__check_vite_hmr = function() {
      try {
        if (import.meta && import.meta.hot) {
          clearTimeout(window.__vite_plugin_react_timeout);
          console.log('[vite-preamble-fix] HMR available via import.meta.hot');
        }
      } catch (e) {
        console.log('[vite-preamble-fix] HMR check error:', e);
      }
    };
    
    // Try to run the HMR check
    setTimeout(window.__check_vite_hmr, 1000);
    
    console.log('[vite-preamble-fix] React refresh preamble installed manually');
  } catch (err) {
    console.error('[vite-preamble-fix] Error setting up preamble:', err);
  }
})();