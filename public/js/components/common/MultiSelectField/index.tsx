// @ts-nocheck
/**
 * MultiSelectField — Memoized
 */
import React, { memo, useEffect, useRef, useState } from "react";
import { DownArrow } from "../../../assets/data/icons";
import useClickOutside from "../../../hooks/useClickOutside";

const MultiSelectField = memo(({
  label,
  placeholder,
  value = [],
  onChange,
  options = [],
  maxSelection,
  className = "mb-4",
}) => {
  const [selectedItems, setSelectedItems] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef(null);

  const dropdownContainerRef = useClickOutside(() => {
    setIsOpen(false);
    setSearchTerm("");
  });

  useEffect(() => {
    setSelectedItems(value);
  }, [value]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus(); // Auto-focus search field when dropdown opens
    }
  }, [isOpen]);

  const maxReached = Number.isFinite(Number(maxSelection))
    && Number(maxSelection) > 0
    && selectedItems.length >= Number(maxSelection);

  const handleSelect = (selectedOption) => {
    if (selectedItems.some((item) => item.value === selectedOption.value)) return;
    if (maxReached) return;

    const newSelectedItems = [...selectedItems, selectedOption];
    setSelectedItems(newSelectedItems);
    onChange(newSelectedItems);
  };

  const handleRemove = (removedValue) => {
    const updatedItems = selectedItems.filter(
      (item) => item.value !== removedValue
    );
    setSelectedItems(updatedItems);
    onChange(updatedItems);
  };

  const filteredOptions = options
    ?.filter((option) =>
      option.label?.toLowerCase().includes(searchTerm?.toLowerCase())
    )
    .filter(
      (option) =>
        !selectedItems.some((selected) => selected.value === option.value)
    );

  return (
    <div className={`flex flex-col relative ${className}`} ref={dropdownContainerRef}>
      {label && (
        <label className="text-sm font-normal text-primary mb-1">{label}</label>
      )}
      <div
        className="w-full text-sm text-gray-600 bg-[#F6F6F6]  px-3 py-2.5 rounded cursor-pointer flex flex-wrap gap-1 items-center focus:ring-2 focus:ring-primary"
        onClick={() => {
          setIsOpen(!isOpen);
        }}
      >
        {selectedItems.length > 0 ? (
          selectedItems.map((item, index) => (
            <span
              key={index}
              className="bg-primary text-white text-xs px-2 py-1 rounded flex items-center gap-1"
            >
              {item.label || "-"}
              <span
                className="cursor-pointer ml-1 text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(item.value);
                }}
              >
                ✕
              </span>
            </span>
          ))
        ) : (
          <span className="text-gray-400">
            {placeholder || "Select options"}
          </span>
        )}
        <div className="ml-auto pointer-events-none">
          <DownArrow />
        </div>
      </div>

      {isOpen && (
        <div className="relative text-xs mt-1 w-full bg-[#F6F6F6] border border-gray-300 rounded shadow-md z-[2147483647] max-h-40 overflow-auto">
          {/* Search Input */}
          <input
            type="text"
            ref={searchInputRef}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border-b border-gray-300 outline-none sticky top-0 text-sm"
            placeholder="Search..."
          />

          {/* Filtered Options */}
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <div
                key={index}
                className={`px-3 py-2 text-gray-600 ${
                  maxReached ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-gray-200"
                }`}
                onClick={() => {
                  if (!maxReached) handleSelect(option);
                }}
              >
                {option.label}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-gray-400">No options found</div>
          )}
        </div>
      )}
    </div>
  );
});

export default MultiSelectField;
