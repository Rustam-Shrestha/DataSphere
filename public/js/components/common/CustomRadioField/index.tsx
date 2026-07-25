// @ts-nocheck
/**
 * CustomRadioField — Memoized
 */
import React, { memo } from "react";

const CustomRadioField = memo(({
  label,
  value,
  onChange,
  options = [],
  error,
  className,
  name,
  ...rest
}) => {
  return (
    <div className="flex flex-col mb-4">
      {label && (
        <label className="text-sm font-normal text-primary mb-2">{label}</label>
      )}
      <div className={`flex ${className ? className : "items-center"} gap-6`}>
        {options.map((option, _index) => (
          <div
            key={`${name}-${option.value}`}
            className="flex items-center space-x-2"
          >
            {/* Hidden Radio Input */}
            <input
              type="radio"
              id={`${name}-${option.value}`}
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={onChange}
              className="peer hidden"
              {...rest}
            />

            {/* Custom Radio Button */}
            <label
              htmlFor={`${name}-${option.value}`}
              className="flex items-center justify-center w-5 h-5 border-2 border-[#D0D5DD] rounded-full cursor-pointer bg-white peer-checked:bg-primary peer-checked:border-primary peer-checked:before:content-[''] peer-checked:before:w-2 peer-checked:before:h-2 peer-checked:before:rounded-full peer-checked:before:bg-white"
            ></label>

            {/* Label for the Option */}
            <label
              htmlFor={`${name}-${option.value}`}
              className="text-sm font-medium text-gray-600 cursor-pointer"
            >
              {option.label}
            </label>
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && <span className="text-red-500 text-sm mt-1">{error}</span>}
    </div>
  );
});

export default CustomRadioField;
