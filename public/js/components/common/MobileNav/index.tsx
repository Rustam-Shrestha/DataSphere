// @ts-nocheck
/**
 * MobileNav — Extracted sub-component
 * 
 * The mobile/tablet navigation menu, extracted from the monolithic Header.
 * Manages its own dropdown state for mobile menu items.
 * 
 * Receives nav items and handlers as props from Header.
 * User data comes from Redux via useAuth hook instead of prop drilling.
 */
import React, { memo } from "react";
import { useNavigate } from "react-router-dom";
import { DownArrow } from "../../../assets/data/icons";
import useAuth from "../../../hooks/useAuth";
import useUI from "../../../hooks/useUI";

const MobileNav = ({
  navItems,
  activeNavItem,
  openDropdown,
  mobileMenuOpen,
  onToggleDropdown,
  onCloseMobileMenu,
}) => {
  const navigate = useNavigate();
  const { userData, logout } = useAuth();
  const { openThemeModal } = useUI();

  // Format current time for display
  const now = new Date();
  const hours = now.getHours();
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = now.getMinutes().toString().padStart(2, "0");

  const handleLogout = async () => {
    await logout();
    navigate("/login");
    onCloseMobileMenu();
  };

  return (
    <div
      className={`lg:hidden border-b overflow-hidden transition-all duration-300 ${
        mobileMenuOpen ? "max-h-screen" : "max-h-0"
      }`}
      style={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)' }}
    >
      <div className="px-4 py-3 space-y-2">
        {navItems.map((item, index) => (
          <div key={index}>
            <div
              className={`flex items-center justify-between py-2 px-3 rounded text-sm cursor-pointer ${
                activeNavItem === item.label
                    ? "bg-primary text-white font-medium"
                  : item.isDisable
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => {
                if (!item.isDisable) {
                  if (item.hasDropdown) {
                    onToggleDropdown(item.label);
                  } else {
                    navigate(item.path);
                    onCloseMobileMenu();
                  }
                }
              }}
            >
              <span>{item.label}</span>
              {item.hasDropdown && !item.isDisable && (
                <DownArrow
                  className={`transition-transform duration-200 ${
                    openDropdown === item.label ? "rotate-180" : "rotate-0"
                  }`}
                />
              )}
            </div>

            {/* Mobile Dropdown */}
            {item.hasDropdown &&
              openDropdown === item.label &&
              !item.isDisable && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.dropdownItems?.map((dropdownItem, dropdownIndex) => (
                    <div
                      key={dropdownIndex}
                      className="flex items-center py-2 px-3 text-sm hover:bg-gray-50 rounded cursor-pointer"
                      style={{ color: 'var(--text-color)' }}
                      onClick={() => {
                        navigate(dropdownItem.path);
                        onCloseMobileMenu();
                      }}
                    >
                      <span className="mr-2" style={{ color: 'var(--gray-column-text)' }}>›</span>
                      <span>{dropdownItem.label}</span>
                    </div>
                  ))}
                </div>
              )}
          </div>
        ))}

        {/* Mobile User Profile Section */}
        <div className="border-t pt-3 mt-3" style={{ borderColor: 'var(--border-color)' }}>
          <div className="py-2 px-3 text-sm" style={{ color: 'var(--text-color)' }}>
            <div className="font-medium">{userData?.name || "User"}</div>
            <div className="text-xs" style={{ color: 'var(--gray-column-text)' }}>
              {formattedHours}:{formattedMinutes} {hours >= 12 ? "PM" : "AM"}
            </div>
          </div>
          <button
            onClick={() => {
              openThemeModal();
              onCloseMobileMenu();
            }}
            className="w-full text-left py-2 px-3 text-sm hover:bg-gray-100 rounded"
            style={{ color: 'var(--text-color)' }}
          >
            Theme Settings
          </button>
          <button
            onClick={handleLogout}
            className="w-full text-left py-2 px-3 text-sm hover:bg-danger-50 rounded"
            style={{ color: 'var(--red)' }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(MobileNav);
