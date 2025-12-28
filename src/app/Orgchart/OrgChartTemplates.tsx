"use client";

import OrgChart from "@balkangraph/orgchart.js";

export function patchOrgChartTemplates() {
    // Chỉ chạy khi đã có window
    if (typeof window === "undefined") return;

    // --- TEMPLATE BIG (bản rút gọn mẫu, bạn thay theo code Vue) ---
    OrgChart.templates.big = Object.assign({}, OrgChart.templates.ana);
    OrgChart.templates.big.defs = 
    `<filter x="-50%" y="-50%" width="200%" height="200%" filterUnits="objectBoundingBox" id="cool-shadow">
        <feOffset dx="0" dy="4" in="SourceAlpha" result="shadowOffsetOuter1" />
        <feGaussianBlur stdDeviation="10" in="shadowOffsetOuter1" result="shadowBlurOuter1" />
        <feColorMatrix values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.1 0" in="shadowBlurOuter1" type="matrix" result="shadowMatrixOuter1" />
        <feMerge>
            <feMergeNode in="shadowMatrixOuter1" />
            <feMergeNode in="SourceGraphic" />
        </feMerge>
    </filter>`;
    OrgChart.templates.big.size = [230, 330];
    
      OrgChart.templates.big.img_0 =
  `<image preserveAspectRatio="xMidYMid slice" xlink:href="{val}" x="45" y="30"  width="140" height="180" rx="15" ry="15"></image>`;


  OrgChart.templates.big.img_0 =
  `<clipPath id="{randId}">
        <rect fill="#ffffff" stroke="#039BE5" stroke-width="5" x="45" y="30" rx="10" ry="10" width="140" height="180"></rect>
    </clipPath>
    <image preserveAspectRatio="xMidYMid slice" clip-path="url(#{randId})" xlink:href="{val}" x="45" y="30" width="140" height="180"></image>
    <rect fill="none" stroke="#F57C00" stroke-width="2" x="45" y="30" rx="10" ry="10" width="140" height="180"></rect>`;
  
      OrgChart.templates.big.node =
  `<rect x="0" y="20" height="300" width="{w}" fill="#A8CBED" rx="10" ry="10" filter="url(#cool-shadow)"></rect>`;
      OrgChart.templates.big.minus =
        `<rect x="0" y="50" height="35" width="170" fill="#bd011c" stroke-width="1" stroke="#aeaeae"></rect>
    <path fill="#fff" d="M75,75 L85,65 L95,75"></path>`;
      OrgChart.templates.big.plus =
        `<rect x="0" y="50" height="35" width="170" fill="#bd011c" stroke-width="1" stroke="#aeaeae"></rect>
    <path fill="#fff" d="M75,65 L85,75 L95,65"></path>
    <text text-anchor="middle" style="font-size: 12px;cursor:pointer;" fill="#fff" x="85" y="63">({collapsed-children-count})</text>`;
      OrgChart.templates.big.expandCollapseSize = 170;
      OrgChart.templates.big.field_0 =
        `<text data-width="210" data-text-overflow="multiline" style="font-size: 16px;" fill="#000" x="30" y="275" font-weight="bold" text-anchor="start">{val}</text>`,
        OrgChart.templates.big.field_1 =
        `<text data-width="260" data-text-overflow="multiline" style="font-size: 18px;" fill="#000" x="25" y="235"  font-weight="bold" text-anchor="start">{val}</text>`;
      OrgChart.templates.big.up = '';

      // OrgChart.templates.big.nodeMenuButton = 




    OrgChart.templates.big_v2 = Object.assign({}, OrgChart.templates.ana);
    OrgChart.templates.big_v2.defs = 
    `<filter x="-50%" y="-50%" width="200%" height="200%" filterUnits="objectBoundingBox" id="cool-shadow">
        <feOffset dx="0" dy="4" in="SourceAlpha" result="shadowOffsetOuter1" />
        <feGaussianBlur stdDeviation="10" in="shadowOffsetOuter1" result="shadowBlurOuter1" />
        <feColorMatrix values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.1 0" in="shadowBlurOuter1" type="matrix" result="shadowMatrixOuter1" />
        <feMerge>
            <feMergeNode in="shadowMatrixOuter1" />
            <feMergeNode in="SourceGraphic" />
        </feMerge>
    </filter>`;
    OrgChart.templates.big_v2.size = [230, 330];
    
      OrgChart.templates.big_v2.img_0 =
  `<image preserveAspectRatio="xMidYMid slice" xlink:href="{val}" x="45" y="30"  width="140" height="180" rx="15" ry="15"></image>`;


  OrgChart.templates.big_v2.img_0 =
  `<clipPath id="{randId}">
        <rect fill="#ffffff" stroke="#039BE5" stroke-width="5" x="45" y="30" rx="10" ry="10" width="140" height="180"></rect>
    </clipPath>
    <image preserveAspectRatio="xMidYMid slice" clip-path="url(#{randId})" xlink:href="{val}" x="45" y="30" width="140" height="180"></image>
    <rect fill="none" stroke="#F57C00" stroke-width="2" x="45" y="30" rx="10" ry="10" width="140" height="180"></rect>`;
  
      OrgChart.templates.big_v2.node =
  `<rect x="0" y="20" height="300" width="{w}" fill="#93DC5C" rx="10" ry="10" filter="url(#cool-shadow)"></rect>`;
      OrgChart.templates.big_v2.minus =
        `<rect x="0" y="50" height="35" width="170" fill="#bd011c" stroke-width="1" stroke="#aeaeae"></rect>
    <path fill="#fff" d="M75,75 L85,65 L95,75"></path>`;
      OrgChart.templates.big_v2.plus =
        `<rect x="0" y="50" height="35" width="170" fill="#bd011c" stroke-width="1" stroke="#aeaeae"></rect>
    <path fill="#fff" d="M75,65 L85,75 L95,65"></path>
    <text text-anchor="middle" style="font-size: 12px;cursor:pointer;" fill="#fff" x="85" y="63">({collapsed-children-count})</text>`;
      OrgChart.templates.big_v2.expandCollapseSize = 170;
      OrgChart.templates.big_v2.field_0 =
        `<text data-width="210" data-text-overflow="multiline" style="font-size: 16px;" fill="#000" x="30" y="275" font-weight="bold" text-anchor="start">{val}</text>`,
        OrgChart.templates.big_v2.field_1 =
        `<text data-width="260" data-text-overflow="multiline" style="font-size: 18px;" fill="#000" x="25" y="235"  font-weight="bold" text-anchor="start">{val}</text>`;
      OrgChart.templates.big_v2.up = '';



   












      // --- TEMPLATE cho DEPARTMENT  ---

      OrgChart.templates.group.link =
        `<path stroke-linejoin="round" stroke="#aeaeae" stroke-width="1px" fill="none" d="M{xa},{ya} {xb},{yb} {xc},{yc} L{xd},{yd}" />`
      OrgChart.templates.group.nodeMenuButton = '';
      OrgChart.templates.group.min = Object.assign({}, OrgChart.templates.group);
      OrgChart.templates.group.min.imgs = `{val}`;
      OrgChart.templates.group.min.img_0 = ``;
      OrgChart.templates.group.unitName = '';
      OrgChart.templates.group.field_0 = '<text data-width="500" data-text-overflow="multiline" style="font-size: 28px;" fill="#000" x="{cw}" y="36" font-weight="bold" text-anchor="middle">{val}</text>';

    // Ensure the group template exists and `node` is a string before modifying it
    if (!OrgChart.templates.group) {
      OrgChart.templates.group = Object.assign({}, OrgChart.templates.ana);
    }

    if (typeof OrgChart.templates.group.node === 'string') {
      OrgChart.templates.group.node = OrgChart.templates.group.node
        .replace('<rect ', '<rect fill="white" ')
        .replace('<rect ', '<rect filter="url(#outsideStroke)"')
        .replace(/rx="\d+"/, 'rx="2"')
        .replace(/ry="\d+"/, 'ry="2"')
        .replace('</rect>', '</rect> <rect x="0" y="0" height="65" width="{w}" rx="2" ry="2" fill="grey"></rect>');
    }



}
