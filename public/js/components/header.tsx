// @ts-nocheck
/**
 * Header Component — Refactored
 *
 * CHANGES:
 * - Replaced Context API (useModal, useTheme) with Redux hooks (useAuth, useUI)
 * - Eliminated prop drilling to UserProfile (was passing 6+ props)
 * - Extracted sub-components: DesktopNav, MobileNav, ThemeCustomizer
 * - Theme restoration on mount now uses Redux instead of ThemeContext
 * - Wrapped in React.memo for performance
 *
 * Same visual behavior as before.
 */
import React, { memo, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getNavItems } from "../assets/data";
import useAuth from "../hooks/useAuth";
import useUI from "../hooks/useUI";
import DesktopNav from "./common/DesktopNav";
import MobileNav from "./common/MobileNav";
import ThemeCustomizer from "./common/ThemeCustomizer";
import UserProfile from "./user";

const Header = () => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [activeNavItem, setActiveNavItem] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Redux hooks — replace useModal() and useTheme()
  const { userData } = useAuth();
  const { showThemeModal, updateTheme } = useUI();

  // Build nav items from permissions (same logic as before)
  const permissions = userData?.permissions || [];
  const navItems = getNavItems(permissions, userData?.isSuperUser);

  // Restore saved theme on mount (replaces old useEffect with updateTheme from ThemeContext)
  useEffect(() => {
    const savedTheme = localStorage.getItem("selectedTheme");
    if (savedTheme) {
      updateTheme(savedTheme);
    }
  }, [updateTheme]);

  // Navigation handlers
  const handleMouseEnter = useCallback((label) => setOpenDropdown(label), []);
  const handleMouseLeave = useCallback(() => setOpenDropdown(null), []);

  const toggleDropdown = useCallback(
    (label) => {
      setActiveNavItem(label);
      setOpenDropdown((prev) => (prev === label ? null : label));
    },
    []
  );

  const handleNavClick = useCallback(
    (label) => {
      setActiveNavItem(label);
      if (navItems.find((item) => item.label === label)?.hasDropdown) {
        toggleDropdown(label);
      }
    },
    [navItems, toggleDropdown]
  );

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  return (
    <header className="sticky top-0 left-0 right-0 z-[110]" style={{ backgroundColor: 'var(--surface-color)', color: 'var(--text-color)' }}>
      <div
        onMouseLeave={handleMouseLeave}
        className="flex justify-between items-center px-4 py-3 border-b"
        style={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)' }}
      >
        <div className="text-lg font-light">
          <Link to="/">
            <img src="/ybc-logo.avif" alt="logo" className="w-full h-10" />
          </Link>
        </div>

        {/* Hamburger Menu Button - visible on mobile/tablet */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          title="Toggle navigation menu"
          aria-label="Toggle navigation menu"
          className="lg:hidden flex flex-col gap-1.5 p-2 rounded transition-all"
          style={{ color: 'var(--text-color)' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-muted)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <span className="w-6 h-0.5 transition-all" style={{ backgroundColor: 'var(--text-color)' }}></span>
          <span className="w-6 h-0.5 transition-all" style={{ backgroundColor: 'var(--text-color)' }}></span>
          <span className="w-6 h-0.5 transition-all" style={{ backgroundColor: 'var(--text-color)' }}></span>
        </button>

        {/* Theme Modal — reads state from Redux, no prop drilling */}
        {showThemeModal && <ThemeCustomizer />}

        {/* Desktop Navigation — extracted sub-component */}
        <DesktopNav
          navItems={navItems}
          activeNavItem={activeNavItem}
          openDropdown={openDropdown}
          onMouseEnter={handleMouseEnter}
          onNavClick={handleNavClick}
        />

        {/* User Profile — no longer receives any props, reads from Redux */}
        <div className="hidden lg:block">
          <UserProfile />
        </div>
      </div>

      {/* Mobile Navigation — extracted sub-component */}
      <MobileNav
        navItems={navItems}
        activeNavItem={activeNavItem}
        openDropdown={openDropdown}
        mobileMenuOpen={mobileMenuOpen}
        onToggleDropdown={toggleDropdown}
        onCloseMobileMenu={closeMobileMenu}
      />
    </header>
  );
};

export default memo(Header);
