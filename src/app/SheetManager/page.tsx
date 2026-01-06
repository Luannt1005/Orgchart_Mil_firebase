'use client';

import { useEffect, useState, useCallback, useRef, useMemo, startTransition } from "react";
import {
  PlusIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckIcon,
  NoSymbolIcon,
  ClockIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";
import styles from "./sheet.module.css";

interface SheetRow {
  id: string;
  [key: string]: any;
}

interface EditingCell {
  rowId: string;
  header: string;
}

const VISIBLE_COLUMNS = [
  "Emp ID",
  "BU",
  "BU Org 2",
  "BU Org 3",
  "Dept",
  "Line Manager",
  "Cost Center",
  "Joining\r\n Date",
  "FullName ",
  "Job Title",
  "DL/IDL/Staff",
  "Employee\r\n Type",
  "Status",
  "Location",
  "Last Working\r\nDay",
  "Employee Category"
];

const DATE_COLUMNS = ["Joining\r\n Date", "Last Working\r\nDay"];

const FILTER_COLUMNS = [
  "Emp ID",
  "Dept",
  "BU Org 3",
  "FullName ",
  "DL/IDL/Staff"
];

// Helper to normalize field name for Firestore
const normalizeFieldName = (fieldName: string): string => {
  return fieldName.replace(/[~*\/\[\]]/g, '_');
};

const denormalizeFieldName = (fieldName: string): string => {
  const mapping: { [key: string]: string } = {
    'DL_IDL_Staff': 'DL/IDL/Staff',
  };
  return mapping[fieldName] || fieldName;
};

// Flexible helper to identify Line Manager column
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
  } catch (e) {
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
  } catch (e) {
    return value;
  }
};

interface SheetManagerProps {
  initialShowApprovalOnly?: boolean;
  enableApproval?: boolean;
}

import useSWR from 'swr';
import { swrFetcher } from '@/lib/api-client';

const SheetManager = ({ initialShowApprovalOnly = false, enableApproval = false }: SheetManagerProps) => {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<SheetRow[]>([]);
  const [originalRows, setOriginalRows] = useState<SheetRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const [filters, setFilters] = useState<{ [key: string]: string }>({});
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [modifiedRows, setModifiedRows] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);
  const [showApprovalOnly, setShowApprovalOnly] = useState(initialShowApprovalOnly);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Use SWR for data fetching with suspense-like behavior
  const { data: apiResult, error: swrError, mutate, isLoading } = useSWR('/api/sheet', swrFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000,
    revalidateIfStale: false,
    keepPreviousData: true, // Keep showing old data while revalidating
  });

  // Sync SWR data to local state - using startTransition to prevent blocking
  useEffect(() => {
    if (apiResult?.success && modifiedRows.size === 0) {
      // Use startTransition to mark this as non-urgent update
      startTransition(() => {
        const visibleHeaders = apiResult.headers.filter((h: string) =>
          VISIBLE_COLUMNS.includes(h) || VISIBLE_COLUMNS.includes(denormalizeFieldName(h))
        );
        setHeaders(visibleHeaders);
        setRows(apiResult.data || []);

        // Lazy deep clone - defer to next tick to avoid blocking
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

  const handleFilterChange = (header: string, value: string) => {
    setFilters((prev) => ({ ...prev, [header]: value }));
    setCurrentPage(1);
  };

  const pendingApprovals = useMemo(() => {
    return rows.filter(row => row.lineManagerStatus === 'pending');
  }, [rows]);

  const filteredRows = useMemo(() => {
    let result = rows;

    if (showApprovalOnly) {
      result = pendingApprovals;
    }

    return result.filter((row) => {
      for (const [header, filterValue] of Object.entries(filters)) {
        if (filterValue && !String(row[header] || "").toLowerCase().includes(filterValue.toLowerCase())) {
          return false;
        }
      }
      return true;
    });
  }, [rows, filters, showApprovalOnly, pendingApprovals]);

  const totalPages = Math.ceil(filteredRows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRows = filteredRows.slice(startIndex, startIndex + itemsPerPage);

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
    setCurrentPage(1);

    // Auto-edit first cell
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
        // For new rows, we use an empty object as originalRow
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

          // Rule: Line Manager changes require approval
          if (isLineManagerCol(header) && value !== originalValue) {
            dataToSave["pendingLineManager"] = value;
            dataToSave["lineManagerStatus"] = "pending";
            // Important: We do NOT update the main "Line Manager" field here
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

      setSuccessMessage(`Successfully processed ${successCount} records. Check 'Review Changes' for LM updates.`);
      setModifiedRows(new Set()); // Clear modified rows so we can accept new data
      await mutate(); // Refresh SWR cache
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
        // Sync to Orgchart if approved
        if (action === 'approve') {
          await fetch("/api/sync-orgchart", { method: "POST" });
        }
        setSuccessMessage(action === 'approve' ? "Changes approved and database updated." : "Request rejected successfully.");
        await mutate();
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError("Approval error occurred.");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading && rows.length === 0) {
    return (
      <div className={styles.spinner}>
        <ArrowPathIcon className="w-12 h-12 text-[#DB011C] animate-spin mx-auto mb-4" />
        <span>Syncing Registry...</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className="flex items-center gap-4">
          <ShieldCheckIcon className="w-8 h-8 text-[#DB011C]" />
          <h1>Milwaukee Tool HR Registry</h1>
        </div>
        <div className="flex items-center gap-3">
          {enableApproval && (
            <button
              onClick={() => setShowApprovalOnly(!showApprovalOnly)}
              className={`${styles.btnReset} flex items-center gap-2`}
              style={{ backgroundColor: showApprovalOnly ? '#f59e0b' : '#6c757d' }}
            >
              <ClockIcon className="w-4 h-4" />
              {showApprovalOnly ? 'Hide Requests' : 'Review Changes'}
              {pendingApprovals.length > 0 && !showApprovalOnly && (
                <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 rounded-full">
                  {pendingApprovals.length}
                </span>
              )}
            </button>
          )}

          <button
            onClick={handleAddRow}
            className={styles.btnCreate}
          >
            <PlusIcon className="w-4 h-4 inline mr-1" />
            Add Entry
          </button>

          <button
            onClick={handleSaveAll}
            disabled={saving || modifiedRows.size === 0}
            className={styles.btnSaveAll}
          >
            {saving ? <ArrowPathIcon className="w-4 h-4 animate-spin inline mr-1" /> : <ArrowDownTrayIcon className="w-4 h-4 inline mr-1" />}
            Save Changes ({modifiedRows.size})
          </button>
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
            {headers.filter(h => FILTER_COLUMNS.includes(h)).map((header) => (
              <div key={header} className={styles.filterInputWrapper}>
                <label className={styles.filterLabel}>{header}</label>
                <input
                  type="text"
                  placeholder={`Search ${header}...`}
                  value={filters[header] || ""}
                  onChange={(e) => handleFilterChange(header, e.target.value)}
                  className={styles.filterInput}
                />
              </div>
            ))}
          </div>
          <button
            onClick={() => { setFilters({}); setShowApprovalOnly(false); }}
            className={styles.btnReset}
          >
            Clear Filters
          </button>
        </div>

        {/* Table Container */}
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
              {paginatedRows.map((row) => (
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
                            <div className="flex flex-col">
                              <span>{DATE_COLUMNS.includes(header) ? formatDate(row[header]) : String(row[header] || "")}</span>
                              {isPending && (
                                <span className="text-[10px] text-amber-600 font-bold mt-1">
                                  Request: {row.pendingLineManager}
                                </span>
                              )}
                            </div>
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
                          className="px-2 py-1 bg-green-500 text-white rounded text-xs"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleApprovalAction(row.id, 'reject')}
                          disabled={saving}
                          className="px-2 py-1 bg-red-500 text-white rounded text-xs"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className={styles.pagination}>
          <div className="flex items-center justify-between px-4">
            <div className={styles.toolbarInfo}>
              Total Records: <strong>{filteredRows.length}</strong>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 border rounded disabled:opacity-30"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <span>Page {currentPage} of {totalPages || 1}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-1 border rounded disabled:opacity-30"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SheetManager;