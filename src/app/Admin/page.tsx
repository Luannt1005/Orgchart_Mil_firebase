"use client";

import { useState } from "react";
import UserManagement from "./components/UserManagement";
import DataImport from "./components/DataImport";
import SheetManager from "../SheetManager/page";

// Icons
import {
    UsersIcon,
    CloudArrowUpIcon,
    ClipboardDocumentCheckIcon
} from "@heroicons/react/24/outline";

export default function AdminDashboard() {
    type Tab = 'users' | 'import' | 'approvals';
    const [activeTab, setActiveTab] = useState<Tab>('users');

    return (
        <div className="flex h-screen bg-gray-50 font-sans text-slate-800 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 flex-shrink-0 flex flex-col transition-all duration-300">
                {/* Brand */}
                <div className="h-16 flex items-center px-6 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <span className="text-lg font-bold text-white tracking-tight">Admin<span className="text-slate-400 font-normal">Console</span></span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`
                            w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group
                            ${activeTab === 'users'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                        `}
                    >
                        <UsersIcon className={`w-5 h-5 mr-3 transition-colors ${activeTab === 'users' ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                        User Management
                    </button>

                    <button
                        onClick={() => setActiveTab('import')}
                        className={`
                            w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group
                            ${activeTab === 'import'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                        `}
                    >
                        <CloudArrowUpIcon className={`w-5 h-5 mr-3 transition-colors ${activeTab === 'import' ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                        Data Import
                    </button>

                    <button
                        onClick={() => setActiveTab('approvals')}
                        className={`
                            w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group
                            ${activeTab === 'approvals'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                        `}
                    >
                        <ClipboardDocumentCheckIcon className={`w-5 h-5 mr-3 transition-colors ${activeTab === 'approvals' ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                        Approvals
                    </button>
                </nav>

                {/* Footer User Info (Optional placeholder) */}
                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                            A
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">Administrator</p>
                            <p className="text-xs text-slate-500 truncate">admin@system.com</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50">
                {/* Top header area (optional, for breadcrumbs or actions) */}
                <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-gray-100 shrink-0">
                    <h2 className="text-xl font-bold text-slate-800">
                        {activeTab === 'users' && 'User Management'}
                        {activeTab === 'import' && 'Data Import'}
                        {activeTab === 'approvals' && 'Pending Approvals'}
                    </h2>
                    {/* Add global actions here if needed */}
                </header>

                <div className="flex-1 p-6 overflow-hidden">
                    <div className="h-full w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ring-1 ring-black/5">
                        {activeTab === 'users' && (
                            <div className="h-full animate-in fade-in zoom-in-95 duration-200">
                                <UserManagement />
                            </div>
                        )}

                        {activeTab === 'import' && (
                            <div className="h-full animate-in fade-in zoom-in-95 duration-200">
                                <DataImport />
                            </div>
                        )}

                        {activeTab === 'approvals' && (
                            <div className="h-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                <SheetManager initialShowApprovalOnly={true} enableApproval={true} />
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
