'use client';

import { useEffect, useRef, useState, useCallback } from "react";
import OrgChart from "@balkangraph/orgchart.js";
import { useOrgData } from "@/hooks/useOrgData";

const LOAD_URL =
  "https://script.google.com/macros/s/AKfycbzFljc10QGi4ZrXYyzFrrleppT4PMRmfGqCFRqpt2d8Pv93OLeJpcb8QpB8WuKCtuAS/exec";

const Customize = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<any>(null);
  const originalNodesRef = useRef<any[]>([]);
  const { groups } = useOrgData();
  
  const [orgId, setOrgId] = useState<string>("");
  const [orgList, setOrgList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingChart, setLoadingChart] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [creatingOrg, setCreatingOrg] = useState(false);

  /* ================= LOAD ORG LIST ================= */
  useEffect(() => {
    const loadOrgList = async () => {
      try {
        console.log("📦 Loading org list...");
        const response = await fetch(`${LOAD_URL}?action=list`);
        const text = await response.text();
        
        if (!text.startsWith('{')) {
          console.error("❌ Apps Script returned HTML instead of JSON");
          console.error("Response:", text.substring(0, 200));
          setLoading(false);
          return;
        }
        
        const data = JSON.parse(text);
        
        if (data.orgs && Array.isArray(data.orgs)) {
          console.log("✅ Loaded", data.orgs.length, "orgs");
          setOrgList(data.orgs);
          if (data.orgs.length > 0) {
            const firstOrgId = data.orgs[0].org_id;
            setOrgId(firstOrgId);
            console.log("🎯 Default org set to:", firstOrgId);
          }
        } else {
          console.warn("⚠️ No orgs in response");
        }
      } catch (err) {
        console.error("❌ Load org list error:", err);
        alert("❌ Lỗi tải danh sách org");
      } finally {
        setLoading(false);
      }
    };

    loadOrgList();
  }, []);

  /* ================= AUTO-LOAD CHART WHEN ORG CHANGES ================= */
  useEffect(() => {
    if (orgId && !loading) {
      console.log("📊 Auto-loading chart for:", orgId);
      loadChartData(orgId);
    }
  }, [orgId, loading]);

  /* ================= CREATE NEW ORGCHART ================= */
    /* ================= CREATE NEW ORGCHART ================= */
  const handleCreateOrgChart = async () => {
    if (!selectedDept) {
      alert("❌ Vui lòng chọn phòng ban");
      return;
    }

    setCreatingOrg(true);

    try {
      // Step 1: Lấy orgId được chọn
      const sourceOrgId = orgId || (orgList.length > 0 ? orgList[0].org_id : null);
      
      if (!sourceOrgId) {
        alert("❌ Không có org chart nào để sao chép");
        setCreatingOrg(false);
        return;
      }

      console.log("📋 Source org:", sourceOrgId);

      // Step 2: Lấy dữ liệu từ org được chọn
      console.log("📥 Fetching source org data...");
      const sourceResponse = await fetch(`${LOAD_URL}?org_id=${sourceOrgId}`);
      
      if (!sourceResponse.ok) {
        throw new Error(`HTTP ${sourceResponse.status}: Failed to fetch source org`);
      }

      const sourceText = await sourceResponse.text();
      
      if (!sourceText.startsWith('{')) {
        console.error("❌ GAS trả về HTML thay vì JSON:", sourceText.substring(0, 200));
        alert("❌ Lỗi kết nối đến GAS - vui lòng kiểm tra console");
        setCreatingOrg(false);
        return;
      }

      const sourceData = JSON.parse(sourceText);

      if (!sourceData.org_data) {
        alert("❌ Không tìm thấy dữ liệu org chart");
        setCreatingOrg(false);
        return;
      }

      let orgJson;
      try {
        orgJson = typeof sourceData.org_data === 'string' 
          ? JSON.parse(sourceData.org_data)
          : sourceData.org_data;
      } catch (e) {
        console.error("❌ Failed to parse org_data:", e);
        alert("❌ Dữ liệu org không hợp lệ");
        setCreatingOrg(false);
        return;
      }

      if (!Array.isArray(orgJson?.data)) {
        console.error("❌ org_data.data is not an array:", orgJson);
        alert("❌ Dữ liệu không hợp lệ");
        setCreatingOrg(false);
        return;
      }

      console.log("📊 Loaded nodes:", orgJson.data.length);

      // Step 3: Lọc nodes theo phòng ban được chọn
      const deptNodes = filterNodesByDepartment(orgJson.data, selectedDept);
      
      if (deptNodes.length === 0) {
        console.warn("⚠️ No nodes found for department:", selectedDept);
        // Vẫn cho tạo, có thể chỉ cần tạo folder trống
        // alert("❌ Không tìm thấy nodes trong phòng ban này");
        // setCreatingOrg(false);
        // return;
      }

      console.log("🔍 Filtered nodes for dept:", deptNodes.length);

      // Step 4: Tạo org_id mới
      const orgchartAdminOrgs = orgList.filter(org => 
        org.org_id.startsWith("orgchart_admin_")
      );
      
      let newIndex = 1;
      if (orgchartAdminOrgs.length > 0) {
        const numbers = orgchartAdminOrgs.map(org => {
          const match = org.org_id.match(/orgchart_admin_(\d+)/);
          return match ? parseInt(match[1]) : 0;
        });
        newIndex = Math.max(...numbers) + 1;
      }

      const newOrgId = `orgchart_admin_${newIndex}`;
      console.log("✨ New org ID:", newOrgId);

      // Step 5: Gọi API để tạo orgchart mới
      console.log("🚀 Calling create_orgchart API...");
      const createResponse = await fetch("/api/create_orgchart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "admin",
          org_id: newOrgId,
          dept_name: selectedDept,
          org_data: { 
            data: deptNodes.length > 0 ? deptNodes : [] 
          }
        })
      });

      const result = await createResponse.json();
      
      if (!createResponse.ok) {
        console.error("❌ Create API failed:", result);
        alert(`❌ Lỗi tạo org chart: ${result.error || "Unknown error"}`);
        setCreatingOrg(false);
        return;
      }

      console.log("✅ Create API success:", result);

      // Step 6: Reload org list từ GAS
      console.log("🔄 Reloading org list...");
      const listResponse = await fetch(`${LOAD_URL}?action=list`);
      
      if (!listResponse.ok) {
        throw new Error(`HTTP ${listResponse.status}: Failed to fetch org list`);
      }

      const listText = await listResponse.text();
      
      if (!listText.startsWith('{')) {
        console.error("❌ GAS list trả về HTML:", listText.substring(0, 200));
        alert("❌ Lỗi tải danh sách org mới");
        setCreatingOrg(false);
        return;
      }

      const listData = JSON.parse(listText);
      
      if (listData.orgs && Array.isArray(listData.orgs)) {
        console.log("📦 Updated org list:", listData.orgs.length);
        setOrgList(listData.orgs);
        setOrgId(newOrgId);

        // Step 7: Close modal & reset form
        setShowCreateModal(false);
        setSelectedDept("");
        
        // Step 8: Auto-load chart mới đã tạo
        console.log("⏳ Loading new chart:", newOrgId);
        setTimeout(() => {
          loadChartData(newOrgId);
        }, 1000); // Tăng timeout để GAS xử lý xong

        alert(`✅ Tạo orgchart thành công!\nID: ${newOrgId}\nPhòng ban: ${selectedDept}`);
      } else {
        console.warn("⚠️ No orgs in list response, but creation succeeded");
        // Vẫn coi là thành công
        setShowCreateModal(false);
        setSelectedDept("");
        setTimeout(() => {
          loadChartData(newOrgId);
        }, 1000);
        alert(`✅ Tạo orgchart thành công!\nID: ${newOrgId}\nPhòng ban: ${selectedDept}`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.error("❌ Create orgchart error:", errorMsg);
      alert(`❌ Lỗi: ${errorMsg}`);
    } finally {
      setCreatingOrg(false);
    }
  };

  /* ================= FILTER NODES BY DEPARTMENT ================= */
  const filterNodesByDepartment = (allNodes: any[], deptName: string): any[] => {
    if (!Array.isArray(allNodes) || allNodes.length === 0) {
      console.warn("⚠️ allNodes is not a valid array");
      return [];
    }

    const result: any[] = [];
    const visited = new Set();

    // Tìm node gốc của phòng ban (có thể là name hoặc title)
    const rootNode = allNodes.find((n: any) => 
      (n && (n.name === deptName || n.title === deptName))
    );

    if (!rootNode) {
      console.warn("⚠️ Root node not found for department:", deptName);
      console.log("Available nodes:", allNodes.slice(0, 5).map(n => ({ id: n?.id, name: n?.name, title: n?.title })));
      return [];
    }

    console.log("🎯 Found root node:", { id: rootNode.id, name: rootNode.name });

    const collectNode = (nodeId: any) => {
      if (!nodeId || visited.has(nodeId)) return;
      visited.add(nodeId);

      const node = allNodes.find((n: any) => n && n.id == nodeId);
      if (node) {
        result.push({
          ...node,
          tags: Array.isArray(node.tags) 
            ? node.tags 
            : (node.tags ? [node.tags] : []),
        });

        // Tìm tất cả children (pid = nodeId)
        const children = allNodes.filter((n: any) => n && n.pid == nodeId);
        console.log(`  Children of ${nodeId}:`, children.length);
        children.forEach((child: any) => collectNode(child.id));
      }
    };

    collectNode(rootNode.id);
    console.log(`✅ Collected ${result.length} nodes for department ${deptName}`);
    return result;
  };

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

      const response = await fetch("/api/save_data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: orgId,
          org_data: { data: allNodes }
        })
      });

      const result = await response.json();
      
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
    if (!selectedOrgId) {
      console.warn("⚠️ No org ID provided");
      return;
    }

    console.log("🔄 Loading chart data for:", selectedOrgId);
    setLoadingChart(true);
    
    try {
      const response = await fetch(`${LOAD_URL}?org_id=${selectedOrgId}`);
      const text = await response.text();
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${text.substring(0, 100)}`);
      }
      
      if (!text.startsWith('{')) {
        console.error("❌ GAS returned HTML instead of JSON");
        console.error("Response:", text.substring(0, 300));
        alert("❌ Lỗi kết nối GAS - vui lòng kiểm tra console");
        return;
      }

      const res = JSON.parse(text);

      if (!res.org_data) {
        console.warn("⚠️ No org_data in response:", res);
        alert("❌ Không tìm thấy dữ liệu org chart");
        return;
      }

      const orgJson = JSON.parse(res.org_data);
      
      if (!Array.isArray(orgJson.data)) {
        console.error("❌ org_data.data is not an array:", orgJson);
        alert("❌ Dữ liệu không hợp lệ");
        return;
      }

      console.log("📊 Loaded", orgJson.data.length, "nodes");
      originalNodesRef.current = orgJson.data;

      const chartNodes = orgJson.data.map((n: any) => ({
        ...n,
        tags: Array.isArray(n.tags) ? n.tags : (n.tags ? [n.tags] : []),
        img: n.img || n.photo || "",
      }));

      // Destroy previous chart instance
      if (chartInstance.current) {
        try {
          chartInstance.current.destroy();
          chartInstance.current = null;
        } catch (e) {
          console.warn("⚠️ Error destroying previous chart:", e);
        }
      }

      // Create new chart
      if (!chartRef.current) {
        console.error("❌ chartRef.current is null");
        alert("❌ Lỗi: Không thể render chart");
        return;
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
      console.log("✅ Chart loaded successfully");

      // Add event listeners
      chartInstance.current.on('update', () => {
        console.log("📝 Chart updated");
        setHasChanges(true);
      });

      chartInstance.current.on('drop', () => {
        console.log("📍 Node dropped");
        setHasChanges(true);
      });

      chartInstance.current.on('remove', () => {
        console.log("🗑️ Node removed");
        setHasChanges(true);
      });

    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("❌ Load chart error:", message);
      alert(`❌ Lỗi tải chart: ${message}`);
    } finally {
      setLoadingChart(false);
    }
  };

  if (loading) {
    return <div style={{ width: "100%", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading...</div>;
  }

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      {/* LEFT TOOLBAR */}
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
          onClick={() => loadChartData(orgId)}
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

        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: "8px 16px",
            background: "#f59e0b",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "14px"
          }}
        >
          ➕ Tạo mới
        </button>
      </div>

      {/* RIGHT TOOLBAR */}
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

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "24px",
              borderRadius: 8,
              minWidth: "400px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
            }}
          >
            <h2 style={{ marginTop: 0, color: "#333", marginBottom: "16px" }}>
              Tạo Orgchart Mới từ Phòng Ban
            </h2>
            
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
                Chọn phòng ban:
              </label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: 4,
                  border: "1px solid #ddd",
                  fontSize: "14px",
                  boxSizing: "border-box"
                }}
              >
                <option value="">-- Chọn phòng ban --</option>
                {groups.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {selectedDept && (
              <div style={{ 
                background: "#f0f9ff", 
                padding: "8px 12px", 
                borderRadius: 4,
                marginBottom: "16px",
                fontSize: "13px",
                color: "#0c4a6e"
              }}>
                📋 Sẽ tạo: <strong>orgchart_admin_X</strong> với tất cả nodes từ <strong>{selectedDept}</strong>
              </div>
            )}

            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedDept("");
                }}
                disabled={creatingOrg}
                style={{
                  padding: "8px 16px",
                  background: "#9ca3af",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleCreateOrgChart}
                disabled={creatingOrg || !selectedDept}
                style={{
                  padding: "8px 16px",
                  background: creatingOrg || !selectedDept ? "#9ca3af" : "#10b981",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: creatingOrg || !selectedDept ? "not-allowed" : "pointer",
                  fontWeight: "bold"
                }}
              >
                {creatingOrg ? "Đang tạo..." : "Tạo"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div ref={chartRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

export default Customize;
