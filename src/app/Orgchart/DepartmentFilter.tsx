import React, { useState, useRef, useEffect, useMemo } from 'react';

interface DepartmentFilterProps {
    currentSector: string;
    groups: any[]; // Using any[] to match the mixed type in groups, but we filter to strings
    loading: boolean;
    hasNodes: boolean;
    onSelect: (sector: string) => void;
}

export default function DepartmentFilter({
    currentSector,
    groups,
    loading,
    hasNodes,
    onSelect
}: DepartmentFilterProps) {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [sectorQuery, setSectorQuery] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Filter valid groups
    const sectorRegistry = useMemo(() => {
        return (groups || []).filter((g): g is string => typeof g === 'string' && g.trim() !== '');
    }, [groups]);

    // Handle clicking outside to close
    useEffect(() => {
        const handleOutsideInteraction = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false);
            }
        };
        document.addEventListener("mousedown", handleOutsideInteraction);
        return () => document.removeEventListener("mousedown", handleOutsideInteraction);
    }, []);

    // Helper for selection
    const handleSelect = (sector: string) => {
        setIsFilterOpen(false);
        onSelect(sector);
    };

    // Filter list based on search
    const filteredSectors = sectorRegistry.filter(s =>
        s.toLowerCase().includes(sectorQuery.toLowerCase())
    );

    return (
        <div className="w-full bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
            <div className="px-4 py-2">
                <div className="relative w-full max-w-sm" ref={dropdownRef}>
                    <div className="space-y-1">
                        <div className="flex items-center justify-between px-1">
                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] leading-none">
                                Filter by Department
                            </label>
                        </div>

                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`flex items-center justify-between w-full px-3 py-2 bg-gray-50 border transition-all duration-200 group rounded-lg ${isFilterOpen
                                ? 'border-[#DB011C] bg-white ring-2 ring-[#DB011C]/5'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-100/50'
                                }`}
                        >
                            <div className="flex items-center gap-2 truncate overflow-hidden">
                                <div className={`w-1.5 h-1.5 rounded-full ${currentSector === "all" ? 'bg-gray-400' : 'bg-[#DB011C]'}`}></div>
                                <span className="text-sm font-bold text-gray-900 tracking-tight truncate">
                                    {currentSector === "all" ? "All Departments" : currentSector}
                                </span>
                            </div>

                            <svg
                                className={`w-4 h-4 transition-transform duration-300 ${isFilterOpen ? 'rotate-180 text-[#DB011C]' : 'text-gray-400 group-hover:text-gray-600'
                                    }`}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>

                    {isFilterOpen && (
                        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                            <div className="p-2 bg-white border-b border-gray-100 flex gap-2">
                                <div className="relative flex-1 group">
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={sectorQuery}
                                        onChange={(e) => setSectorQuery(e.target.value)}
                                        autoFocus
                                        className="w-full bg-gray-50 border border-gray-200 px-3 py-1.5 text-xs text-gray-900 rounded-md focus:outline-none focus:border-[#DB011C] focus:bg-white transition-all placeholder:text-gray-400"
                                    />
                                </div>
                            </div>

                            <div className="max-h-[50vh] overflow-y-auto custom-scrollbar">
                                <button
                                    onClick={() => handleSelect("all")}
                                    className={`w-full px-4 py-2 text-left text-xs font-semibold transition-all flex items-center justify-between ${currentSector === "all" ? "bg-red-50 text-[#DB011C]" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        }`}
                                >
                                    <span>All Departments</span>
                                    {currentSector === "all" && <div className="w-1.5 h-1.5 rounded-full bg-[#DB011C]"></div>}
                                </button>

                                {filteredSectors.map((sector) => (
                                    <button
                                        key={sector}
                                        onClick={() => handleSelect(sector)}
                                        className={`w-full px-4 py-2 text-left text-xs font-semibold transition-all flex items-center justify-between border-t border-gray-50/50 ${currentSector === sector ? "bg-red-50 text-[#DB011C]" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                            }`}
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
        </div>
    );
}
