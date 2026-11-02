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
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-700 mb-2 font-sans select-none"
          >
            {label}
            {props.required && <span className="text-[#DC2626] ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-slate-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full h-10 rounded-md border text-sm text-slate-900 bg-white placeholder-slate-400 transition-all duration-150",
              "focus:outline-none focus:border-[#15803D] focus:ring-2 focus:ring-[#15803D]/20",
              leftIcon ? "pl-9" : "px-3",
              rightIcon ? "pr-9" : "px-3",
              error
                ? "border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20 bg-red-50/10 text-red-950"
                : "border-slate-300 hover:border-slate-400",
              props.disabled && "bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 flex items-center text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-[#DC2626] mt-2 flex items-center gap-1 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-500 mt-2">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
