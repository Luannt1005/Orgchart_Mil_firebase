import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { EmployeeFilter } from '../page';
import { OrgNode } from '@/types/orgchart';

interface DonutChartProps {
    className?: string;
    onFilterChange?: (filter: EmployeeFilter) => void;
    nodes: OrgNode[];  // Required prop
    loading?: boolean;
}

// Solid colors for chart
const COLORS = {
    Staff: '#8B5CF6',  // Purple
    IDL: '#F59E0B',    // Orange
    DL: '#3B82F6'      // Blue
};

const DonutChart: React.FC<DonutChartProps> = ({ className, onFilterChange, nodes, loading = false }) => {
    // Data is now passed from parent - no more independent fetching
    const error = null; // Error handling moved to parent

    // Calculate counts by type
    const chartData = useMemo(() => {
        if (!nodes || nodes.length === 0) return [];

        const counts = { Staff: 0, IDL: 0, DL: 0 };

        nodes.forEach((node: any) => {
            const dlIdlStaff = (node['DL/IDL/Staff'] || '').toLowerCase();
            if (dlIdlStaff.includes('staff')) {
                counts.Staff++;
            } else if (dlIdlStaff.includes('idl')) {
                counts.IDL++;
            } else {
                counts.DL++;
            }
        });

        const total = counts.Staff + counts.IDL + counts.DL;

        return [
            { name: 'Staff', value: counts.Staff, percentage: total > 0 ? Math.round((counts.Staff / total) * 100) : 0 },
            { name: 'IDL', value: counts.IDL, percentage: total > 0 ? Math.round((counts.IDL / total) * 100) : 0 },
            { name: 'DL', value: counts.DL, percentage: total > 0 ? Math.round((counts.DL / total) * 100) : 0 }
        ].filter(item => item.value > 0);
    }, [nodes]);

    const total = chartData.reduce((sum, item) => sum + item.value, 0);

    // Compact legend with percentages
    const renderLegend = (props: any) => {
        const { payload } = props;
        return (
            <div className="flex justify-center gap-4 mt-2">
                {payload.map((entry: any, index: number) => {
                    const data = chartData.find(d => d.name === entry.value);
                    return (
                        <button
                            key={`legend-${index}`}
                            className="flex items-center gap-1.5 text-xs hover:opacity-70 transition-opacity"
                            onClick={() => onFilterChange?.({ type: 'type', value: entry.value, label: `Type: ${entry.value}` })}
                        >
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[entry.value as keyof typeof COLORS] }}></span>
                            <span className="text-[#334155] font-medium">{entry.value}</span>
                            <span className="text-[#64748B]">({data?.percentage}%)</span>
                        </button>
                    );
                })}
            </div>
        );
    };

    if (loading) {
        return (
            <div className={`bg-white rounded-xl shadow-sm p-4 h-full flex flex-col ${className}`}>
                <div className="flex-1 flex flex-col items-center justify-center gap-4 animate-pulse">
                    {/* Skeleton for Pie Chart */}
                    <div className="w-48 h-48 rounded-full border-[16px] border-gray-100"></div>
                    <div className="flex gap-4 mt-2">
                        <div className="h-3 w-16 bg-gray-100 rounded"></div>
                        <div className="h-3 w-16 bg-gray-100 rounded"></div>
                        <div className="h-3 w-16 bg-gray-100 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !chartData || chartData.length === 0) {
        return (
            <div className={`bg-white rounded-xl shadow-sm p-4 h-full flex flex-col ${className}`}>
                <div className="text-center text-gray-400 flex-1 flex items-center justify-center text-sm">
                    No data available
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-xl shadow-sm p-4 h-full flex flex-col min-h-0 ${className}`}>
            {/* Header */}
            <div className="shrink-0 mb-2">
                <h3 className="text-[13px] pl-1 font-bold text-[#0F172A]">Employee Type</h3>
            </div>

            {/* Chart */}
            <div className="flex-1 min-h-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="45%"
                            innerRadius="50%"
                            outerRadius="80%"
                            paddingAngle={2}
                            dataKey="value"
                            animationDuration={600}
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[entry.name as keyof typeof COLORS]}
                                    style={{ outline: 'none', cursor: 'pointer' }}
                                    onClick={() => onFilterChange?.({ type: 'type', value: entry.name, label: `Type: ${entry.name}` })}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            isAnimationActive={false}
                            contentStyle={{
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #E2E8F0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                color: '#1E293B',
                                fontSize: '12px'
                            }}
                            itemStyle={{ color: '#1E293B' }}
                        />
                        <Legend content={renderLegend} verticalAlign="bottom" height={30} />
                    </PieChart>
                </ResponsiveContainer>

                {/* Center Total */}
                <div className="absolute top-[40%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <div className="text-2xl font-bold text-[#0F172A]">{total}</div>
                    <div className="text-[10px] text-[#64748B] uppercase tracking-wide">Total</div>
                </div>
            </div>
        </div>
    );
};

export default DonutChart;
