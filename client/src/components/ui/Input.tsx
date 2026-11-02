import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = "", id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5 font-sans">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full rounded-lg border text-sm text-gray-900 bg-white placeholder-gray-400 transition-all duration-150",
              "focus:outline-none focus:ring-2 focus:ring-[#166534]/25 focus:border-[#166534]",
              leftIcon ? "pl-9" : "pl-3.5",
              rightIcon ? "pr-9" : "pr-3.5",
              "py-2",
              error
                ? "border-red-400 focus:ring-red-400/25 focus:border-red-500 bg-red-50/10 text-red-950"
                : "border-gray-300 hover:border-gray-400",
              props.disabled && "bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 flex items-center text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-gray-500 mt-1.5">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
