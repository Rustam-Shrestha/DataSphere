// @ts-nocheck
/**
 * DesktopNav — Extracted sub-component
 * 
 * The desktop navigation bar, extracted from the monolithic Header component.
 * Receives nav items and handlers as props from the Header (local UI concerns).
 * 
 * Memoized with React.memo to prevent unnecessary re-renders when
 * unrelated Header state changes (e.g., mobile menu toggle).
 */
import React, { memo } from "react";
import { Link } from "react-router-dom";
import { DownArrow } from "../../../assets/data/icons";

const DesktopNav = ({
  navItems,
  activeNavItem,
  openDropdown,
  onMouseEnter,
  onNavClick,
}) => {
  return (
    <div className="hidden lg:flex text-sm items-center px-4 py-2 relative" style={{ color: 'var(--text-color)' }}>
      {navItems.map((item, index) => (
        <div
          onMouseEnter={() =>
            !item.isDisable && onMouseEnter(item.label)
          }
          onClick={() => !item.isDisable && onNavClick(item.label)}
          key={index}
          className="relative group"
        >
          <Link
            to={!item.isDisable ? item.path : "#"}
            className={`font-light text-xs flex items-center cursor-pointer ${
              activeNavItem === item.label
                ? "text-primary font-normal"
                : item.isDisable
                ? "text-gray-400 cursor-not-allowed"
                : "hover:text-primary"
            } ${
              index !== navItems.length - 1
                ? "border-r pr-4 mr-4"
                : ""
            }`}
            onClick={(e) => {
              if (item.isDisable) e.preventDefault();
            }}
          >
            {item.label}
            {item.hasDesktopDropdown && !item.isDisable && (
              <DownArrow
                onClick={() => onNavClick(item.label)}
                className={`${
                  openDropdown === item.label ? "rotate-180" : "rotate-0"
                }`}
              />
            )}
          </Link>

          {item.hasDesktopDropdown &&
            openDropdown === item.label &&
            !item.isDisable && (
              <ul className="absolute left-0 top-8 z-50 border rounded shadow-lg w-40" style={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)' }}>
                {item.dropdownItems?.map((dropdownItem, dropdownIndex) => (
                  <li key={dropdownIndex} className="hover:bg-gray-100 :bg-gray-700 cursor-pointer">
                    <Link
                      to={dropdownItem.path}
                      className="block px-4 py-2 text-sm" style={{ color: 'var(--text-color)' }}
                    >
                      {dropdownItem.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
        </div>
      ))}
    </div>
  );
};

export default memo(DesktopNav);
