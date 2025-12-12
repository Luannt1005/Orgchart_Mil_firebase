"use client";

import OrgChart from "@balkangraph/orgchart.js";

export function patchOrgChartTemplates() {
    // Chỉ chạy khi đã có window
    if (typeof window === "undefined") return;

    // --- TEMPLATE BIG (bản rút gọn mẫu, bạn thay theo code Vue) ---
    OrgChart.templates.big = Object.assign({}, OrgChart.templates.ana);
      OrgChart.templates.big.size = [230, 330];
      OrgChart.templates.big.img_0 =
        `<image preserveAspectRatio="xMidYMid slice" xlink:href="{val}" x="45" y="50"  width="140" height="140"></image>`;
      OrgChart.templates.big.node =
        `<rect x="0" y="20" height="250" width="{w}" fill="#A8CBED" stroke-width="1" stroke="#aeaeae"></rect>`;
      OrgChart.templates.big.minus =
        `<rect x="0" y="45" height="40" width="170" fill="#039BE5" stroke-width="1" stroke="#aeaeae"></rect>
    <path fill="#fff" d="M75,75 L85,65 L95,75"></path>`;
      OrgChart.templates.big.plus =
        `<rect x="0" y="45" height="40" width="170" fill="#039BE5" stroke-width="1" stroke="#aeaeae"></rect>
    <path fill="#fff" d="M75,65 L85,75 L95,65"></path>
    <text text-anchor="middle" style="font-size: 12px;cursor:pointer;" fill="#fff" x="85" y="60">({collapsed-children-count})</text>`;
      OrgChart.templates.big.expandCollapseSize = 170;
      OrgChart.templates.big.field_0 =
        `<text data-width="210" data-text-overflow="multiline" style="font-size: 16px;" fill="#000" x="35" y="225" font-weight="bold" text-anchor="start">{val}</text>`,
        OrgChart.templates.big.field_1 =
        `<text data-width="180" data-text-overflow="multiline" style="font-size: 16px;" fill="#000" x="35" y="245" text-anchor="start">{val}</text>`;
      OrgChart.templates.big.up = '';
      OrgChart.templates.big.nodeMenuButton = "";
   

      OrgChart.templates.group.link =
        `<path stroke-linejoin="round" stroke="#aeaeae" stroke-width="1px" fill="none" d="M{xa},{ya} {xb},{yb} {xc},{yc} L{xd},{yd}" />`
      OrgChart.templates.group.nodeMenuButton = ''
      OrgChart.templates.group.min = Object.assign({}, OrgChart.templates.group)
      OrgChart.templates.group.min.imgs = `{val}`
      OrgChart.templates.group.min.img_0 = ``
      OrgChart.templates.group.unitName = ''
      OrgChart.templates.group.field_0 = '<text data-width="900" style="font-size: 25px;" fill="#000" x="{cw}" y="30" font-weight="bold" text-anchor="middle">{val}</text>'

    //   OrgChart.templates.group.node = OrgChart.templates.group.node.replace('<rect ', '<rect fill="white" ').replace('<rect ', '<rect filter="url(#outsideStroke)"').replace(/rx="\d+"/, 'rx="2"').replace(/ry="\d+"/, 'ry="2"').replace('</rect>', '</rect> <rect x="0" y="0" height="48" width="{w}" rx="2" ry="2" fill="gray"></rect>')


}
