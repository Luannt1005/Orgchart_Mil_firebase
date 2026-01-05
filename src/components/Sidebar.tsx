'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    HomeIcon,
    ChartBarSquareIcon,
    CloudArrowUpIcon,
    TableCellsIcon,
    PencilSquareIcon,
    Cog6ToothIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    UserCircleIcon,
    ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [user, setUser] = useState<{ username: string; full_name: string; role?: string } | null>(null);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);



    useEffect(() => {
        // Load user from local storage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error('Failed to parse user', e);
            }
        }
    }, []);

    const handleLogout = async () => {
        try {
            await fetch('/api/logout', { method: 'POST' });
            localStorage.removeItem('user');
            window.location.href = '/login';
        } catch (e) {
            console.error(e);
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
    };

    const navItems = [
        { name: 'Org Chart', path: '/Orgchart', icon: HomeIcon },
        { name: 'Dashboard', path: '/Dashboard', icon: ChartBarSquareIcon },
        { name: 'Import HR Data', path: '/Import_HR_Data', icon: CloudArrowUpIcon },
        { name: 'Edit Table HR', path: '/SheetManager', icon: TableCellsIcon },
        { name: 'Customize Chart', path: '/Customize', icon: PencilSquareIcon },
        { name: 'Admin Console', path: '/Admin', icon: Cog6ToothIcon },
    ];

    // Hide sidebar on auth pages
    if (['/login', '/signup'].includes(pathname)) {
        return null;
    }

    return (
        <div
            className={`
        relative flex flex-col h-screen bg-gradient-to-b from-[#86010f] to-[#500000] text-white transition-all duration-300 ease-in-out shadow-2xl z-50
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
        >
            {/* Toggle Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-8 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-full p-1.5 text-white shadow-lg border border-white/20 transition-all z-50"
            >
                {isCollapsed ? <ChevronRightIcon className="w-3 h-3" /> : <ChevronLeftIcon className="w-3 h-3" />}
            </button>

            {/* Brand / Logo */}
            <div className={`h-20 flex items-center ${isCollapsed ? 'justify-center' : 'px-6'} border-b border-white/10 shrink-0`}>
                {isCollapsed ? (
                    <div className="w-10 h-10 relative">
                        <Image src="/milwaukee_logo.png" alt="Logo" fill className="object-contain brightness-0 invert" />
                    </div>
                ) : (
                    <Link href="/" className="flex items-center justify-center w-full">
                        <div className="relative h-12 w-40">
                            <Image
                                src="/milwaukee_logo.png"
                                alt="Milwaukee Logo"
                                fill
                                className="object-contain brightness-0 invert filter drop-shadow-md"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                priority
                            />
                        </div>
                    </Link>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1.5 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {navItems.map((item) => {
                    const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`
                flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden
                ${isActive
                                    ? 'bg-white/15 text-white shadow-inner font-semibold'
                                    : 'text-white/70 hover:bg-white/10 hover:text-white hover:shadow-lg hover:shadow-[#000000]/20'}
                ${isCollapsed ? 'justify-center' : ''}
              `}
                            title={isCollapsed ? item.name : ''}
                        >
                            {/* Active Indicator Line */}
                            {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-white rounded-r-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>}

                            <item.icon className={`w-6 h-6 shrink-0 transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]' : 'group-hover:scale-110'}`} />
                            {!isCollapsed && (
                                <span className={`ml-3 text-[15px] tracking-wide ${isActive ? 'text-white' : ''}`}>{item.name}</span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-white/10 bg-[#60000a]/30 backdrop-blur-sm" ref={userMenuRef}>
                {user ? (
                    <div>
                        <button
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            className={`flex items-center w-full ${isCollapsed ? 'justify-center' : 'gap-3'} p-2 rounded-lg hover:bg-white/10 transition-colors group`}
                        >
                            <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-sm font-bold text-white shadow-lg shrink-0 group-hover:border-white/40 transition-colors">
                                {user.full_name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            {!isCollapsed && (
                                <div className="flex-1 text-left min-w-0">
                                    <p className="text-sm font-semibold text-white truncate drop-shadow-sm">{user.full_name}</p>
                                    <p className="text-xs text-white/60 truncate group-hover:text-white/80 transition-colors">View Profile</p>
                                </div>
                            )}
                        </button>

                        {/* Dropup Menu */}
                        {isUserMenuOpen && (
                            <div className="absolute bottom-full left-4 right-4 mb-3 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2 z-50 min-w-[220px]">
                                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                                    <p className="text-sm font-bold text-gray-900 truncate">{user.full_name}</p>
                                    <p className="text-xs text-gray-500 truncate mt-0.5">@{user.username}</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors font-medium"
                                >
                                    <ArrowLeftOnRectangleIcon className="w-4 h-4 mr-2.5" />
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <Link
                        href="/login"
                        className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/10`}
                    >
                        <ArrowLeftOnRectangleIcon className="w-6 h-6 shrink-0" />
                        {!isCollapsed && <span className="text-sm font-semibold tracking-wide">Log In</span>}
                    </Link>
                )}
            </div>
        </div>
    );
}
