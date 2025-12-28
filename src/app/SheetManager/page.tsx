'use client';

import { useEffect, useState, useCallback } from "react";
import styles from "./sheet.module.css";

interface SheetRow {
  id: string;
  [key: string]: any;
}

interface EditingCell {
  rowId: string;
  header: string;
}

// Các cột cần hiển thị
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

// Các cột là ngày tháng
const DATE_COLUMNS = ["Joining\n Date", "Last Working Day"];

// Các cột cần filter
const FILTER_COLUMNS = [
  "Emp ID",
  "Dept",
  "BU Org 3",
  "FullName ",
  "DL/IDL/Staff"
];

// Normalize field name (remove invalid characters for Firestore)
const normalizeFieldName = (fieldName: string): string => {
  return fieldName.replace(/[~*\/\[\]]/g, '_');
};

// Reverse normalize (để hiển thị lại)
const denormalizeFieldName = (fieldName: string): string => {
  const mapping: { [key: string]: string } = {
    'DL_IDL_Staff': 'DL/IDL/Staff',
  };
  return mapping[fieldName] || fieldName;
};

// Hàm format ngày từ ISO sang DD/MM/YYYY
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

// Hàm format ngày từ DD/MM/YYYY sang ISO (khi lưu)
const formatDateToISO = (value: string): string => {
  if (!value) return "";
  
  try {
    if (value.includes('T')) {
      return value;
    }
    
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

const SheetManager = () => {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<SheetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  // Filter states
  const [filters, setFilters] = useState<{ [key: string]: string }>({});

  // Edit states
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [modifiedRows, setModifiedRows] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/sheet");
      const result = await response.json();

      if (result.success) {
        // Log tất cả headers để xem tên thực tế
        console.log("All available headers:", result.headers);
        
        const visibleHeaders = result.headers.filter((h: string) =>
          VISIBLE_COLUMNS.includes(h) || VISIBLE_COLUMNS.includes(denormalizeFieldName(h))
        );
        setHeaders(visibleHeaders);
        setRows(result.data || []);
        setModifiedRows(new Set());
      } else {
        setError(result.error || "Failed to load data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle filter change
  const handleFilterChange = (header: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [header]: value,
    }));
    setCurrentPage(1);
  };

  // Filter rows
  const filteredRows = rows.filter((row) => {
    for (const [header, filterValue] of Object.entries(filters)) {
      if (filterValue && String(row[header]).toLowerCase() !== filterValue.toLowerCase()) {
        return false;
      }
    }
    return true;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredRows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRows = filteredRows.slice(startIndex, endIndex);

  // Handle cell click to edit
  const handleCellClick = (rowId: string, header: string) => {
    setEditingCell({ rowId, header });
  };

  // Handle cell value change
  const handleCellChange = (rowId: string, header: string, value: string) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === rowId ? { ...row, [header]: value } : row
      )
    );
    setModifiedRows((prev) => new Set([...prev, rowId]));
  };

  // Handle cell blur (stop editing)
  const handleCellBlur = () => {
    setEditingCell(null);
  };

  // Handle key press in cell
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setEditingCell(null);
    } else if (e.key === "Escape") {
      setEditingCell(null);
    }
  };

  // Save all modified rows
  const handleSaveAll = async () => {
    if (modifiedRows.size === 0) {
      alert("❌ No changes to save");
      return;
    }

    setSaving(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const rowId of modifiedRows) {
        const row = rows.find((r) => r.id === rowId);
        if (!row) continue;

        const dataToSave: { [key: string]: any } = {};
        headers.forEach((header) => {
          let value = row[header] || "";
          
          if (DATE_COLUMNS.includes(header)) {
            value = formatDateToISO(value);
          }
          
          const normalizedHeader = normalizeFieldName(header);
          dataToSave[normalizedHeader] = value;
        });

        console.log("Saving row:", { rowId, data: dataToSave });

        const response = await fetch("/api/sheet", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: rowId,
            data: dataToSave,
          }),
        });

        const result = await response.json();
        console.log("Save result:", result);
        
        if (result.success) {
          successCount++;
        } else {
          console.error("Save failed:", result.error);
          errorCount++;
        }
      }

      if (errorCount === 0) {
        setModifiedRows(new Set());
        
        // Sync to Orgchart_data
        try {
          console.log("Syncing to Orgchart_data...");
          const syncResponse = await fetch("/api/sync-orgchart", {
            method: "POST"
          });
          const syncResult = await syncResponse.json();
          console.log("Sync result:", syncResult);
          
          if (syncResult.success) {
            setSuccessMessage(`✅ Saved ${successCount} row(s) and synced to Orgchart`);
          } else {
            setSuccessMessage(`✅ Saved ${successCount} row(s) but sync failed`);
          }
        } catch (syncErr) {
          console.error("Sync error:", syncErr);
          setSuccessMessage(`✅ Saved ${successCount} row(s) but sync failed`);
        }
        
        await loadData();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        alert(`⚠️ Saved ${successCount} rows, ${errorCount} failed`);
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("❌ " + (err instanceof Error ? err.message : "Error"));
    } finally {
      setSaving(false);
    }
  };

  // Add new row
  const handleAddRow = async () => {
    const newRow: { [key: string]: string } = {};
    headers.forEach((h) => {
      newRow[h] = "";
    });

    console.log("Adding row:", newRow);

    try {
      const response = await fetch("/api/sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          data: newRow,
        }),
      });

      const result = await response.json();
      console.log("Add result:", result);

      if (result.success) {
        await loadData();
        setSuccessMessage("✅ Row added successfully");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        alert("❌ " + (result.error || "Error"));
      }
    } catch (err) {
      console.error("Add error:", err);
      alert("❌ " + (err instanceof Error ? err.message : "Error"));
    }
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  // Handle pagination
  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handleGoToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.spinner}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>❌ {error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <div className={styles.header}>
        <h1>📊 Sheet Manager</h1>
        <button onClick={handleAddRow} className={styles.btnCreate}>
          ➕ Add New Row
        </button>
      </div>

      {/* SUCCESS MESSAGE */}
      {successMessage && (
        <div className={styles.successMessage}>{successMessage}</div>
      )}

      {/* FILTERS */}
      <div className={styles.filterBox}>
        <div className={styles.filterRow}>
          {headers.filter(h => FILTER_COLUMNS.includes(h)).map((header) => (
            <div key={header} className={styles.filterInputWrapper}>
              <label className={styles.filterLabel}>{header}</label>
              <input
                type="text"
                placeholder={`Filter...`}
                value={filters[header] || ""}
                onChange={(e) => handleFilterChange(header, e.target.value)}
                className={styles.filterInput}
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleClearFilters}
          className={styles.btnReset}
        >
          🔄 Clear Filters
        </button>
      </div>

      {/* TOOLBAR */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarInfo}>
          Showing <strong>{paginatedRows.length}</strong> of{" "}
          <strong>{filteredRows.length}</strong> rows (Page{" "}
          <strong>{currentPage}</strong> of <strong>{totalPages || 1}</strong>)
          {modifiedRows.size > 0 && (
            <span style={{ marginLeft: "20px", color: "#f59e0b" }}>
              • <strong>{modifiedRows.size}</strong> unsaved changes
            </span>
          )}
        </div>
        {modifiedRows.size > 0 && (
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className={styles.btnSaveAll}
          >
            {saving ? "💾 Saving..." : "💾 Save All Changes"}
          </button>
        )}
      </div>

      {/* TABLE */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header} style={{ minWidth: "150px" }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row) => (
              <tr
                key={row.id}
                className={modifiedRows.has(row.id) ? styles.modified : ""}
              >
                {headers.map((header) => (
                  <td
                    key={`${row.id}-${header}`}
                    onClick={() => handleCellClick(row.id, header)}
                  >
                    {editingCell?.rowId === row.id &&
                    editingCell?.header === header ? (
                      <input
                        autoFocus
                        type="text"
                        value={String(row[header] || "")}
                        onChange={(e) =>
                          handleCellChange(row.id, header, e.target.value)
                        }
                        onBlur={handleCellBlur}
                        onKeyDown={handleKeyDown}
                        className={styles.cellInput}
                      />
                    ) : (
                      <div className={styles.cellContent}>
                        {DATE_COLUMNS.includes(header)
                          ? formatDate(row[header])
                          : String(row[header] || "")}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className={styles.pagination}>
        <button
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
          className={styles.btnPagination}
        >
          ← Previous
        </button>
        <span style={{ margin: "0 15px", fontWeight: "bold" }}>
          Page {currentPage} of {totalPages || 1}
        </span>
        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPages || totalPages === 0}
          className={styles.btnPagination}
        >
          Next →
        </button>
      </div>

      <div className={styles.paginationInfo}>
        💡 Click on any cell to edit. Changes are marked in yellow until saved.
      </div>
    </div>
  );
};

export default SheetManager;