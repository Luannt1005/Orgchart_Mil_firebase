"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState, useRef } from "react";
import OrgChartView from "./OrgChartView";
import "@/styles/admin-layout.css";

/**
 * High-Intensity Industrial Loading Station
 */
function OrgChartSkeleton() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-8">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-[#DB011C] rounded-full animate-spin"></div>
        </div>
        <div className="text-center space-y-3">
          <p className="text-gray-900 font-bold uppercase tracking-widest text-sm">Milwaukee®</p>
          <div className="flex flex-col items-center gap-3">
            <p className="text-gray-400 font-medium text-xs tracking-wide">Syncing organization data...</p>
            <div className="w-40 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-[#DB011C] w-1/3 animate-[loading-bar_1.5s_infinite]"></div>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
         @keyframes loading-bar {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(300%); }
         }
      `}</style>
    </div>
  );
}

/**
 * Tactical Command Center Interface
 */
function OrgChartPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentSector = searchParams.get("group") || "all";

  const [sectorRegistry, setSectorRegistry] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sectorQuery, setSectorQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const acquireSectorData = async () => {
      try {
        const response = await fetch("/api/orgchart");
        const json = await response.json();
        if (json.success && json.data) {
          const uniqueDepts = Array.from(
            new Set(json.data.map((item: any) => item.dept).filter((d: any) => typeof d === 'string' && d.trim() !== ""))
          ) as string[];
          setSectorRegistry(uniqueDepts.sort());
        }
      } catch (err) {
        console.error("SYSTEM CRITICAL: FAILED TO ACQUIRE SECTOR REGISTRY", err);
      } finally {
        setIsSyncing(false);
      }
    };
    acquireSectorData();
  }, []);

  useEffect(() => {
    const handleOutsideInteraction = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideInteraction);
    return () => document.removeEventListener("mousedown", handleOutsideInteraction);
  }, []);

  const dispatchSectorChange = (sector: string) => {
    setIsFilterOpen(false);
    if (sector === "all") {
      router.push("/Orgchart");
    } else {
      router.push(`/Orgchart?group=${encodeURIComponent(sector)}`);
    }
  };

  const filteredSectors = sectorRegistry.filter(s =>
    s.toLowerCase().includes(sectorQuery.toLowerCase())
  );

  const activeSectorTitle = currentSector === "all" ? "GLOBAL ENTERPRISE MAP" : currentSector;

  return (
    <div className="mil-container flex flex-col h-screen overflow-hidden p-0! bg-[#f2f2f2]">
      {/* Simplified Header - Filter Only */}
      <header className="sticky top-[58px] z-100 w-full bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-6 py-4">
          <div className="relative w-full max-w-2xl mx-auto" ref={dropdownRef}>
            <div className="space-y-1">
              <div className="flex items-center justify-between px-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] leading-none">Filter by Department</label>
              </div>

              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center justify-between w-full px-5 py-3.5 bg-gray-50 border transition-all duration-200 group rounded-xl ${isFilterOpen ? 'border-[#DB011C] bg-white ring-4 ring-[#DB011C]/5' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-100/50'
                  }`}
              >
                <div className="flex items-center gap-4 truncate overflow-hidden">
                  <div className={`w-2 h-2 rounded-full ${currentSector === "all" ? 'bg-gray-400' : 'bg-[#DB011C]'}`}></div>
                  <span className="text-lg font-bold text-gray-900 tracking-tight truncate">
                    {currentSector === "all" ? "All Departments" : currentSector}
                  </span>
                </div>

                <svg
                  className={`w-5 h-5 transition-transform duration-300 ${isFilterOpen ? 'rotate-180 text-[#DB011C]' : 'text-gray-400 group-hover:text-gray-600'}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {isFilterOpen && (
              <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] animate-in fade-in slide-in-from-top-2 duration-200 z-max overflow-hidden">
                <div className="p-3 bg-white border-b border-gray-100 flex gap-3">
                  <div className="relative flex-1 group">
                    <input
                      type="text"
                      placeholder="Search departments..."
                      value={sectorQuery}
                      onChange={(e) => setSectorQuery(e.target.value)}
                      autoFocus
                      className="w-full bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm text-gray-900 rounded-lg focus:outline-none focus:border-[#DB011C] focus:bg-white transition-all placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <div className="max-h-[50vh] overflow-y-auto custom-scrollbar">
                  <button
                    onClick={() => dispatchSectorChange("all")}
                    className={`w-full px-5 py-4 text-left text-sm font-semibold transition-all flex items-center justify-between ${currentSector === "all" ? "bg-red-50 text-[#DB011C]" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
                  >
                    <span>All Departments</span>
                    {currentSector === "all" && <div className="w-1.5 h-1.5 rounded-full bg-[#DB011C]"></div>}
                  </button>

                  {filteredSectors.map((sector) => (
                    <button
                      key={sector}
                      onClick={() => dispatchSectorChange(sector)}
                      className={`w-full px-5 py-4 text-left text-sm font-semibold transition-all flex items-center justify-between border-t border-gray-50/50 ${currentSector === sector ? "bg-red-50 text-[#DB011C]" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
                    >
                      <span className="truncate pr-4">{sector}</span>
                      {currentSector === sector && <div className="w-1.5 h-1.5 rounded-full bg-[#DB011C]"></div>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 relative bg-white z-0">
        <OrgChartView selectedGroup={currentSector} />
      </main>
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
