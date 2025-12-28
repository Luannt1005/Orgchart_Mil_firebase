/**
 * API Constants
 * Centralized API endpoint definitions
 */

// Data retrieval endpoints
export const GET_DATA_API = '/api/orgchart';
export const FILTER_DEPT_API = '/filter_dept';

// Mutation endpoints
export const ADD_DEPARTMENT_API = '/add-Department';
export const UPDATE_NODE_API = '/Update-Node';
export const REMOVE_NODE_API = '/Remove-Node';

// export const NEXT_PUBLIC_GAS_DATA_URL = 'https://script.google.com/macros/s/AKfycbzXlPZTDuLdpfzivyVg-tXXV6bKsavMkb1JbgWIPwGNtyEmxvP-ar00J6l6MIysnjxbPg/exec';
export const NEXT_PUBLIC_GAS_DATA_URL = '/api/orgchart';
// export const NEXT_PUBLIC_GAS_ADD_DEPT_URL = 'https://script.google.com/macros/s/AKfycbxxNzicVtDDPnLMFY5aoSCQ2ZxXGMC9gLtl18-UKVZkIgfPI2nHH8UfW8ZE8rf_GwmZlQ/exec';
// export const NEXT_PUBLIC_GAS_UPDATE_NODE_URL = 'https://script.google.com/macros/s/AKfycbypcbXZrBEehjlpMZuYKTALdKpz3squYGldxo8W9wpcdo2K_GGXX-TLHj-_bmevMjlEWA/exec';
// export const NEXT_PUBLIC_GAS_REMOVE_NODE_URL = 'https://script.google.com/macros/s/AKfycbx7hj4pWsjxLcbDkV3KOVsYicil6Z_Pg2DUj_jyvZLSZFRHk37gizyi0AQveV9l1s6xiQ/exec'
export const NEXT_PUBLIC_CACHE_REVALIDATE_INTERVAL = 60000;

// Cache configuration
export const CACHE_CONFIG = {
  REVALIDATE_INTERVAL: parseInt(
    process.env.NEXT_PUBLIC_CACHE_REVALIDATE_INTERVAL || '60000'
  ),
  STALE_WHILE_REVALIDATE: 120000, // 2 minutes
};

