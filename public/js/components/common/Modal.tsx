// @ts-nocheck
/**
 * Modal Component — Memoized
 *
 * Wrapped in React.memo to prevent re-renders when parent state
 * changes but modal props haven't changed.
 */
import React, { memo } from "react";
import { CloseIcon } from "../../assets/data/icons";

const Modal = memo(({
  size = "xl",
  title,
  className = "bg-primary",
  description = "",
  onClose,
  zIndex = "z-[2147483647]",
  children,
}) => {
  const sizeClasses = {
    sm: "max-w-[500px] max-h-[90vh]",
    md: "max-w-[650px] max-h-[90vh]",
    lg: "max-w-[800px] max-h-[92vh]",
    xl: "max-w-[1000px] max-h-[92vh]",
    "2xl": "max-w-[1200px] max-h-[94vh]",
    xxl: "max-w-[1200px] max-h-[94vh]",
    xxxl: "max-w-[1400px] max-h-[95vh]",
    "4xl": "max-w-[1600px] max-h-[96vh]",
    xxxxl: "max-w-[1600px] max-h-[96vh]",
    full: "w-[98vw] max-h-[98vh]"
  };
  const selectedSizeClass = sizeClasses[size] || sizeClasses.xl;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-opacity-50 ${zIndex} p-2 sm:p-4 overflow-hidden`}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        className={`rounded-lg border flex flex-col overflow-hidden w-full min-w-0 ${selectedSizeClass}`}
        style={{
          backgroundColor: 'var(--surface-color)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-color)'
        }}
      >
        {/* Header - Fixed */}
        <div
          className={`flex justify-between items-center ${className} text-base sm:text-lg font-medium text-white font-sans p-2 sm:p-3 rounded-t-lg flex-shrink-0`}
        >
          <div className="w-full min-w-0">
            <h2 className="truncate text-sm sm:text-lg">{title}</h2>
            {description && <p className="text-[10px] sm:text-xs truncate">{description}</p>}
          </div>
          <button
            onClick={onClose}
            title="Close modal"
            aria-label="Close modal"
            className="flex-shrink-0 ml-2 hover:opacity-80 transition-opacity"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-4 min-w-0 w-full">
          {children}
        </div>
      </div>
    </div>
  );
});

export default Modal;

