'use client';

import React, { useState, useEffect, useRef } from 'react';
import { OrgNode } from '@/types/orgchart';

interface ManagerFilterProps {
    nodes: OrgNode[];
    onSelect: (managerId: string | number | null, managerName?: string) => void;
    selectedManagerId: string | number | null;
}

const ManagerFilter: React.FC<ManagerFilterProps> = ({ nodes, onSelect, selectedManagerId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Filter potential managers
    const filteredNodes = searchTerm.trim() === ''
        ? []
        : nodes.filter(node =>
            node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(node.id).toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 8);

    const selectedManager = nodes.find(n => n.id === selectedManagerId);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <div className="relative">
                <input
                    type="text"
                    placeholder="Search person..."
                    className={`
                        w-44 px-3 py-1.5 text-xs font-medium
                        bg-white border rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent
                        transition-all duration-200
                        ${selectedManagerId
                            ? 'border-purple-300 bg-purple-50 text-purple-700'
                            : 'border-gray-200 text-gray-700'
                        }
                    `}
                    value={selectedManager ? selectedManager.name : searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        if (selectedManagerId) onSelect(null);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                />
                {selectedManagerId ? (
                    <button
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-600 transition-colors"
                        onClick={() => {
                            onSelect(null);
                            setSearchTerm('');
                        }}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                ) : (
                    <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                )}
            </div>

            {isOpen && filteredNodes.length > 0 && (
                <div className="absolute z-50 w-56 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                    {filteredNodes.map((node) => (
                        <button
                            key={node.id}
                            className="w-full text-left px-3 py-2 hover:bg-purple-50 flex items-center gap-2 transition-colors border-b border-gray-50 last:border-0"
                            onClick={() => {
                                onSelect(node.id, node.name);
                                setSearchTerm('');
                                setIsOpen(false);
                            }}
                        >
                            <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[9px] font-bold shrink-0">
                                {node.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-semibold text-[#0F172A] truncate">{node.name}</span>
                                <span className="text-[9px] text-[#94A3B8] truncate">{node.title}</span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ManagerFilter;
