"use client";

import { useEffect, useRef, useState } from "react";
import OrgChart from "@balkangraph/orgchart.js";
import axios from "axios";
import { patchOrgChartTemplates } from "./OrgChartTemplates";
import "./OrgChart.css";
// removed unused import of `title` from 'process'



interface OrgChartProps {selectedGroup: string;}

export default function OrgChartView({ selectedGroup }: OrgChartProps)  {
    const treeRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<any>(null); // <── lưu instance của chart
    const [enableDragDrop, setEnableDragDrop] = useState(false);

    // Listen for Ctrl key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey) setEnableDragDrop(true);
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (!e.ctrlKey) setEnableDragDrop(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // Update chart dragDrop when state changes
    useEffect(() => {
        if (chartRef.current) {
            chartRef.current.config.enableDragDrop = enableDragDrop;
            chartRef.current.draw();
        }
    }, [enableDragDrop]);

    const addDepartment = async (nodeId: string) => {
    const chart = chartRef.current;
    if (!chart) return;

    const node = chart.getNode(nodeId);

    const data = {
        id: OrgChart.randomId(),
        pid: nodeId,
        name: "New Department",
        tags: ["group"]
    };

    chart.addNode(data);

    // Gửi qua API Next.js (không gọi GAS trực tiếp)
    await axios.post("/api/add-Department", data);
};


    useEffect(() => {
        const el = treeRef.current;
        if (!el) return;

        patchOrgChartTemplates();
        
        const url = selectedGroup
        ? `/api/filter_dept?group=${encodeURIComponent(selectedGroup)}`
        : `/api/filter_dept`;

        const loadData = async () => {
            const { data } = await axios.get(url);

            const list = Array.isArray(data?.data) ? data.data : [];

            const nodes = list.map((n: any) => ({
                ...n,
                tags: Array.isArray(n.tags) ? n.tags : n.tags ? [n.tags] : [],
                img: n.img || n.photo || "",
            }));

            const chart = new OrgChart(el,   {
                mouseScrool: OrgChart.none,
                collapse: { level: 1, allChildren: true },
                scaleInitial: 1,
                enableSearch: true,
                enableAI: false,
                layout: OrgChart.normal,
                template: "big",
                enableDragDrop: enableDragDrop,
                // filterBy: {type :{}},
                filterBy: ['type'],

                nodeBinding: {
                    imgs: "img",
                    field_0: "name",
                    field_1: "title",
                    img_0: "img",
                },
                // nodeMenu: {
                //         details: { text: "Details" },
                //         edit: { text: "Edit" },
                //         add: { text: "Add" },
                //         remove: { text: "Remove" }
                // },
                nodeMenu: {
                                addDepartment: { text: "Add new department", icon: OrgChart.icon.add(24, 24, "#7A7A7A"), onClick: addDepartment },
                                edit: { text: "Edit" },
                                details: { text: "Details" },
                                add: { text: "Add" },
                                remove: { text: "Remove" }
                },
                editForm: {
                    cancelBtn: 'Close',
                    saveAndCloseBtn: 'Save'
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
            
            


            chart.on("update", (sender, args) => {
    if (!args || !args.id) {
        console.error("Update event: args invalid", args);
        return;
    }

    // Delay để OrgChart cập nhật node xong rồi mới lấy node
    setTimeout(() => {

        const node = sender.get(args.id);

        if (!node || !node.id) {
            console.error("Update event: node not found:", args);
            return;
        }

        console.log("Node after update:", node);

        const updateNodeDB = async () => {
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
                    type: node.type ?? ""
                };

                console.log("Sending updated payload:", payload);

                const res = await axios.post("/api/Update-Node", payload);
                console.log("Updated successfully:", res.data);

            } catch (err) {
                console.error("Failed to update DB", err);
            }
        };

        updateNodeDB();

    }, 0); // chạy cuối cùng sau khi OrgChart update xong
});

            chart.on("drop", (sender, draggedNodeId, droppedNodeId) => {
                const draggedNode = sender.getNode(draggedNodeId);
                const droppedNode = sender.getNode(droppedNodeId);

                if (!draggedNode || !draggedNode.id) return;
                if (!droppedNode || !droppedNode.id) return;

                // Nếu kéo nhân viên vào department
                if (
                    droppedNode.tags?.includes("group") &&
                    !draggedNode.tags?.includes("group")
                ) {
                    const draggedNodeData = sender.get(draggedNode.id as string | number);

                    draggedNodeData.pid = undefined;               // <── FIX
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
                    type: draggedNodeData.type ?? ""
                };

                console.log("Sending drop-update payload:", payload);

                const res = await axios.post("/api/Update-Node", payload);
                console.log("Drop updated successfully:", res.data);

            } catch (err) {
                console.error("Drop: Failed to update DB", err);
            }
        }, 0);
                    
                    return false
                  
                }

                
            });

            chart.on("remove", (sender, args) => {
                        if (!args) {
                            console.error("Remove event: args is undefined or null.", args);
                            return;
                        }

                        console.log("Remove event args:", args);

                        const nodeId = args.id || args.node?.id || args;

                        if (!nodeId) {
                            console.error("Remove event: node ID is undefined or invalid.", args);
                            return;
                        }

                        console.log("Removing node with ID:", nodeId);

                        const removeNodeDB = async () => {
                            try {
                                const res = await axios.post("/api/Remove-Node", { id: nodeId });

                                if (res.status === 200) {
                                    console.log("Node successfully removed from database:", res.data);
                                } else {
                                    console.error("Unexpected response:", res.status, res.statusText);
                                }
                            } catch (err) {
                                console.error("Failed to remove node from database:", err);
                            }
                        };

                        // ⏳ Delay để chart update UI xong
                        setTimeout(() => {
                            removeNodeDB();
                        }, 50); // bạn có thể tăng lên 500 nếu cần
                    });



            chartRef.current = chart; // <── lưu lại chart

            chart.load(nodes);
        };

        loadData();
    }, [selectedGroup]);

    return (
    <div
        id="tree"
        ref={treeRef}
        style={{ width: "100%", height: "100vh" }}
    />
);

}
