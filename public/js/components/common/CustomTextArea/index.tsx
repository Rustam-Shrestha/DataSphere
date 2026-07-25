// @ts-nocheck
/**
 * CustomTextArea — Memoized (uses forwardRef)
 */
import React, { memo, useEffect, useRef, forwardRef } from "react";

const CustomTextArea = memo(forwardRef(
  (
    { id, label, value, placeholder, icon, onChange, error, name, ...props },
    forwardedRef
  ) => {
    const internalRef = useRef(null);
    const textareaRef = forwardedRef || internalRef;

    useEffect(() => {
      if (textareaRef?.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, 180)}px`;
      }
    }, [value, textareaRef]);

    return (
      <div className="flex flex-col">
        {label && (
          <label className="text-sm font-normal mb-1 text-primary">
            {label}
          </label>
        )}

        <div className="relative">
          <textarea
            {...props}
            ref={textareaRef}
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={7}
            className="w-full text-sm bg-white text-gray-700 border border-gray-300 rounded-md shadow-sm px-3 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-y min-h-[180px]"
          />

          {icon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
        </div>

        {error && <span className="text-red text-sm mt-1">{error}</span>}
      </div>
    );
  }
));

export default CustomTextArea;
