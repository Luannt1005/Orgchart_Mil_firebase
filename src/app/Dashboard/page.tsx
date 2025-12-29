'use client';

import { useEffect, useState, useMemo } from 'react';
import {
    PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from 'recharts';
import {
    UsersIcon,
    BriefcaseIcon,
    FunnelIcon,
    TableCellsIcon,
    ChartBarIcon,
    ArrowPathIcon,
    AdjustmentsHorizontalIcon,
    MagnifyingGlassIcon,
    UserGroupIcon
} from '@heroicons/react/24/outline';

// --- Types & Interfaces ---
interface RawEmployee {
    id: string;
    [key: string]: any;
}

interface ProcessedEmployee extends RawEmployee {
    _reportsCount: number;
    _staffCount: number;
    _idlCount: number;
    _supervisorCount: number;
    _specialistCount: number;
    _directReports: ProcessedEmployee[];
}

// --- Helper: Tree Builder & Aggregator ---
const buildHierarchyAndStats = (data: RawEmployee[]) => {
    // Normalize Keys helper
    const getVal = (item: any, keys: string[]) => {
        for (const k of keys) {
            if (item[k] !== undefined && item[k] !== null) return String(item[k]).trim();
        }
        return "";
    };

    // 1. Map by Name/ID for easy lookup. 
    // Note: Data usually links via "Line Manager" name or ID. Assuming Name based on typical Excel exports unless ID is explicit.
    const employeeMap = new Map<string, ProcessedEmployee>();

    data.forEach(item => {
        // Attempt to determine unique identifier. Prefer 'Emp ID', fallback to 'FullName' or names
        const id = getVal(item, ['Emp ID', 'Employee ID', 'id']);
        const name = getVal(item, ['FullName', 'Full Name', 'Name', 'FullName ']); // Space at end common in excel

        // Store with enriched fields initialized
        const processed: ProcessedEmployee = {
            ...item,
            _id: id || name, // Internal ID
            _reportsCount: 0,
            _staffCount: 0,
            _idlCount: 0,
            _supervisorCount: 0,
            _specialistCount: 0,
            _directReports: []
        };

        // Key by Name because Line Manager fields usually contain Names, not IDs in these datasets
        if (name) employeeMap.set(name.toLowerCase(), processed);
    });

    const rootNodes: ProcessedEmployee[] = [];

    // 2. Build Tree
    employeeMap.forEach((node) => {
        const lmName = getVal(node, ['Line Manager', 'Manager', 'Reports To']);
        if (lmName && employeeMap.has(lmName.toLowerCase())) {
            const parent = employeeMap.get(lmName.toLowerCase())!;
            parent._directReports.push(node);
        } else {
            rootNodes.push(node);
        }
    });

    // 3. Recursive Aggregation
    const aggregate = (node: ProcessedEmployee) => {
        const jobTitle = getVal(node, ['Job Title', 'Position']).toLowerCase();
        const type = getVal(node, ['DL/IDL/Staff', 'Employee Type']).toLowerCase();

        // Self-stats (for parent to consume)
        let isSupervisor = jobTitle.includes('supervisor') || jobTitle.includes('team leader');
        let isSpecialist = jobTitle.includes('specialist') || jobTitle.includes('engineer');
        let isStaff = type.includes('staff');
        let isIdl = type.includes('idl');

        // Aggregate children
        node._reportsCount = node._directReports.length; // Direct reports only? Or recursive? Usually total structure is recursive.
        // Let's do recursive "Under" count
        let recursiveReports = 0;

        node._directReports.forEach(child => {
            const childStats = aggregate(child);
            recursiveReports += 1 + childStats.recursiveTotal; // 1 (child itself) + its descendants

            node._staffCount += childStats.staff + (childStats.isStaff ? 1 : 0);
            node._idlCount += childStats.idl + (childStats.isIdl ? 1 : 0);
            node._supervisorCount += childStats.sup + (childStats.isSup ? 1 : 0);
            node._specialistCount += childStats.spec + (childStats.isSpec ? 1 : 0);
        });

        return {
            recursiveTotal: recursiveReports,
            staff: node._staffCount,
            idl: node._idlCount,
            sup: node._supervisorCount,
            spec: node._specialistCount,
            isStaff, isIdl, isSup: isSupervisor, isSpec: isSpecialist
        };
    };

    // Run aggregation on all roots (and thus all nodes)
    // Note: We need to iterate all nodes to ensure disconnected graphs are also calculated if using map, 
    // but standard recursion via roots covers connected components. 
    // Better: Iterate values of map to ensure everyone processed if roots missing.
    // Actually, for "How many under X", we just need to start at X.
    // But to prepopulate the dashboard, we run on roots.
    rootNodes.forEach(aggregate);

    return { rootNodes, allNodes: Array.from(employeeMap.values()) };
};


export default function DashboardPage() {
    const [rawData, setRawData] = useState<RawEmployee[]>([]);
    const [processedData, setProcessedData] = useState<ProcessedEmployee[]>([]);
    const [loading, setLoading] = useState(true);

    // Slicers / Filters
    const [selectedDept, setSelectedDept] = useState<string>('All');
    const [selectedType, setSelectedType] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');

    // View State
    const [activeTab, setActiveTab] = useState<'overview' | 'roster'>('overview');

    useEffect(() => {
        async function init() {
            try {
                const res = await fetch('/api/sheet');
                const json = await res.json();
                if (json.success) {
                    const { allNodes } = buildHierarchyAndStats(json.data || []);
                    setRawData(json.data || []);
                    setProcessedData(allNodes);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        init();
    }, []);

    // --- Derived Data for UI ---
    const filteredData = useMemo(() => {
        return processedData.filter(emp => {
            const getVal = (k: string) => String(emp[k] || emp['DL/IDL/Staff'] || '').toLowerCase();

            // Dept Filter
            const dept = String(emp['Dept'] || emp['Department'] || '').trim();
            if (selectedDept !== 'All' && dept !== selectedDept) return false;

            // Type Filter
            const type = getVal('DL/IDL/Staff');
            if (selectedType !== 'All' && !type.includes(selectedType.toLowerCase())) return false;

            // Search
            if (searchQuery) {
                const search = searchQuery.toLowerCase();
                const matchesName = String(emp['FullName '] || emp['FullName'] || '').toLowerCase().includes(search);
                const matchesId = String(emp['Emp ID'] || '').toLowerCase().includes(search);
                const matchesTitle = String(emp['Job Title'] || '').toLowerCase().includes(search);
                if (!matchesName && !matchesId && !matchesTitle) return false;
            }

            return true;
        });
    }, [processedData, selectedDept, selectedType, searchQuery]);

    // Unique Depts for Slicer
    const departments = useMemo(() => {
        const s = new Set<string>();
        processedData.forEach(d => {
            const dept = String(d['Dept'] || d['Department'] || '').trim();
            if (dept) s.add(dept);
        });
        return Array.from(s).sort();
    }, [processedData]);

    // Calculations for Dashboard
    const stats = useMemo(() => {
        const total = filteredData.length;
        let staff = 0, idl = 0, managers = 0, sups = 0;

        // Role Breakdown Aggregation for the filtered set
        const roles: Record<string, number> = {};

        filteredData.forEach(d => {
            // Type
            const type = String(d['DL/IDL/Staff'] || '').toLowerCase();
            if (type.includes('staff')) staff++;
            if (type.includes('idl') || type.includes('dl')) idl++;

            // Role parsing
            const title = String(d['Job Title'] || '').toLowerCase();
            if (title.includes('manager') || title.includes('director')) managers++;
            if (title.includes('supervisor')) sups++;

            // Generic Role Grouping for Chart
            let roleGroup = 'Other';
            if (title.includes('director')) roleGroup = 'Director';
            else if (title.includes('manager')) roleGroup = 'Manager';
            else if (title.includes('supervisor')) roleGroup = 'Supervisor';
            else if (title.includes('specialist')) roleGroup = 'Specialist';
            else if (title.includes('officer')) roleGroup = 'Officer';
            else if (title.includes('operator')) roleGroup = 'Operator';

            roles[roleGroup] = (roles[roleGroup] || 0) + 1;
        });

        return { total, staff, idl, managers, sups, activeRoles: roles };
    }, [filteredData]);

    // Data for Charts
    const roleChartData = Object.entries(stats.activeRoles)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .filter(d => d.value > 0);

    // Managers with most Downline (Span of Control)
    // We look at the top managers in the *Filtered* view, but display their *Total* counts (pre-calculated)
    const topLeaders = useMemo(() => {
        return filteredData
            .filter(e => (e._staffCount + e._idlCount) > 0) // Only those with reports
            .sort((a, b) => (b._staffCount + b._idlCount) - (a._staffCount + a._idlCount))
            .slice(0, 10);
    }, [filteredData]);

    if (loading) return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-100">
            <div className="flex flex-col items-center gap-4">
                <ArrowPathIcon className="h-12 w-12 animate-spin text-blue-600" />
                <span className="font-semibold text-gray-500">Loading Data Model...</span>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen w-full flex-col bg-gray-50 text-slate-800 overflow-hidden font-sans">

            {/* --- Top Bar: Title & Global Slicers --- */}
            <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-blue-600 p-2 text-white">
                        <ChartBarIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold leading-tight text-gray-900">Executive HR Dashboard</h1>
                        <p className="text-xs text-gray-400 font-medium tracking-wide">REAL-TIME WORKFORCE ANALYTICS</p>
                    </div>
                </div>

                {/* Slicers Area */}
                <div className="flex items-center gap-3">
                    {/* Department Slicer */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <FunnelIcon className="h-4 w-4 text-gray-400" />
                        </div>
                        <select
                            value={selectedDept}
                            onChange={(e) => setSelectedDept(e.target.value)}
                            className="h-10 w-48 appearance-none rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-8 text-sm font-medium text-gray-700 outline-none hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                        >
                            <option value="All">All Departments</option>
                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>

                    {/* Type Slicer */}
                    <div className="relative">
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="h-10 w-40 appearance-none rounded-lg border border-gray-200 bg-gray-50 px-4 text-sm font-medium text-gray-700 outline-none hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                        >
                            <option value="All">All Types</option>
                            <option value="Staff">Staff Only</option>
                            <option value="IDL">IDL/DL Only</option>
                        </select>
                    </div>

                    {/* View Toggle */}
                    <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`p-2 rounded-md transition-all ${activeTab === 'overview' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <ChartBarIcon className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setActiveTab('roster')}
                            className={`p-2 rounded-md transition-all ${activeTab === 'roster' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <TableCellsIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* --- Main Content Area --- */}
            <main className="flex-1 overflow-hidden p-6 gap-6 flex flex-col">
                {activeTab === 'overview' ? (
                    <>
                        {/* 1. Metric Cards Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
                            <MetricCard label="Total Headcount" value={stats.total} sub="" color="blue" />
                            <MetricCard label="Staff Count" value={stats.staff} sub={`${((stats.staff / stats.total) * 100).toFixed(1)}% Ratio`} color="indigo" />
                            <MetricCard label="IDL / Operations" value={stats.idl} sub={`${((stats.idl / stats.total) * 100).toFixed(1)}% Ratio`} color="emerald" />
                            <MetricCard label="Leadership (Mgr+)" value={stats.managers} sub={`${stats.sups} Supervisors`} color="amber" />
                        </div>

                        <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
                            {/* 2. Left: Organization Health / Role Dist */}
                            <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 h-full overflow-hidden">
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col flex-1 min-h-[300px]">
                                    <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                                        <h3 className="font-bold text-gray-800">Job Title Distribution</h3>
                                        <AdjustmentsHorizontalIcon className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div className="flex-1 p-2">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={roleChartData} layout="vertical" margin={{ top: 10, right: 30, left: 60, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                                <XAxis type="number" hide />
                                                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11, fill: '#64748b' }} interval={0} />
                                                <RechartsTooltip
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                    cursor={{ fill: '#f8fafc' }}
                                                />
                                                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} background={{ fill: '#f8fafc' }} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Center/Right: Leadership Table with Calculated "Under" stats */}
                            <div className="col-span-12 lg:col-span-8 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-full overflow-hidden">
                                <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                                    <h3 className="font-bold text-gray-800">Organizational Impact (Leadership)</h3>
                                    <p className="text-xs text-gray-500 mt-1">Managers with the largest downstream organizations. "Deep Count" includes all recursive reports.</p>
                                </div>
                                <div className="flex-1 overflow-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-white sticky top-0 z-10 shadow-sm text-xs uppercase tracking-wider text-gray-500 font-semibold">
                                            <tr>
                                                <th className="px-6 py-4">Leader Name</th>
                                                <th className="px-6 py-4">Job Title</th>
                                                <th className="px-6 py-4 text-center">Total Team</th>
                                                <th className="px-6 py-4 text-center text-indigo-600">Staff Under</th>
                                                <th className="px-6 py-4 text-center text-emerald-600">IDL Under</th>
                                                <th className="px-6 py-4 text-center text-amber-600">Sups Under</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {topLeaders.map((leader, i) => (
                                                <tr key={i} className="hover:bg-blue-50/50 transition-colors">
                                                    <td className="px-6 py-3 font-medium text-gray-900 border-l-4 border-transparent hover:border-blue-500">
                                                        {leader['FullName '] || leader['FullName']}
                                                    </td>
                                                    <td className="px-6 py-3 text-gray-500">{leader['Job Title']}</td>
                                                    <td className="px-6 py-3 text-center font-bold text-gray-800">
                                                        {leader._staffCount + leader._idlCount}
                                                    </td>
                                                    <td className="px-6 py-3 text-center">
                                                        <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md font-bold text-xs">{leader._staffCount}</span>
                                                    </td>
                                                    <td className="px-6 py-3 text-center">
                                                        <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md font-bold text-xs">{leader._idlCount}</span>
                                                    </td>
                                                    <td className="px-6 py-3 text-center">
                                                        <span className="text-gray-400 font-medium">{leader._supervisorCount}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {topLeaders.length === 0 && (
                                                <tr><td colSpan={6} className="text-center py-10 text-gray-400">No leadership data to display based on filters</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    /* --- ROSTER VIEW (Table) --- */
                    <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4">
                            <div className="relative flex-1 max-w-sm">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by Name, ID, or Title..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 text-sm"
                                />
                            </div>
                            <div className="text-sm text-gray-500">
                                Showing <strong>{filteredData.length}</strong> records
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 sticky top-0 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3 border-b border-gray-200">ID</th>
                                        <th className="px-6 py-3 border-b border-gray-200">Name</th>
                                        <th className="px-6 py-3 border-b border-gray-200">Title</th>
                                        <th className="px-6 py-3 border-b border-gray-200">Department</th>
                                        <th className="px-6 py-3 border-b border-gray-200">Type</th>
                                        <th className="px-6 py-3 border-b border-gray-200">Manager</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredData.slice(0, 100).map((row: any, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="px-6 py-3 text-gray-500 font-mono text-xs">{row['Emp ID']}</td>
                                            <td className="px-6 py-3 font-medium text-gray-900">{row['FullName '] || row['FullName']}</td>
                                            <td className="px-6 py-3 text-gray-600">{row['Job Title']}</td>
                                            <td className="px-6 py-3 text-gray-600">{row['Dept'] || row['Department']}</td>
                                            <td className="px-6 py-3">
                                                <span className={`px-2 py-0.5 rounded textxs font-bold ${String(row['DL/IDL/Staff']).toLowerCase().includes('staff')
                                                        ? 'bg-indigo-100 text-indigo-700'
                                                        : 'bg-emerald-100 text-emerald-700'
                                                    }`}>
                                                    {row['DL/IDL/Staff']}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-gray-500 text-xs">{row['Line Manager']}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredData.length > 100 && (
                                <div className="p-4 text-center text-sm text-gray-400 bg-gray-50 border-t border-gray-100">
                                    Showing first 100 of {filteredData.length} entries. Use search to find specific people.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

// --- Subcomponents ---
function MetricCard({ label, value, sub, color }: any) {
    const colors: Record<string, string> = {
        blue: 'border-blue-500 text-blue-600',
        indigo: 'border-indigo-500 text-indigo-600',
        emerald: 'border-emerald-500 text-emerald-600',
        amber: 'border-amber-500 text-amber-600',
    };

    return (
        <div className={`bg-white p-5 rounded-xl border-t-4 shadow-sm flex flex-col justify-between ${colors[color].split(' ')[0]}`}>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
            <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-gray-800">{value}</span>
            </div>
            {sub && <span className={`text-xs font-bold mt-1 ${colors[color].split(' ')[1]}`}>{sub}</span>}
        </div>
    );
}
