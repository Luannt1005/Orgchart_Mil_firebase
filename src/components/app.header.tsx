'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

/**
 * Type đúng theo API của bạn
 */
type ApiItem = {
  name: string;
  tags?: string[];
};

function AppHeader() {
  const pathname = usePathname();

  const [groups, setGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  /**
   * Điều hướng sang Orgchart theo group
   */
  const goOrgChart = (group?: string) => {
    const url = group
      ? `/Orgchart?group=${encodeURIComponent(group)}`
      : "/Orgchart";

    window.location.href = url;
  };

  /**
   * Load danh sách group
   */
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await fetch("/api/get_data", { cache: "no-store" });
        const result = await res.json();

        const list: ApiItem[] = result.data ?? [];

        const names: string[] = Array.from(
          new Set(
            list
              .filter(item => item.tags?.includes("group"))
              .map(item => item.name)
              .filter(Boolean)
          )
        ).sort();

        setGroups(names);
      } catch (error) {
        console.error("Failed to load group names", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  /**
   * Filter theo search
   */
  const filteredGroups = groups.filter(name =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* HEADER */}
      <header className="fixed left-0 right-0 top-0 z-50 bg-red-700 shadow-lg h-16 flex items-center">
        <div className="container mx-auto px-4">
          {/* NAVBAR - Single Row */}
          <nav className="flex items-center justify-between py-3">
            {/* LEFT: LOGO */}
            <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition">
              <Image
                src="/milwaukee_logo.png"
                width={120}
                height={50}
                alt="Milwaukee logo"
              />
            </Link>

            {/* RIGHT: NAVIGATION ITEMS */}
            <div className="flex items-center gap-2">
              {/* Main Navigation Links */}
              <Link
                href="/Global_Orgchart"
                className={`text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  pathname === "/Global_Orgchart"
                    ? "text-white bg-white/20 px-3 py-2 rounded"
                    : "text-white hover:bg-white/20 px-3 py-2 rounded"
                }`}
              >
                Global Orgchart
              </Link>

              <Link
                href="/Customize"
                className={`text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  pathname === "/Customize"
                    ? "text-white bg-white/20 px-3 py-2 rounded"
                    : "text-white hover:bg-white/20 px-3 py-2 rounded"
                }`}
              >
                Customize
              </Link>

              <Link
                href="/Orgchart"
                className={`text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  pathname === "/Orgchart"
                    ? "text-white bg-white/20 px-3 py-2 rounded"
                    : "text-white hover:bg-white/20 px-3 py-2 rounded"
                }`}
              >
                Orgchart
              </Link>

              {/* Dropdown */}
              <div className="relative group">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="text-sm font-medium text-white hover:bg-white/20 px-3 py-2 rounded transition-all duration-200 flex items-center gap-1"
                >
                  More
                  <span className="text-xs">▼</span>
                </button>

                {/* Dropdown Menu */}
                <div
                  className={`absolute right-0 mt-1 w-80 bg-white rounded-lg shadow-xl overflow-hidden transform transition-all duration-200 origin-top ${
                    isDropdownOpen
                      ? "opacity-100 scale-y-100 visible"
                      : "opacity-0 scale-y-95 invisible"
                  }`}
                  onMouseLeave={() => setIsDropdownOpen(false)}
                >
                  {/* Search Box */}
                  <div className="p-3 border-b border-gray-200">
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-700 text-sm"
                      placeholder="Search department..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  {/* List with Scroll */}
                  <div className="max-h-72 overflow-y-auto">
                    {loading && (
                      <div className="px-4 py-3 text-gray-500 text-sm text-center">
                        Loading...
                      </div>
                    )}

                    {!loading && filteredGroups.length === 0 && (
                      <div className="px-4 py-3 text-gray-500 text-sm text-center">
                        No result
                      </div>
                    )}

                    {!loading &&
                      filteredGroups.map(name => (
                        <button
                          key={name}
                          onClick={() => {
                            goOrgChart(name);
                            setIsDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-gray-700 text-sm hover:bg-red-50 transition-colors duration-100"
                        >
                          Orgchart {name}
                        </button>
                      ))}
                  </div>

                  {/* Footer */}
                  <div className="border-t border-gray-200 p-3">
                    <button
                      onClick={() => {
                        goOrgChart();
                        setIsDropdownOpen(false);
                      }}
                      className="w-full text-left text-sm font-medium text-red-700 hover:bg-red-50 px-3 py-2 rounded transition-colors"
                    >
                      All Orgchart
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </nav>
        </div>
      </header>
    </>
  );
}

export default AppHeader;
