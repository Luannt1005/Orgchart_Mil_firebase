"use client";

import { useEffect, useRef, useState } from "react";
import OrgChart from "@balkangraph/orgchart.js";
import { useFilteredOrgData, useRevalidateOrgData } from "@/hooks/useOrgData";
import { apiClient } from "@/lib/api-client";
import { UPDATE_NODE_API, REMOVE_NODE_API, ADD_DEPARTMENT_API } from "@/constant/api";
import { patchOrgChartTemplates } from "./OrgChartTemplates";
import LoadingScreen from "@/components/loading-screen";
import "./OrgChart.css";

interface OrgChartProps {
  selectedGroup?: string;
}

export default function OrgChartView({ selectedGroup }: OrgChartProps) {
  const treeRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  // Use cached global data instead of fetching
  const { nodes, loading } = useFilteredOrgData(selectedGroup);
  const { revalidate } = useRevalidateOrgData();

//    Listen for Ctrl key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!chartRef.current || chartRef.current.enableDragDrop) return;
            chartRef.current.config.enableDragDrop = true;
            // chartRef.current.draw();
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (!chartRef.current) return;
            chartRef.current.config.enableDragDrop = false;
            // chartRef.current.draw();
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

//   Update chart dragDrop when state changes
//   useEffect(() => {
//     if (chartRef.current) {
//       console.log(`📊 Chart dragDrop updated: ${enableDragDrop ? "ENABLED" : "DISABLED"}`);
//       chartRef.current.config.enableDragDrop = enableDragDrop;
//       chartRef.current.draw();
//     }
//   }, [enableDragDrop]);

  const addDepartment = async (nodeId: string) => {
    const chart = chartRef.current;
    if (!chart) return;

     const node = chart.getNode(nodeId);
    
    try {
      const data = {
        id: OrgChart.randomId(),
        pid: nodeId,
        name: "New Department",
        tags: ["group"],
      };

      console.log("Adding department:", data);
      chart.addNode(data);
      const response = await apiClient.post(ADD_DEPARTMENT_API, data);
      console.log("Add department response:", response);
      
      // Revalidate cached data after mutation
      await revalidate();
    } catch (error) {
      console.error("Failed to add department:", error);
      alert("Failed to add department. Check console for details.");
    }
  };

  useEffect(() => {
    const el = treeRef.current;
    if (!el || loading || nodes.length === 0) return;

    patchOrgChartTemplates();

    const chartNodes = nodes.map((n: any) => ({
      ...n,
      tags: Array.isArray(n.tags) ? n.tags : n.tags ? [n.tags] : [],
      img: n.img || n.photo || "",
    }));

    const chart = new OrgChart(el, {
      mouseScrool: OrgChart.none,
      collapse: { level: 1, allChildren: true },
      scaleInitial: 1,
      enableSearch: true,
      enableAI: false,
      enableDragDrop: false,
      layout: OrgChart.normal,
      template: "big",
      filterBy: {
        type: {},
      },
      nodeBinding: {
        imgs: "img",
        field_0: "name",
        field_1: "title",
        img_0: "img",
      },
      nodeMenu: {
        addDepartment: {
          text: "Add new department",
          icon: OrgChart.icon.add(24, 24, "#7A7A7A"),
          onClick: addDepartment,
        },
        edit: { text: "Edit" },
        details: { text: "Details" },
        add: { text: "Add" },
        remove: { text: "Remove" },
      },
      editForm: {
        cancelBtn: "Close",
        saveAndCloseBtn: "Save",
      },
      tags: {
        group: {
          template: "group",
        },
        filter: {
          template: "dot",
        },
      },
    });

    // Handle node update event
    chart.on("update", (sender, args) => {
      if (!args || !args.id) {
        console.error("Update event: args invalid", args);
        return;
      }

      setTimeout(async () => {
        const node = sender.get(args.id);
        if (!node || !node.id) {
          console.error("Update event: node not found:", args);
          return;
        }

        try {
          const payload = {
            id: node.id,
            pid: node.pid ?? "",
            stpid: node.stpid ?? "",
            name: node.name ?? "",
            title: node.title ?? "",
            photo: node.photo ?? "",
            tags: node.tags ?? [],
            orig_pid: node.orig_pid ?? "",
            dept: node.dept ?? "",
            BU: node.BU ?? "",
            type: node.type ?? "",
          };

          await apiClient.post(UPDATE_NODE_API, payload);
          await revalidate();
        } catch (err) {
          console.error("Failed to update node:", err);
        }
      }, 0);
    });

    // Handle drag-drop event
    chart.on("drop", (sender, draggedNodeId, droppedNodeId) => {
      const draggedNode = sender.getNode(draggedNodeId);
      const droppedNode = sender.getNode(droppedNodeId);

      if (!draggedNode || !draggedNode.id) return;
      if (!droppedNode || !droppedNode.id) return;

      // Move employee to department
      if (
        droppedNode.tags?.includes("group") &&
        !draggedNode.tags?.includes("group")
      ) {
        const draggedNodeData = sender.get(draggedNode.id as string | number);
        draggedNodeData.pid = undefined;
        draggedNodeData.stpid = droppedNode.id as any;

        sender.updateNode(draggedNodeData);

        setTimeout(async () => {
          try {
            const payload = {
              id: draggedNodeData.id,
              pid: draggedNodeData.pid ?? "",
              stpid: draggedNodeData.stpid ?? "",
              name: draggedNodeData.name ?? "",
              title: draggedNodeData.title ?? "",
              photo: draggedNodeData.photo ?? "",
              tags: draggedNodeData.tags ?? [],
              orig_pid: draggedNodeData.orig_pid ?? "",
              dept: draggedNodeData.dept ?? "",
              BU: draggedNodeData.BU ?? "",
              type: draggedNodeData.type ?? "",
            };

            await apiClient.post(UPDATE_NODE_API, payload);
            await revalidate();
          } catch (err) {
            console.error("Drop update failed:", err);
          }
        }, 0);

        return false;
      }
    });

    // Handle node removal event
    chart.on("remove", (sender, args) => {
      if (!args) {
        console.error("Remove event: args is invalid");
        return;
      }

      const nodeId = args.id || args.node?.id || args;
      if (!nodeId) {
        console.error("Remove event: node ID is invalid");
        return;
      }

      setTimeout(async () => {
        try {
          await apiClient.post(REMOVE_NODE_API, { id: nodeId });
          await revalidate();
        } catch (err) {
          console.error("Failed to remove node:", err);
        }
      }, 50);
    });

    chartRef.current = chart;
    chart.load(chartNodes);
    console.log("OrgChart initialized with groups in side:", selectedGroup);
  }, [selectedGroup, nodes]);

  // Show loading screen while data is loading
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div
      id="tree"
      ref={treeRef}
      style={{ width: "100%", height: "100vh" }}
    />
  );
}

