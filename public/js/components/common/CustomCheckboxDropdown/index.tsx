// @ts-nocheck
/**
 * CustomCheckboxDropdown — Refactored
 *
 * CHANGES:
 * - Replaced manual click-outside with useClickOutside hook
 * - Wrapped in React.memo
 */
import React, { memo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import useClickOutside from '../../../hooks/useClickOutside';

const CustomCheckboxDropdown = memo(({ options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useClickOutside(() => setIsOpen(false));

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      onChange(options.map(option => option.value));
    } else {
      onChange([]);
    }
  };

  const handleOptionChange = (optionValue) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  // Click-outside handling is now done by useClickOutside hook above

  const isAllSelected = options.length > 0 && value.length === options.length;

  const getDisplayValue = () => {
    if (value.length === 0) {
      return placeholder;
    }
    if (value.length === options.length) {
      return 'All Months';
    }
    if (value.length === 1) {
      return value[0];
    }
    return `${value.length} months selected`;
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 text-sm text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
      >
        <span className="truncate">{getDisplayValue()}</span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-[2147483647] w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          <div className="p-2">
            <label className="flex items-center px-2 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50 rounded">
              <input
                type="checkbox"
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                checked={isAllSelected}
                onChange={handleSelectAll}
              />
              <span className="ml-2">All</span>
            </label>
            <div className="my-1 border-t border-gray-200"></div>
            {options.map(option => (
              <label key={option.value} className="flex items-center px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  checked={value.includes(option.value)}
                  onChange={() => handleOptionChange(option.value)}
                />
                <span className="ml-2">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export default CustomCheckboxDropdown;
