// @ts-nocheck
/**
 * CustomCheckbox — Memoized
 */
import React, { memo } from 'react';

const CustomCheckbox = memo(({
  label,
  value,
  checked,
  onChange,
  className = "",
  name,
  id,
  tickColor = "text-white",
  ...rest
}) => {
  const [generatedId] = React.useState(() => `checkbox-${Math.random().toString(36).substr(2, 9)}`);
  const ID = id || name || generatedId;
  const isChecked = checked !== undefined ? checked : value;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Hidden Checkbox */}
      <input
        type="checkbox"
        id={ID}
        name={name}
        checked={isChecked}
        onChange={onChange}
        className="peer hidden"
        {...rest}
      />

      {/* Custom Styled Checkbox */}
      <label
        htmlFor={ID}
        className="flex items-center justify-center w-5 h-5 border-2 border-primary rounded cursor-pointer 
        bg-white peer-checked:bg-primary peer-checked:border-primary transition-colors duration-300"
      >
        {/* White Tick Icon */}
        {isChecked && (
          <svg
            className={`w-4 h-4 ${tickColor}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            ></path>
          </svg>
        )}
      </label>

      {/* Checkbox Label */}
      <label
        htmlFor={ID}
        className="text-sm font-medium text-gray-600 cursor-pointer"
      >
        {label}
      </label>
    </div>
  );
});

export default CustomCheckbox;
