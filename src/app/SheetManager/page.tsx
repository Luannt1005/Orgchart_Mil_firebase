'use client';

import { useEffect, useState, useCallback } from "react";
import styles from "./sheet.module.css";

interface SheetRow {
  _id: number;
  [key: string]: any;
}

interface EditingCell {
  rowId: number;
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
  "Joining Date",
  "FullName",
  "Job Title",
  "DL/IDL/Staff",
  "Employee Type",
  "Status",
  "Location",
  "Last Working Day",
  "Employee Category"
];

// Các cột là ngày tháng
const DATE_COLUMNS = ["Joining Date", "Last Working Day"];

// Các cột cần filter
const FILTER_COLUMNS = [
  "Emp ID",
  "Dept",
  "BU Org 3",
  "FullName",
  "DL/IDL/Staff"
];

// Hàm format ngày từ ISO sang DD/MM/YYYY
const formatDate = (value: any): string => {
  if (!value) return "";
  
  try {
    // Nếu là ISO format (2024-01-02T08:00:00.000Z)
    if (typeof value === 'string' && value.includes('T')) {
      const date = new Date(value);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
    
    // Nếu là DD/MM/YYYY rồi thì giữ nguyên
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
    // Nếu đã là ISO thì giữ nguyên
    if (value.includes('T')) {
      return value;
    }
    
    // Nếu là DD/MM/YYYY thì convert sang ISO
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

  // Filter states
  const [filters, setFilters] = useState<{ [key: string]: string }>({});
  const [searchText, setSearchText] = useState("");

  // Edit states
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [modifiedRows, setModifiedRows] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/sheet?action=get");
      const result = await response.json();

      if (result.success) {
        // Lọc chỉ các cột cần hiển thị
        const visibleHeaders = result.headers.filter((h: string) =>
          VISIBLE_COLUMNS.includes(h)
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
  };

  // Filter rows
  const filteredRows = rows.filter((row) => {
    // Column filters
    for (const [header, filterValue] of Object.entries(filters)) {
      if (filterValue && String(row[header]).toLowerCase() !== filterValue.toLowerCase()) {
        return false;
      }
    }

    return true;
  });

  // Handle cell click to edit
  const handleCellClick = (rowId: number, header: string) => {
    setEditingCell({ rowId, header });
  };

  // Handle cell value change
  const handleCellChange = (rowId: number, header: string, value: string) => {
    setRows((prev) =>
      prev.map((row) =>
        row._id === rowId ? { ...row, [header]: value } : row
      )
    );

    // Mark row as modified
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

  // Call Sync API (qua Next.js API route để tránh CORS)
  const callSyncApi = async () => {
    try {
      console.log("Calling sync API via Next.js route...");
      const response = await fetch("/api/sheet", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });
      const result = await response.json();
      console.log("Sync API result:", result);
      return result.success;
    } catch (err) {
      console.error("Sync API error:", err);
      return false;
    }
  };

  // Delete row
  const handleDelete = async (rowId: number) => {
    if (!confirm("Are you sure?")) return;

    try {
      const response = await fetch("/api/sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          rowId: rowId - 1,
        }),
      });

      const result = await response.json();

      if (result.success) {
        await loadData();
        setSuccessMessage("✅ Deleted successfully");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        alert("❌ " + (result.error || "Error"));
      }
    } catch (err) {
      alert("❌ " + (err instanceof Error ? err.message : "Error"));
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
        const row = rows.find((r) => r._id === rowId);
        if (!row) continue;

        // Loại bỏ _id, chỉ gửi data từ headers
        const dataToSave: { [key: string]: any } = {};
        headers.forEach((header) => {
          let value = row[header] || "";
          
          // Nếu là cột ngày tháng, convert từ DD/MM/YYYY sang ISO
          if (DATE_COLUMNS.includes(header)) {
            value = formatDateToISO(value);
          }
          
          dataToSave[header] = value;
        });

        console.log("Saving row:", { rowId, data: dataToSave });

        const response = await fetch("/api/sheet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update",
            rowId: rowId - 1,
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
        setSuccessMessage(`✅ Saving ${successCount} row(s)...`);
        
        // Call sync API
        const syncSuccess = await callSyncApi();
        
        if (syncSuccess) {
          setSuccessMessage(`✅ Saved ${successCount} row(s) & synced successfully`);
        } else {
          setSuccessMessage(`✅ Saved ${successCount} row(s) (sync had an issue)`);
        }
        
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
          onClick={() => {
            setFilters({});
            setSearchText("");
          }}
          className={styles.btnReset}
        >
          🔄 Clear Filters
        </button>
      </div>

      {/* TOOLBAR */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarInfo}>
          Showing <strong>{filteredRows.length}</strong> of{" "}
          <strong>{rows.length}</strong> rows
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
              <th style={{ width: "80px" }}>Action</th>
              {headers.map((header) => (
                <th key={header} style={{ minWidth: "150px" }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr
                key={row._id}
                className={modifiedRows.has(row._id) ? styles.modified : ""}
              >
                <td className={styles.actionCell}>
                  <button
                    onClick={() => handleDelete(row._id)}
                    className={styles.btnDelete}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </td>
                {headers.map((header) => (
                  <td
                    key={`${row._id}-${header}`}
                    onClick={() => handleCellClick(row._id, header)}
                  >
                    {editingCell?.rowId === row._id &&
                    editingCell?.header === header ? (
                      <input
                        autoFocus
                        type="text"
                        value={String(row[header] || "")}
                        onChange={(e) =>
                          handleCellChange(row._id, header, e.target.value)
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

      <div className={styles.pagination}>
        💡 Click on any cell to edit. Changes are marked in yellow until saved.
      </div>
    </div>
  );
};

export default SheetManager;
