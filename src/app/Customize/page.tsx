'use client';

import { useEffect, useRef, useState, useCallback } from "react";
import OrgChart from "@balkangraph/orgchart.js";

const LOAD_URL =
  "https://script.google.com/macros/s/AKfycbzFljc10QGi4ZrXYyzFrrleppT4PMRmfGqCFRqpt2d8Pv93OLeJpcb8QpB8WuKCtuAS/exec";

const Customize = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<any>(null);
  const originalNodesRef = useRef<any[]>([]);
  
  const [orgId, setOrgId] = useState<string>("");
  const [orgList, setOrgList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingChart, setLoadingChart] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  /* ================= LOAD ORG LIST ================= */
  useEffect(() => {
    const loadOrgList = async () => {
      try {
        const response = await fetch(`${LOAD_URL}?action=list`);
        const data = await response.json();
        
        if (data.orgs && Array.isArray(data.orgs)) {
          setOrgList(data.orgs);
          if (data.orgs.length > 0) {
            setOrgId(data.orgs[0].org_id);
          }
        }
      } catch (err) {
        console.error("Load org list error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadOrgList();
  }, []);

  /* ================= SAVE ================= */
  const saveData = useCallback(async () => {
    if (!chartInstance.current || isSaving || !orgId) return;

    setIsSaving(true);

    try {
      const chart = chartInstance.current;
      
      const allNodes = originalNodesRef.current.map((originalNode: any) => {
        const currentNode = chart.get(originalNode.id);
        
        if (currentNode) {
          return {
            ...originalNode,
            pid: currentNode.pid || originalNode.pid || '',
            ppid: currentNode.ppid || originalNode.ppid || '',
            stpid: currentNode.stpid || originalNode.stpid || '',
            name: currentNode.name || originalNode.name || '',
            title: currentNode.title || originalNode.title || '',
            photo: currentNode.photo || originalNode.photo || '',
            img: currentNode.img || originalNode.img || '',
            tags: Array.isArray(currentNode.tags) ? currentNode.tags : (currentNode.tags ? [currentNode.tags] : []),
            ...Object.keys(originalNode).reduce((acc: any, key: string) => {
              if (!['id', 'pid', 'ppid', 'stpid', 'name', 'title', 'photo', 'img', 'tags'].includes(key)) {
                acc[key] = originalNode[key];
              }
              return acc;
            }, {})
          };
        }
        return originalNode;
      });

      console.log("Saving all nodes:", allNodes);

      const response = await fetch("/api/save_data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: orgId,
          org_data: { data: allNodes }
        })
      });

      const result = await response.json();
      console.log("Save response:", result);
      
      if (response.ok && result.success) {
        const now = new Date().toLocaleTimeString('vi-VN');
        setLastSaveTime(now);
        setHasChanges(false);
        alert("✅ Đã lưu thành công");
      } else {
        console.error("Save failed:", result);
        alert("❌ Lỗi khi lưu dữ liệu");
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("❌ Lỗi kết nối");
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, orgId]);

  /* ================= LOAD CHART DATA ================= */
  const loadChartData = async (selectedOrgId: string) => {
    if (!selectedOrgId) return;

    setLoadingChart(true);
    try {
      const response = await fetch(`${LOAD_URL}?org_id=${selectedOrgId}`);
      const res = await response.json();

      if (!res.org_data || !chartRef.current) {
        alert("❌ Không tìm thấy dữ liệu");
        setLoadingChart(false);
        return;
      }

      const orgJson = JSON.parse(res.org_data);
      console.log("Loaded org data:", orgJson);

      originalNodesRef.current = orgJson.data;

      const chartNodes = orgJson.data.map((n: any) => ({
        ...n,
        tags: Array.isArray(n.tags) ? n.tags : (n.tags ? [n.tags] : []),
        img: n.img || n.photo || "",
      }));

      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      chartInstance.current = new OrgChart(chartRef.current, {
        template: "olivia",
        enableDragDrop: true,
        nodeBinding: {
          field_0: "name",
          field_1: "title",
          img_0: "photo"
        },
      });

      chartInstance.current.load(chartNodes);
      setHasChanges(false);

      chartInstance.current.on('update', () => {
        console.log("Chart updated");
        setHasChanges(true);
      });

      chartInstance.current.on('drop', () => {
        console.log("Node dropped");
        setHasChanges(true);
      });

      chartInstance.current.on('remove', () => {
        console.log("Node removed");
        setHasChanges(true);
      });
    } catch (err) {
      console.error("Load error", err);
      alert("❌ Lỗi khi tải dữ liệu");
    } finally {
      setLoadingChart(false);
    }
  };

  const handleLoadClick = () => {
    loadChartData(orgId);
  };

  if (loading) {
    return <div style={{ width: "100%", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading...</div>;
  }

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 10,
          display: "flex",
          gap: "8px",
          alignItems: "center",
          background: "#f3f4f6",
          padding: "8px 12px",
          borderRadius: 6
        }}
      >
        <select
          value={orgId}
          onChange={(e) => setOrgId(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: 4,
            border: "1px solid #ddd",
            fontSize: "14px",
            fontWeight: "bold",
            minWidth: "200px"
          }}
        >
          {orgList.map((org) => (
            <option key={org.org_id} value={org.org_id}>
              {org.username} - {org.org_id}
            </option>
          ))}
        </select>

        <button
          onClick={handleLoadClick}
          disabled={loadingChart}
          style={{
            padding: "8px 16px",
            background: loadingChart ? "#9ca3af" : "#10b981",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: loadingChart ? "not-allowed" : "pointer",
            fontWeight: "bold",
            fontSize: "14px"
          }}
        >
          {loadingChart ? "Đang tải..." : "Load"}
        </button>
      </div>

      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 10,
          display: "flex",
          gap: "10px",
          alignItems: "center",
          background: "#f3f4f6",
          padding: "8px 12px",
          borderRadius: 6
        }}
      >
        {lastSaveTime && (
          <span style={{ fontSize: "12px", color: "#666" }}>
            💾 {lastSaveTime}
          </span>
        )}
        {hasChanges && (
          <span style={{ fontSize: "12px", color: "#ea8c55" }}>
            ⚠️ Chưa lưu
          </span>
        )}
        <button
          onClick={() => saveData()}
          disabled={isSaving}
          style={{
            padding: "8px 16px",
            background: isSaving ? "#9ca3af" : "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: isSaving ? "not-allowed" : "pointer",
            fontWeight: "bold"
          }}
        >
          {isSaving ? "Đang lưu..." : "Cập nhật"}
        </button>
      </div>

      <div ref={chartRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

export default Customize;
