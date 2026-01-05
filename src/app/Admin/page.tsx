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
        <div className="min-h-screen bg-transparent font-sans text-slate-800 flex flex-col">
            {/* Header / Tabs */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-30 px-6 shrink-0">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-900 rounded-lg shadow-sm">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <h1 className="text-lg font-bold text-gray-900 tracking-tight">Admin Console</h1>
                        </div>

                        <div className="h-6 w-px bg-gray-200"></div>

                        <nav className="flex space-x-1">
                            <button
                                onClick={() => setActiveTab('users')}
                                className={`
                                    inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all
                                    ${activeTab === 'users'
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}
                                `}
                            >
                                <UsersIcon className="w-5 h-5 mr-2" />
                                Users
                            </button>
                            <button
                                onClick={() => setActiveTab('import')}
                                className={`
                                    inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all
                                    ${activeTab === 'import'
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}
                                `}
                            >
                                <CloudArrowUpIcon className="w-5 h-5 mr-2" />
                                Import
                            </button>
                            <button
                                onClick={() => setActiveTab('approvals')}
                                className={`
                                    inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all
                                    ${activeTab === 'approvals'
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}
                                `}
                            >
                                <ClipboardDocumentCheckIcon className="w-5 h-5 mr-2" />
                                Approvals
                            </button>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-6 overflow-hidden">
                <div className="h-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {activeTab === 'users' && (
                        <div className="h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <UserManagement />
                        </div>
                    )}

                    {activeTab === 'import' && (
                        <div className="h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <DataImport />
                        </div>
                    )}

                    {activeTab === 'approvals' && (
                        <div className="h-full overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <SheetManager initialShowApprovalOnly={true} enableApproval={true} />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
