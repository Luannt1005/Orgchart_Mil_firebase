'use client';

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useOrgData } from "@/hooks/useOrgData";
import "@/styles/appheader.css";

function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { groups, loading } = useOrgData();

  const [search, setSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get user info from localStorage or session
    const storedUser = localStorage.getItem("user");
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log("User loaded from localStorage:", parsedUser);
        console.log("User name:", parsedUser.name);
        console.log("All user keys:", Object.keys(parsedUser));
        setUser(parsedUser);
      } catch (e) {
        console.error("Failed to parse user data", e);
        localStorage.removeItem("user");
        // Redirect to login if stored data is invalid
        if (pathname !== "/login") {
          router.push("/login");
        }
      }
    } else {
      // No user data found, redirect to login
      if (pathname !== "/login") {
        router.push("/login");
      }
    }
    
    setIsLoading(false);
  }, [pathname, router]);

  useEffect(() => {
    // Close user menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen]);

  /**
   * Đăng xuất
   */
  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setIsUserMenuOpen(false);
    window.location.href = "/login";
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

          {/* Navigation - Center */}
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
              href="/SheetManager"
              className={`mwk-nav-link ${pathname === "/SheetManager" ? "active" : ""}`}
            >
              Edit table HR
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

          {/* User Profile - Right */}
          {!isLoading && user && (
            <div className="mwk-user-section" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="mwk-user-button"
                title={user.email || ""}
              >
                <div className="mwk-user-avatar">
                  {user.name && user.name.length > 0 ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="mwk-user-info">
                  <div className="mwk-user-name">{user.name && user.name.length > 0 ? user.name : "User"}</div>
                </div>
              </button>

              {/* User Dropdown Menu */}
              <div className={`mwk-user-dropdown ${isUserMenuOpen ? "show" : ""}`}>
                <div className="mwk-user-dropdown-header">
                  <div className="mwk-user-dropdown-avatar">
                    {user.name && user.name.length > 0 ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="mwk-user-dropdown-info">
                    <div className="mwk-user-dropdown-name">{user.name && user.name.length > 0 ? user.name : "User"}</div>
                    <div className="mwk-user-dropdown-email">{user.email || ""}</div>
                  </div>
                </div>
                <div className="mwk-user-dropdown-divider"></div>
                <button
                  onClick={handleLogout}
                  className="mwk-user-logout-btn"
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
}

export default AppHeader;
