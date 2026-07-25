// @ts-nocheck
/**
 * SelectFilter Component — Refactored
 *
 * CHANGES:
 * - Replaced manual click-outside logic with reusable useClickOutside hook
 * - Wrapped in React.memo for performance
 * - Same visual behavior as before
 */
import React, { memo, useState } from "react";
import { DownArrow } from "../../../assets/data/icons";
import useClickOutside from "../../../hooks/useClickOutside";

const SelectFilter = memo(({
  options,
  value,
  onChange,
  placeholder = "Select...",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Reusable hook replaces manual addEventListener/removeEventListener pattern
  const containerRef = useClickOutside(() => setIsOpen(false));

  const selectedOption = options?.find((opt) => opt.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* Select Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between gap-2 w-full
          text-xs border border-white/30 rounded-lg px-3 py-2
          bg-transparent text-white
          transition-all duration-200
          hover:bg-white/10 hover:border-white/50
          min-w-32
          ${value ? "bg-white/20 border-white/50" : ""}
          ${isOpen ? "bg-white/20 border-white" : ""}
        `}
      >
        <span className="truncate">{displayText}</span>
        <DownArrow
          className={`w-3 h-3 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu - Always opens downward */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-[2147483647] min-w-full">
          {/* Options List */}
          <div className="py-1 max-h-60 overflow-y-auto">
            {/* Clear Option */}
            <div
              className={`px-3 py-2 cursor-pointer text-xs flex items-center justify-between ${
                !value
                  ? "font-medium text-gray-700"
                  : "hover:bg-gray-50 text-gray-700"
              }`}
              onClick={() => handleSelect("")}
            >
              <span>{placeholder}</span>
              {!value && <span>✓</span>}
            </div>

            {/* Filter Options */}
            {options?.map((option) => (
              <div
                key={option.value}
                className={`px-3 py-2 cursor-pointer text-xs flex items-center justify-between ${
                  value === option.value
                    ? "font-medium text-gray-700"
                    : "hover:bg-gray-50 text-gray-700"
                }`}
                onClick={() => handleSelect(option.value)}
              >
                <span>{option.label}</span>
                {value === option.value && <span>✓</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export default SelectFilter;
