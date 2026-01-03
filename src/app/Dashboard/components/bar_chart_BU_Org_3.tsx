import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LabelList, Tooltip } from 'recharts';
import { OrgNode } from '@/types/orgchart';

interface BUOrg3ChartProps {
    className?: string;
    nodes: OrgNode[];  // Required prop
    loading?: boolean;
}

const BUOrg3Chart: React.FC<BUOrg3ChartProps> = ({ className, nodes, loading = false }) => {
    // Data is now passed from parent - no more independent fetching
    const error = null; // Error handling moved to parent

    // Process data: group by BU Org 3
    const chartData = useMemo(() => {
        if (!nodes || nodes.length === 0) return [];

        const groupedData: Record<string, number> = {};

        nodes.forEach((node: any) => {
            const buOrg3 = node['BU Org 3'] || node['BU Org 3 '] || 'Unknown';
            if (!groupedData[buOrg3]) groupedData[buOrg3] = 0;
            groupedData[buOrg3]++;
        });

        // Take top 8 departments
        return Object.entries(groupedData)
            .map(([name, count]) => ({
                name: name.length > 12 ? name.slice(0, 12) + '...' : name,
                fullName: name,
                count
            }))
            .filter(item => item.fullName !== 'Unknown' && item.count > 0)
            .sort((a, b) => b.count - a.count)
            .slice(0, 8);
    }, [nodes]);

    if (loading) {
        return (
            <div className={`bg-white rounded-xl shadow-sm p-4 h-full flex items-center justify-center ${className}`}>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#C40000]"></div>
            </div>
        );
    }

    if (error || !chartData || chartData.length === 0) {
        return (
            <div className={`bg-white rounded-xl shadow-sm p-4 h-full flex items-center justify-center text-gray-400 text-sm ${className}`}>
                No department data
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-xl shadow-sm p-4 h-full flex flex-col min-h-0 ${className}`}>
            {/* Header */}
            <div className="shrink-0 mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#0F172A]">Departments</h3>
                <span className="text-[10px] text-[#64748B]">{chartData.length} depts</span>
            </div>

            {/* Chart */}
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 15, right: 10, left: -10, bottom: 35 }}
                    >
                        <XAxis
                            dataKey="name"
                            angle={-35}
                            textAnchor="end"
                            height={50}
                            interval={0}
                            tick={{ fill: '#64748B', fontSize: 9 }}
                            axisLine={{ stroke: '#E5E7EB' }}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fill: '#64748B', fontSize: 9 }}
                            axisLine={false}
                            tickLine={false}
                            width={25}
                        />
                        <Tooltip
                            contentStyle={{ fontSize: 11, borderRadius: 8 }}
                            formatter={(value: number | undefined) => [value ?? 0, 'Count']}
                            labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                        />
                        <Bar
                            dataKey="count"
                            fill="#3B82F6"
                            radius={[4, 4, 0, 0]}
                        >
                            <LabelList
                                dataKey="count"
                                position="top"
                                style={{ fill: '#0F172A', fontWeight: 600, fontSize: 9 }}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default BUOrg3Chart;
