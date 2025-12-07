"use client";

import { useEffect, useRef } from "react";
import OrgChart from "@balkangraph/orgchart.js";
import axios from "axios";
import { patchOrgChartTemplates } from "./OrgChartTemplates";

export default function OrgChartView() {
    const treeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = treeRef.current;
        if (!el) return;

        // Patch template trước khi tạo chart
        patchOrgChartTemplates();

        const loadData = async () => {
            const { data } = await axios.get("https://script.google.com/macros/s/AKfycbzXlPZTDuLdpfzivyVg-tXXV6bKsavMkb1JbgWIPwGNtyEmxvP-ar00J6l6MIysnjxbPg/exec");

            const list = Array.isArray(data?.data) ? data.data : [];

            const nodes = list.map((n: any) => ({
                ...n,
                tags: Array.isArray(n.tags) ? n.tags : (n.tags ? [n.tags] : []),
                img: n.img || n.photo || "",
            }));

            const chart = new OrgChart(el, {
                mouseScrool: OrgChart.none,
                scaleInitial: 1,

                enableSearch: false,
                enableAI: false,

                // layout mặc định
                layout: OrgChart.normal,


                template: "big",
                enableDragDrop: true,

                nodeBinding: {
                    imgs: "img",
                    field_0: "name",
                    field_1: "title",
                    img_0: "img",
                },

                tags: {
                    group: { template: "group" },
            
                },
                
            });

            chart.load(nodes);
        };

        loadData();
    }, []);

    return <div ref={treeRef} style={{ width: "100%", height: "100vh" }} />;
}
