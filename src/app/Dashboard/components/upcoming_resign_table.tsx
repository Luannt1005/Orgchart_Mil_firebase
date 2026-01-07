import React, { useMemo } from 'react';
import { OrgNode } from '@/types/orgchart';

interface UpcomingResignTableProps {
    className?: string;
    nodes: OrgNode[];  // Required prop
    loading?: boolean;
}

const UpcomingResignTable: React.FC<UpcomingResignTableProps> = ({ className, nodes, loading = false }) => {
    // Data is now passed from parent - no more independent fetching
    const error = null; // Error handling moved to parent

    // Format date from Excel serial or string
    const formatDate = (dateValue: string | number): string => {
        if (!dateValue) return '';

        let date: Date;

        if (typeof dateValue === "number" || /^\d+$/.test(String(dateValue))) {
            const excelEpoch = new Date(1899, 11, 30);
            date = new Date(excelEpoch.getTime() + Number(dateValue) * 86400000);
        } else if (String(dateValue).includes("/")) {
            const [day, month, year] = String(dateValue).split("/").map(Number);
            date = new Date(year, month - 1, day);
        } else {
            date = new Date(dateValue);
        }

        if (isNaN(date.getTime())) return String(dateValue);

        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${day}/${month}`;
    };

    // Filter employees with Last Working Day
    const resigningEmployees = useMemo(() => {
        if (!nodes || nodes.length === 0) return [];

        return nodes
            .filter((node: any) => {
                const lastWorkingDay = node['Last Working\r\nDay'] || node['Last Working Day'] || node['last working day'];
                return lastWorkingDay && String(lastWorkingDay).trim() !== '';
            })
            .map((node: any) => ({
                empId: node['Employee ID'] || node['Emp ID'] || '',
                fullName: node['Full Name'] || node['Name'] || node['FullName '] || node['FullName'] || '',
                dept: node['BU Org 3'] || node['Department'] || node['Dept'] || '',
                lastWorkingDay: node['Last Working\r\nDay'] || node['Last Working Day'] || '',
                imageUrl: `https://raw.githubusercontent.com/Luannt1005/test-images/main/${node['Emp ID'] || node['Employee ID'] || ''}.jpg`
            }))
            .sort((a, b) => String(a.lastWorkingDay).localeCompare(String(b.lastWorkingDay)))
            .slice(0, 5); // Show only top 5
    }, [nodes]);

    if (loading) {
        return (
            <div className={`h-full flex flex-col ${className}`}>
                <div className="flex-1 p-3 space-y-3 animate-pulse">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-gray-200 shrink-0"></div>
                            <div className="flex-1 space-y-1.5">
                                <div className="h-2.5 bg-gray-200 rounded w-2/3"></div>
                                <div className="h-2 bg-gray-100 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`h-full flex items-center justify-center text-gray-400 text-xs ${className}`}>
                Error loading data
            </div>
        );
    }

    if (resigningEmployees.length === 0) {
        return (
            <div className={`h-full flex items-center justify-center text-gray-400 ${className}`}>
                <div className="text-center">
                    <svg className="w-8 h-8 mx-auto mb-1 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-[13px] pl-1 py-1 font-bold text-[#0F172A]">No upcoming resignations</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`h-full flex flex-col ${className}`}>
            {/* Compact List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="divide-y divide-gray-50">
                    {resigningEmployees.map((emp, index) => (
                        <div
                            key={emp.empId || index}
                            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors"
                        >
                            {/* Avatar */}
                            <img
                                src={emp.imageUrl}
                                alt={emp.fullName}
                                className="w-6 h-6 rounded-full object-cover shrink-0"
                                onError={(e) => {
                                    const initials = emp.fullName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?';
                                    const colors = ['#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];
                                    const bgColor = colors[emp.fullName?.charCodeAt(0) % colors.length || 0];
                                    (e.target as HTMLImageElement).src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Crect fill='${encodeURIComponent(bgColor)}' width='24' height='24' rx='12'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui' font-size='9' font-weight='600' fill='white'%3E${initials}%3C/text%3E%3C/svg%3E`;
                                }}
                            />

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="text-[11px] font-semibold text-[#0F172A] truncate">
                                    {emp.fullName}
                                </div>
                                <div className="text-[9px] text-[#94A3B8] truncate">
                                    {emp.dept}
                                </div>
                            </div>

                            {/* Date Badge */}
                            <span className="shrink-0 px-2 py-0.5 rounded text-[9px] font-semibold bg-orange-100 text-orange-700">
                                {formatDate(emp.lastWorkingDay)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer - Total count */}
            {resigningEmployees.length > 0 && (
                <div className="shrink-0 px-3 py-1.5 border-t border-gray-100 text-center">
                    <span className="text-[9px] text-[#64748B]">
                        {resigningEmployees.length} upcoming
                    </span>
                </div>
            )}
        </div>
    );
};

export default UpcomingResignTable;
