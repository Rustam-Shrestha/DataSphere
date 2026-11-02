import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/utils";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "subtle";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  children?: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-[#15803D] text-white hover:bg-[#166534] active:bg-[#14532D] shadow-subtle focus-visible:ring-[#15803D]/30 border-transparent",
  secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 shadow-subtle focus-visible:ring-slate-300",
  outline: "bg-transparent text-[#15803D] border border-[#15803D] hover:bg-[#DCFCE7]/50 active:bg-[#DCFCE7] focus-visible:ring-[#15803D]/30",
  ghost: "bg-transparent text-slate-700 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200/70 border-transparent",
  danger: "bg-[#DC2626] text-white hover:bg-[#B91C1C] active:bg-[#991B1B] shadow-subtle focus-visible:ring-red-400 border-transparent",
  subtle: "bg-[#DCFCE7] text-[#15803D] hover:bg-[#BBF7D0] active:bg-[#86EFAC] focus-visible:ring-[#15803D]/30 border-transparent",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-md font-medium",
  md: "h-10 px-4 text-sm gap-2 rounded-md font-semibold",
  lg: "h-11 px-5 text-base gap-2.5 rounded-md font-semibold",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      leftIcon,
      rightIcon,
      loading = false,
      disabled = false,
      fullWidth = false,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          "inline-flex items-center justify-center font-sans transition-all duration-150 cursor-pointer select-none",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 active:scale-[0.99]",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          isDisabled && "opacity-50 cursor-not-allowed active:scale-100 pointer-events-none",
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0 flex items-center">{leftIcon}</span>
        )}
        {children && <span>{children}</span>}
        {!loading && rightIcon && <span className="shrink-0 flex items-center">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
