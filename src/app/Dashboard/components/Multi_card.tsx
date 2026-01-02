import React, { useMemo } from 'react';
import { useSheetData } from '@/hooks/useSheetData';
import type { EmployeeFilter } from '../page';
import { OrgNode } from '@/types/orgchart';

interface StatCardProps {
    title: string;
    count: number;
    loading?: boolean;
    onClick?: () => void;
    isActive?: boolean;
}

interface StatsCardsProps {
    className?: string;
    onFilterChange?: (filter: EmployeeFilter) => void;
    activeFilter?: EmployeeFilter;
    nodes?: OrgNode[];
    loading?: boolean;
}

// Compact StatCard for 72px height
const StatCard: React.FC<StatCardProps> = ({ title, count, loading, onClick, isActive }) => {
    if (loading) {
        return (
            <div className="h-[72px] bg-white rounded-lg shadow-sm flex flex-col items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-1">
                    <div className="h-5 bg-gray-200 rounded w-10"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={onClick}
            className={`
                h-[72px] w-full bg-white rounded-lg shadow-sm
                flex flex-col items-center justify-center gap-0.5
                transition-all duration-200 cursor-pointer
                border
                ${isActive
                    ? 'border-[#C40000] shadow-md ring-2 ring-red-100'
                    : 'border-transparent hover:shadow-md hover:border-gray-200'
                }
            `}
        >
            {/* Count - Large number */}
            <div className="text-xl font-bold text-[#0F172A] leading-tight">
                {count.toLocaleString()}
            </div>
            {/* Label - Small uppercase */}
            <div className="text-[10px] font-medium text-[#64748B] uppercase tracking-wide text-center px-1 truncate max-w-full">
                {title}
            </div>
        </button>
    );
};

const StatsCards: React.FC<StatsCardsProps> = ({ className, onFilterChange, activeFilter, nodes: propNodes, loading: propLoading }) => {
    const { nodes: fetchedNodes, loading: fetchedLoading, error } = useSheetData();

    const nodes = propNodes || fetchedNodes;
    const loading = propLoading !== undefined ? propLoading : fetchedLoading;

    // Helper to count by job title
    const countByTitle = (titleKeyword: string) => {
        if (!nodes || nodes.length === 0) return 0;

        const keywords = titleKeyword
            .toLowerCase()
            .trim()
            .split(/\s+/);

        return nodes.filter((node: any) => {
            const titleWords = (node['Job Title'] || node['title'] || '')
                .toLowerCase()
                .split(/[^a-z0-9]+/i);
            return keywords.every(k => titleWords.includes(k));
        }).length;
    };

    // Calculate all stats
    const stats = useMemo(() => {
        if (!nodes || nodes.length === 0) {
            return {
                specialist: 0,
                supervisor: 0,
                manager: 0,
                director: 0,
                shiftLeader: 0,
                lineLeader: 0,
                warehouseKeeper: 0,
                coordinator: 0,
                technician: 0,
                operator: 0,
                trainee: 0,
                engineer: 0
            };
        }

        return {
            specialist: countByTitle('specialist'),
            supervisor: countByTitle('supervisor'),
            manager: countByTitle('manager'),
            director: countByTitle('director'),
            shiftLeader: countByTitle('shift leader'),
            lineLeader: countByTitle('line leader'),
            warehouseKeeper: countByTitle('warehouse keeper') + countByTitle('warehouse storekeeper'),
            coordinator: countByTitle('coordinator'),
            technician: countByTitle('technician'),
            operator: countByTitle('operator'),
            trainee: countByTitle('trainee'),
            engineer: countByTitle('engineer')
        };
    }, [nodes]);

    // Job title cards - show top 6 by count
    const titleCards = [
        { title: 'Operator', count: stats.operator, filterValue: 'operator' },
        { title: 'Technician', count: stats.technician, filterValue: 'technician' },
        { title: 'Specialist', count: stats.specialist, filterValue: 'specialist' },
        { title: 'Supervisor', count: stats.supervisor, filterValue: 'supervisor' },
        { title: 'Engineer', count: stats.engineer, filterValue: 'engineer' },
        { title: 'Manager', count: stats.manager, filterValue: 'manager' },
        { title: 'Coordinator', count: stats.coordinator, filterValue: 'coordinator' },
        { title: 'Director', count: stats.director, filterValue: 'director' },
        { title: 'Shift Leader', count: stats.shiftLeader, filterValue: 'shift leader' },
        { title: 'Line Leader', count: stats.lineLeader, filterValue: 'line leader' },
        { title: 'WH Keeper', count: stats.warehouseKeeper, filterValue: 'warehouse keeper' },
        { title: 'Trainee', count: stats.trainee, filterValue: 'trainee' }
    ];

    // Sort by count and take top 6
    const visibleCards = titleCards
        .filter(card => card.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

    if (error) {
        return (
            <div className={className}>
                <div className="text-center text-red-600 p-4 bg-red-50 rounded-lg text-sm">
                    Error loading data
                </div>
            </div>
        );
    }

    return (
        <div className={className}>
            {visibleCards.map((card, index) => (
                <StatCard
                    key={index}
                    title={card.title}
                    count={card.count}
                    loading={loading}
                    onClick={() => onFilterChange?.({
                        type: 'title',
                        value: card.filterValue,
                        label: card.title
                    })}
                    isActive={activeFilter?.type === 'title' && activeFilter?.value === card.filterValue}
                />
            ))}
        </div>
    );
};

export default StatsCards;
