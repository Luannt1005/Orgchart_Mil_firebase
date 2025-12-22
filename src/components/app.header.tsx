'use client';

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useOrgData } from "@/hooks/useOrgData";
import "@/styles/appheader.css";

function AppHeader() {
  const pathname = usePathname();
  const { groups, loading } = useOrgData();

  const [search, setSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
   * Filter theo search
   */
  const filteredGroups = groups.filter(name =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* HEADER */}
      <header className="mwk-header">
        <div className="mwk-container">
          {/* Logo - Left */}
          <Link href="/" className="mwk-logo">
            <Image
              src="/milwaukee_logo.png"
              width={140}
              height={50}
              alt="Milwaukee logo"
            />
          </Link>

          {/* Navigation - Right */}
          <nav className="mwk-nav">
            <Link
              href="/Orgchart"
              className={`mwk-nav-link ${pathname === "/Orgchart" ? "active" : ""}`}
            >
              Sơ đồ Tổ chức
            </Link>
            <Link
              href="/Global_Orgchart"
              className={`mwk-nav-link ${pathname === "/Global_Orgchart" ? "active" : ""}`}
            >
              Dashboard HR
            </Link>
            <Link
              href="/Customize"
              className={`mwk-nav-link ${pathname === "/Customize" ? "active" : ""}`}
            >
              Tùy chỉnh
            </Link>

            {/* Dropdown */}
            <div className="mwk-dropdown">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="mwk-nav-link dropdown-toggle"
              >
                Departments
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M6 9L1 4h10z"></path>
                </svg>
              </button>

              {/* Dropdown Menu */}
              <div
                className={`mwk-dropdown-menu ${isDropdownOpen ? "show" : ""}`}
                onMouseLeave={() => setIsDropdownOpen(false)}
              >
                {/* Search Box */}
                <div className="mwk-dropdown-search">
                  <input
                    type="text"
                    className="mwk-dropdown-input"
                    placeholder="Tìm phòng ban..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                {/* List with Scroll */}
                <div className="mwk-dropdown-list">
                  {loading && (
                    <div className="mwk-dropdown-item disabled">
                      Loading...
                    </div>
                  )}

                  {!loading && filteredGroups.length === 0 && (
                    <div className="mwk-dropdown-item disabled">
                      No result
                    </div>
                  )}

                  {!loading &&
                    filteredGroups.map(name => (
                      <Link
                        key={name}
                        href={name
                      ? `/Orgchart?group=${encodeURIComponent(name)}`
                      : "/Orgchart"}
                        className="mwk-dropdown-item"
                      >
                        {name}
                      </Link>
                    ))}
                </div>

                {/* Footer */}
                <div className="mwk-dropdown-footer">
                  <Link
                        href={"/Orgchart"}
                        className="mwk-dropdown-item"
                      >
                        Xem tất cả phòng ban
                      </Link>
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
