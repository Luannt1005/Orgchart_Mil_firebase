"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import OrgChartView from "./OrgChartView";

/**
 * Loading skeleton component
 */
function OrgChartSkeleton() {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-gray-50/50 backdrop-blur-sm">
      <div className="text-center group">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-red-200 rounded-full blur-xl animate-pulse group-hover:bg-red-300 transition-colors"></div>
          <div className="relative inline-block animate-spin">
            <svg
              className="w-16 h-16 text-red-600 drop-shadow-sm"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        </div>
        <p className="mt-6 text-gray-500 font-medium tracking-tight animate-pulse uppercase text-xs">Phân tích sơ đồ tổ chức...</p>
      </div>
    </div>
  );
}

/**
 * Main OrgChart Page Content
 */
function OrgChartPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const group = searchParams.get("group") || "";
  const [departments, setDepartments] = useState<string[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(true);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await fetch("/api/orgchart");
        const json = await res.json();
        if (json.success && json.data) {
          const depts = Array.from(
            new Set(json.data.map((item: any) => item.dept).filter((d: any) => typeof d === 'string' && d.trim() !== ""))
          ) as string[];
          setDepartments(depts.sort());
        }
      } catch (err) {
        console.error("Error fetching departments", err);
      } finally {
        setLoadingDepts(false);
      }
    };
    fetchDepts();
  }, []);

  const handleFilterClick = (dept: string) => {
    if (dept === "all") {
      router.push("/Orgchart");
    } else {
      router.push(`/Orgchart?group=${encodeURIComponent(dept)}`);
    }
  };

  return (
    <div className="w-full flex flex-col min-h-screen">
      {/* Filter Toolbar */}
      <div className="sticky top-[75px] z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-[0_1px_3px_rgb(0,0,0,0.02)] print:hidden">
        <div className="max-w-[1920px] mx-auto px-4 md:px-8 py-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <span className="text-sm font-bold text-gray-800 uppercase tracking-tight">Bộ lọc:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleFilterClick("all")}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${!group || group === "all"
                  ? "bg-red-700 text-white shadow-lg shadow-red-200 ring-2 ring-red-100"
                  : "bg-white text-gray-500 border border-gray-100 hover:border-red-200 hover:text-red-600 hover:bg-red-50"
                  }`}
              >
                Tất cả Phòng Ban
              </button>

              {loadingDepts ? (
                <div className="flex gap-2 animate-pulse">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-24 h-7 bg-gray-100 rounded-full"></div>
                  ))}
                </div>
              ) : (
                departments.map((dept) => (
                  <button
                    key={dept}
                    onClick={() => handleFilterClick(dept)}
                    className={`px-5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${group === dept
                      ? "bg-gray-800 text-white shadow-lg shadow-gray-200 ring-4 ring-gray-100"
                      : "bg-white text-gray-500 border border-gray-100 hover:border-gray-300 hover:text-gray-900 shadow-sm"
                      }`}
                  >
                    {dept}
                  </button>
                ))
              )}
            </div>

            {group && group !== "all" && (
              <div className="sm:ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-dashed border-gray-200 cursor-pointer" onClick={() => handleFilterClick("all")}>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Đang xem:</span>
                <span className="text-sm font-bold text-red-700">{group}</span>
                <span className="text-red-300 hover:text-red-600 ml-1">×</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        <OrgChartView selectedGroup={group} />
      </div>
    </div>
  );
}

export default function OrgChartPage() {
  return (
    <Suspense fallback={<OrgChartSkeleton />}>
      <OrgChartPageContent />
    </Suspense>
  );
}
