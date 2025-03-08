/**
 * This script runs before React initialization to fix the Vite preamble detection
 * Simply including this before any React code ensures the proper setup
 */

// Make sure this runs before any other code
(function() {
  // Always install the preamble regardless of import.meta.hot
  // to ensure consistent behavior in development
  window.__vite_plugin_react_preamble_installed__ = true;

  // Define the React refresh functions to prevent errors
  window.$RefreshReg$ = function(type, id) {
    // This is for compatibility and is a no-op function
    console.log('[vite-preamble-fix] $RefreshReg$ called for', id);
  };

  window.$RefreshSig$ = function() {
    return function(type) {
      return type;
    };
  };

  // If there's a __REACT_REFRESH_RUNTIME__ error, make sure it's defined
  if (typeof window.__REACT_REFRESH_RUNTIME__ === 'undefined') {
    window.__REACT_REFRESH_RUNTIME__ = {
      performReactRefresh: () => {
        console.log('[vite-preamble-fix] Refresh runtime called');
      }
    };
  }

  console.log('[vite-preamble-fix] React refresh preamble installed manually');
})();