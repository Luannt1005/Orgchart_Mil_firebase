/**
 * Custom Hook: useOrgData
 * Provides global organization data with SWR caching
 * Time-based revalidation: 60 seconds
 */

'use client';

import useSWR, { SWRConfiguration } from 'swr';
import { useRef } from 'react';
import { OrgNode, ApiResponse } from '@/types/orgchart';
import { swrFetcher } from '@/lib/api-client';
import { GET_DATA_API } from '@/constant/api';

// Cache configuration
const CACHE_REVALIDATE_INTERVAL = parseInt(
  process.env.NEXT_PUBLIC_CACHE_REVALIDATE_INTERVAL || '60000'
);
const DEDUPING_INTERVAL = 5 * 60 * 1000; // 5 minutes - keep cache active for this duration
const FOCUS_THROTTLE_INTERVAL = 10 * 60 * 1000; // 10 minutes - don't revalidate when focusing tab

interface UseOrgDataOptions extends SWRConfiguration {
  onSuccess?: (data: OrgNode[]) => void;
  onError?: (error: Error) => void;
}

export function useOrgData(options?: UseOrgDataOptions) {
  // Track if we've already attempted to revalidate empty data
  const revalidateAttemptedRef = useRef(false);

  // Build SWR config safely, avoiding callback conflicts
  const baseConfig: SWRConfiguration = {
    // Conservative caching strategy - prioritize cache over fresh data
    revalidateOnFocus: false, // Don't revalidate when tab regains focus
    revalidateOnReconnect: false, // Don't revalidate on reconnect
    revalidateIfStale: false, // Don't auto-revalidate if stale
    revalidateOnMount: false, // Use cached data when component mounts (critical!)
    shouldRetryOnError: false, // Don't retry on error automatically
    focusThrottleInterval: FOCUS_THROTTLE_INTERVAL,
    dedupingInterval: DEDUPING_INTERVAL, // Deduplicate requests within 5 minutes
    compare: (a, b) => {
      // Custom comparison to avoid unnecessary re-renders
      return JSON.stringify(a) === JSON.stringify(b);
    },
    onSuccess: (fetchedData) => {
      // Log successful fetch
      const dataLength = fetchedData?.data?.length || 0;
      console.log(`✅ Data fetched successfully: ${dataLength} items`);
      // Reset revalidate attempt flag when we get new data
      if (dataLength > 0) {
        revalidateAttemptedRef.current = false;
      }
    },
    onError: (error) => {
      console.error('❌ Error fetching data:', error.message);
    },
  };

  // Merge options without spreading callbacks multiple times
  const swrConfig: SWRConfiguration = {
    ...baseConfig,
    ...(options && {
      ...options,
      // Only set callbacks if they exist
      ...(options.onSuccess && { onSuccess: options.onSuccess }),
      ...(options.onError && { onError: options.onError }),
    }),
  };

  const { data, error, isLoading, mutate } = useSWR<ApiResponse<OrgNode>>(
    GET_DATA_API,
    swrFetcher,
    swrConfig
  );

  // Extract nodes array from response
  const nodes = data?.data ?? [];

  // Check if data is empty AND we haven't attempted revalidate yet
  // Only revalidate ONCE if cache is completely empty
  if (!isLoading && nodes.length === 0 && !revalidateAttemptedRef.current) {
    console.warn('⚠️ Data is empty, attempting single revalidation...');
    revalidateAttemptedRef.current = true;
    // Use setTimeout to prevent synchronous state update issues
    setTimeout(() => {
      mutate(undefined, { revalidate: true });
    }, 0);
  }

  // Extract unique group names
  const groups = Array.from(
    new Set(
      nodes
        .filter(node => node.tags?.includes('group'))
        .map(node => node.name)
        .filter(Boolean)
    )
  ).sort();

  return {
    nodes,
    groups,
    loading: isLoading,
    error: error as Error | null,
    mutate, // Manual revalidation trigger
    rawData: data,
  };
}

/**
 * Helper hook to get filtered data by group
 * Uses cached global data to avoid extra API calls
 */
export function useFilteredOrgData(groupName?: string) {
  const { nodes, loading, error, mutate } = useOrgData();

  // Perform client-side filtering from cached data
  const filteredNodes = groupName
    ? filterNodesByGroup(nodes, groupName)
    : nodes;

  return {
    nodes: filteredNodes,
    loading,
    error,
    mutate,
    allNodes: nodes,
  };
}

/**
 * DFS filtering function to get nodes for a specific group
 */
function filterNodesByGroup(
  nodes: OrgNode[],
  groupName: string
): OrgNode[] {
  const targetNode = nodes.find(
    n => n.name === groupName && n.tags?.includes('group')
  );

  if (!targetNode) return [];

  const filtered: OrgNode[] = [];
  const visited = new Set<string | number>();

  const allNodes = nodes;

  function dfs(nodeId: string | number) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const current = allNodes.find((n: any) => n.id === nodeId);
    if (current) filtered.push(current);

    allNodes.forEach((n: any) => {
      // 🔹 GROUP → GROUP
      if (
        n.pid === nodeId &&
        Array.isArray(n.tags) &&
        n.tags.includes("group")
      ) {
        dfs(n.id);
      }

      // 🔹 GROUP → EMP
      if (
        n.pid === nodeId &&
        Array.isArray(n.tags) &&
        n.tags.includes("emp")
      ) {
        dfs(n.id);
      }

      // 🔹 EMP → EMP
      if (n.stpid === nodeId) {
        dfs(n.id);
      }
    });
  }

  dfs(targetNode.id);
  return filtered;
}

/**
 * Hook to manually trigger cache revalidation
 * Useful after create/update/delete operations
 * Note: Only use this after mutations (add/update/delete)
 */
export function useRevalidateOrgData() {
  const { mutate } = useOrgData();

  const revalidate = async (shouldRevalidate = true) => {
    try {
      // Only revalidate when explicitly needed (after mutations)
      if (shouldRevalidate) {
        console.log('🔄 Revalidating org data after mutation...');
        await mutate(undefined, {
          revalidate: true, // Force fresh data from server
        });
      }
      return true;
    } catch (error) {
      console.error('Failed to revalidate org data:', error);
      return false;
    }
  };

  return { revalidate };
}
