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
  primary: "bg-[#166534] text-white hover:bg-[#15803D] active:bg-[#14532D] shadow-xs focus-visible:ring-[#166534]/30",
  secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100 shadow-xs focus-visible:ring-gray-300",
  outline: "bg-transparent text-[#166534] border border-[#166534] hover:bg-emerald-50 active:bg-emerald-100/60 focus-visible:ring-[#166534]/30",
  ghost: "bg-transparent text-gray-700 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200/70 border-transparent",
  danger: "bg-[#DC2626] text-white hover:bg-[#B91C1C] active:bg-[#991B1B] shadow-xs focus-visible:ring-red-400",
  subtle: "bg-[#DCFCE7] text-[#166534] hover:bg-[#BBF7D0] active:bg-[#86EFAC] focus-visible:ring-[#166534]/30",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-2.5 text-xs gap-1.5 rounded-[6px] font-medium",
  md: "h-9 px-3.5 text-sm gap-2 rounded-[8px] font-medium",
  lg: "h-11 px-5 text-base gap-2.5 rounded-[8px] font-semibold",
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
