'use client';

import { useEffect, useState, useCallback, useRef, useMemo, startTransition } from "react";
import {
  PlusIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  ClockIcon,
  ShieldCheckIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon
} from "@heroicons/react/24/outline";
import styles from "./sheet.module.css";
import useSWR from 'swr';
import { swrFetcher } from '@/lib/api-client';

interface SheetRow {
  id: string;
  [key: string]: any;
}

interface EditingCell {
  rowId: string;
  header: string;
}

// Configuration
const ITEMS_PER_PAGE = 20;

const VISIBLE_COLUMNS = [
  "Emp ID",
  "Dept",
  "Line Manager",
  "Cost Center",
  "Joining\r\n Date",
  "FullName ",
  "Job Title",
  "Status",
  "Employee\r\n Type",
  "Status",
  "Location",
  "Last Working\r\nDay"
];

const DATE_COLUMNS = ["Joining\r\n Date", "Last Working\r\nDay"];

const FILTER_COLUMNS = [
  "Emp ID",
  "Dept",
  "BU Org 3",
  "FullName ",
  "DL/IDL/Staff"
];

// Helper functions
const normalizeFieldName = (fieldName: string): string => {
  return fieldName.replace(/[~*\/\[\]]/g, '_');
};

const denormalizeFieldName = (fieldName: string): string => {
  const mapping: { [key: string]: string } = {
    'DL_IDL_Staff': 'DL/IDL/Staff',
  };
  return mapping[fieldName] || fieldName;
};

const isLineManagerCol = (header: string) => {
  return header.trim().replace(/\r\n|\n/g, ' ') === "Line Manager";
};

const formatDate = (value: any): string => {
  if (!value) return "";
  try {
    if (typeof value === 'string' && value.includes('T')) {
      const date = new Date(value);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
    if (typeof value === 'string' && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {
      return value;
    }
    return String(value);
  } catch {
    return String(value);
  }
};

const formatDateToISO = (value: string): string => {
  if (!value) return "";
  try {
    if (value.includes('T')) return value;
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {
      const [day, month, year] = value.split('/');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toISOString();
    }
    return value;
  } catch {
    return value;
  }
};

interface SheetManagerProps {
  initialShowApprovalOnly?: boolean;
  enableApproval?: boolean;
}

const SheetManager = ({ initialShowApprovalOnly = false, enableApproval = false }: SheetManagerProps) => {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // UI state
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<SheetRow[]>([]);
  const [originalRows, setOriginalRows] = useState<SheetRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filters, setFilters] = useState<{ [key: string]: string }>({});
  const [debouncedFilters, setDebouncedFilters] = useState<{ [key: string]: string }>({});
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [modifiedRows, setModifiedRows] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [showApprovalOnly, setShowApprovalOnly] = useState(initialShowApprovalOnly);

  // Debounce logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters(filters);
      // Optional: Reset to page 1 when search terms change
      setCurrentPage(1);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [filters]);

  // ======= SERVER-SIDE PAGINATION WITH SWR =======
  // ======= SERVER-SIDE PAGINATION WITH SWR =======
  // Construct Query String from filters
  const queryParams = new URLSearchParams();
  queryParams.set('page', currentPage.toString());
  queryParams.set('limit', ITEMS_PER_PAGE.toString());

  if (showApprovalOnly) {
    queryParams.set('lineManagerStatus', 'pending');
  }

  Object.entries(debouncedFilters).forEach(([key, value]) => {
    if (value && value.trim() !== '') {
      queryParams.set(key, value.trim());
    }
  });

  const apiUrl = `/api/sheet?${queryParams.toString()}`;

  const { data: apiResult, error: swrError, mutate, isLoading, isValidating } = useSWR(
    apiUrl,
    swrFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
      revalidateIfStale: true, // Allow revalidation when filters change
      keepPreviousData: true,
    }
  );

  // Prefetch next page logic disabled when filtering to simplify complexity
  // (We could enable it, but need to pass filters there too)
  const nextQueryParams = new URLSearchParams(queryParams);
  nextQueryParams.set('page', (currentPage + 1).toString());
  const nextPageUrl = `/api/sheet?${nextQueryParams.toString()}`;

  useSWR(
    apiResult?.totalPages && currentPage < apiResult.totalPages ? nextPageUrl : null,
    swrFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000,
      revalidateIfStale: false,
    }
  );

  // Extract pagination info from API response
  const totalRecords = apiResult?.total || 0;
  const totalPages = apiResult?.totalPages || 1;

  // Sync API data to local state
  useEffect(() => {
    if (apiResult?.success && modifiedRows.size === 0) {
      startTransition(() => {
        // Filter visible headers
        const apiHeaders = apiResult.headers || [];
        const visibleHeaders = apiHeaders.filter((h: string) =>
          VISIBLE_COLUMNS.includes(h) || VISIBLE_COLUMNS.includes(denormalizeFieldName(h))
        );

        // If no headers from API, use default
        if (visibleHeaders.length === 0 && apiResult.data?.length > 0) {
          const firstRow = apiResult.data[0];
          const inferredHeaders = Object.keys(firstRow).filter(h =>
            VISIBLE_COLUMNS.includes(h) || VISIBLE_COLUMNS.includes(denormalizeFieldName(h))
          );
          setHeaders(inferredHeaders.length > 0 ? inferredHeaders : VISIBLE_COLUMNS);
        } else {
          setHeaders(visibleHeaders.length > 0 ? visibleHeaders : VISIBLE_COLUMNS);
        }

        setRows(apiResult.data || []);

        // Lazy deep clone for originalRows
        requestIdleCallback?.(() => {
          setOriginalRows(structuredClone?.(apiResult.data || []) || JSON.parse(JSON.stringify(apiResult.data || [])));
        }) ?? setTimeout(() => {
          setOriginalRows(structuredClone?.(apiResult.data || []) || JSON.parse(JSON.stringify(apiResult.data || [])));
        }, 0);
      });
    } else if (apiResult?.error) {
      setError(apiResult.error);
    }
  }, [apiResult, modifiedRows.size]);

  useEffect(() => {
    if (swrError) {
      setError(swrError.message || "Network error");
    }
  }, [swrError]);

  // Filter rows (keep approval filter client-side if needed, or handle exclusively)
  const filteredRows = useMemo(() => {
    // Client-side filtering is REMOVED because it's now handled by the server API
    // The 'rows' we receive are already filtered by the API.
    return rows;
  }, [rows]);

  // Pending approvals count
  const pendingApprovals = useMemo(() => {
    return rows.filter(row => row.lineManagerStatus === 'pending');
  }, [rows]);

  // Navigation handlers
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const handleFilterChange = (header: string, value: string) => {
    setFilters((prev) => ({ ...prev, [header]: value }));
  };

  const handleCellClick = (rowId: string, header: string) => {
    setEditingCell({ rowId, header });
  };

  const handleCellChange = (rowId: string, header: string, value: string) => {
    setRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [header]: value } : row))
    );
    setModifiedRows((prev) => new Set([...prev, rowId]));
  };

  const handleAddRow = () => {
    if (headers.length === 0) {
      setHeaders(VISIBLE_COLUMNS);
    }
    const newId = `new-${Date.now()}`;
    const newRow: SheetRow = { id: newId };
    const targetHeaders = headers.length > 0 ? headers : VISIBLE_COLUMNS;

    targetHeaders.forEach(header => {
      newRow[header] = "";
    });

    setRows(prev => [newRow, ...prev]);
    setModifiedRows(prev => new Set([...prev, newId]));
    setEditingCell({ rowId: newId, header: targetHeaders[0] });
  };

  const handleSaveAll = async () => {
    if (modifiedRows.size === 0) return;
    setSaving(true);
    setError(null);
    let successCount = 0;

    try {
      for (const rowId of modifiedRows) {
        const row = rows.find((r) => r.id === rowId);
        const isNewRow = rowId.startsWith("new-");
        const originalRow: any = isNewRow ? {} : originalRows.find((r) => r.id === rowId);

        if (!row || (!isNewRow && !originalRow)) continue;

        const dataToSave: { [key: string]: any } = {};

        headers.forEach((header) => {
          let value = row[header] || "";
          let originalValue = isNewRow ? "" : (originalRow[header] || "");

          if (DATE_COLUMNS.includes(header)) {
            value = formatDateToISO(value);
            originalValue = isNewRow ? "" : formatDateToISO(originalValue);
          }

          const normalizedHeader = normalizeFieldName(header);

          if (isLineManagerCol(header) && value !== originalValue) {
            dataToSave["pendingLineManager"] = value;
            dataToSave["lineManagerStatus"] = "pending";
          } else {
            dataToSave[normalizedHeader] = value;
          }
        });

        const response = await fetch("/api/sheet", {
          method: isNewRow ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: isNewRow
            ? JSON.stringify({ action: "add", data: dataToSave })
            : JSON.stringify({ id: rowId, data: dataToSave }),
        });
        const result = await response.json();
        if (result.success) successCount++;
      }

      setSuccessMessage(`Successfully processed ${successCount} records.`);
      setModifiedRows(new Set());
      await mutate(); // Refresh current page
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError("Failed to save changes. Please check connection.");
    } finally {
      setSaving(false);
    }
  };

  const handleApprovalAction = async (rowId: string, action: 'approve' | 'reject') => {
    const row = rows.find(r => r.id === rowId);
    if (!row) return;

    setSaving(true);
    try {
      let dataToUpdate: any = {};
      if (action === 'approve') {
        const lmHeader = headers.find(isLineManagerCol) || "Line Manager";
        dataToUpdate[normalizeFieldName(lmHeader)] = row.pendingLineManager;
        dataToUpdate["lineManagerStatus"] = "approved";
        dataToUpdate["pendingLineManager"] = null;
      } else {
        dataToUpdate["lineManagerStatus"] = "rejected";
        dataToUpdate["pendingLineManager"] = null;
      }

      const response = await fetch("/api/sheet", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rowId, data: dataToUpdate }),
      });

      const result = await response.json();
      if (result.success) {
        // Optimization: Removed auto-sync on every approval to prevent lag.
        // Admin should manually click "Sync OrgChart" after processing a batch.

        setSuccessMessage(action === 'approve' ? "Changes approved." : "Request rejected.");
        await mutate();
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError("Approval error occurred.");
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (isLoading && rows.length === 0) {
    return (
      <div className={styles.spinner}>
        <ArrowPathIcon className="w-12 h-12 text-[#DB011C] animate-spin mx-auto mb-4" />
        <span>Loading page {currentPage}...</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className="flex items-center gap-4">
          <ShieldCheckIcon className="w-8 h-8 text-[#DB011C]" />
          <h1>Milwaukee Tool HR Registry</h1>
          {isValidating && (
            <ArrowPathIcon className="w-5 h-5 text-gray-400 animate-spin" />
          )}
        </div>
        <div className="flex items-center gap-3">
          {enableApproval && (
            <button
              onClick={() => {
                setShowApprovalOnly(!showApprovalOnly);
                setCurrentPage(1);
              }}
              className={`${styles.btnReset} flex items-center gap-2`}
              style={{ backgroundColor: showApprovalOnly ? '#f59e0b' : '#6c757d' }}
            >
              <ClockIcon className="w-4 h-4" />
              {showApprovalOnly ? 'Show All' : 'Review Changes'}
              {pendingApprovals.length > 0 && !showApprovalOnly && (
                <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 rounded-full">
                  {pendingApprovals.length}
                </span>
              )}
            </button>
          )}

          <button onClick={handleAddRow} className={styles.btnCreate}>
            <PlusIcon className="w-4 h-4 inline mr-1" />
            Add Entry
          </button>

          <button
            onClick={handleSaveAll}
            disabled={saving || modifiedRows.size === 0}
            className={styles.btnSaveAll}
          >
            {saving ? <ArrowPathIcon className="w-4 h-4 animate-spin inline mr-1" /> : <ArrowDownTrayIcon className="w-4 h-4 inline mr-1" />}
            Save ({modifiedRows.size})
          </button>

          {enableApproval && (
            <button
              onClick={async () => {
                try {
                  setSaving(true);
                  const res = await fetch("/api/sync-orgchart", { method: "POST" });
                  const result = await res.json();
                  if (result.success) {
                    setSuccessMessage("OrgChart synced successfully!");
                    setTimeout(() => setSuccessMessage(null), 3000);
                  } else {
                    setError("Sync failed: " + result.error);
                  }
                } catch (e) {
                  setError("Sync failed.");
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
              className={`${styles.btnReset} bg-indigo-600 text-white hover:bg-indigo-700 ml-2`}
              title="Sync changes to OrgChart view"
            >
              <ArrowPathIcon className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
              Sync OrgChart
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Messages */}
        {error && (
          <div className={styles.error}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ExclamationCircleIcon className="w-5 h-5" />
                <span>{error}</span>
              </div>
              <button onClick={() => setError(null)}><XMarkIcon className="w-5 h-5" /></button>
            </div>
          </div>
        )}
        {successMessage && (
          <div className={styles.successMessage}>
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5" />
              <span>{successMessage}</span>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className={styles.filterBox}>
          <div className={styles.filterRow}>
            {FILTER_COLUMNS.map((header) => {
              const isDLType = header === "DL/IDL/Staff";
              return (
                <div key={header} className={styles.filterInputWrapper}>
                  <label className={styles.filterLabel}>{header.replace(/\r\n/g, ' ')}</label>
                  {isDLType ? (
                    <select
                      value={filters[header] || ""}
                      onChange={(e) => handleFilterChange(header, e.target.value)}
                      className={styles.filterInput}
                    >
                      <option value="">All</option>
                      <option value="DL">DL</option>
                      <option value="IDL">IDL</option>
                      <option value="Staff">Staff</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder={`Search...`}
                      value={filters[header] || ""}
                      onChange={(e) => handleFilterChange(header, e.target.value)}
                      className={styles.filterInput}
                    />
                  )}
                </div>
              );
            })}
            <div className="flex items-end">
              <button
                onClick={() => { setFilters({}); setShowApprovalOnly(false); }}
                className={styles.btnReset}
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                {headers.map((header) => (
                  <th key={header}>{header.replace(/\r\n/g, ' ')}</th>
                ))}
                {showApprovalOnly && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id} className={modifiedRows.has(row.id) ? styles.modified : ''}>
                  {headers.map((header) => {
                    const isEditing = editingCell?.rowId === row.id && editingCell?.header === header;
                    const isLM = isLineManagerCol(header);
                    const isPending = isLM && row.lineManagerStatus === 'pending';

                    return (
                      <td
                        key={`${row.id}-${header}`}
                        onClick={() => handleCellClick(row.id, header)}
                      >
                        {isEditing ? (
                          <input
                            autoFocus
                            value={String(row[header] || "")}
                            onChange={(e) => handleCellChange(row.id, header, e.target.value)}
                            onBlur={() => setEditingCell(null)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setEditingCell(null); }}
                            className={styles.cellInput}
                          />
                        ) : (
                          <div className={styles.cellContent}>
                            <span>{DATE_COLUMNS.includes(header) ? formatDate(row[header]) : String(row[header] || "")}</span>
                            {isPending && (
                              <span className="text-[10px] text-amber-600 font-bold block">
                                → {row.pendingLineManager}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}

                  {showApprovalOnly && (
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprovalAction(row.id, 'approve')}
                          disabled={saving}
                          className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => handleApprovalAction(row.id, 'reject')}
                          disabled={saving}
                          className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                        >
                          ✗
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={headers.length + (showApprovalOnly ? 1 : 0)} className="text-center py-8 text-gray-500">
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination - Server Side */}
        <div className={styles.pagination}>
          <div className="flex items-center justify-between px-4">
            <div className={styles.toolbarInfo}>
              Showing <strong>{filteredRows.length}</strong> of <strong>{ITEMS_PER_PAGE}</strong> per page
              {totalRecords > 0 && <span className="ml-2 text-gray-500">({totalRecords} total)</span>}
            </div>
            <div className="flex items-center gap-2">
              {/* First page */}
              <button
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
                className="p-1.5 border rounded disabled:opacity-30 hover:bg-gray-100"
                title="First page"
              >
                <ChevronDoubleLeftIcon className="w-4 h-4" />
              </button>

              {/* Previous */}
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 border rounded disabled:opacity-30 hover:bg-gray-100"
                title="Previous page"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>

              {/* Page info */}
              <span className="px-3 py-1 bg-gray-100 rounded font-medium">
                {currentPage} / {totalPages}
              </span>

              {/* Next */}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="p-1.5 border rounded disabled:opacity-30 hover:bg-gray-100"
                title="Next page"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>

              {/* Last page */}
              <button
                onClick={() => goToPage(totalPages)}
                disabled={currentPage >= totalPages}
                className="p-1.5 border rounded disabled:opacity-30 hover:bg-gray-100"
                title="Last page"
              >
                <ChevronDoubleRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SheetManager;