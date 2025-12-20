"use client";

import { useSearchParams } from "next/navigation";
import OrgChartView from "./OrgChartView";

export default function OrgChartPage() {
  const searchParams = useSearchParams();
  const group = searchParams.get("group") || ""; // Lấy group từ URL

  return (
    <div className="h-dvh">
      <h2>Org Chart TTI VN</h2>
      <OrgChartView selectedGroup={group} />
    </div>
  );
}
