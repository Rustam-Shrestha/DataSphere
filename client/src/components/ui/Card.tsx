import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  hoverable?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, hoverable = false, className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-white rounded-lg border border-slate-200 shadow-subtle transition-all duration-150",
          hoverable && "hover:border-slate-300 hover:shadow-level2",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4", className)}
      {...props}
    >
      {children}
    </div>
  )
);
CardHeader.displayName = "CardHeader";

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  icon?: ReactNode;
  children?: ReactNode;
}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ icon, children, className = "", ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-base font-semibold text-slate-900 flex items-center gap-2 tracking-tight", className)}
      {...props}
    >
      {icon && <span className="text-[#15803D] shrink-0">{icon}</span>}
      <span>{children}</span>
    </h3>
  )
);
CardTitle.displayName = "CardTitle";

export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children?: ReactNode;
}

export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ children, className = "", ...props }, ref) => (
    <p ref={ref} className={cn("text-xs text-slate-500 mt-1", className)} {...props}>
      {children}
    </p>
  )
);
CardDescription.displayName = "CardDescription";

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ children, className = "", ...props }, ref) => (
    <div ref={ref} className={cn("p-6", className)} {...props}>
      {children}
    </div>
  )
);
CardContent.displayName = "CardContent";

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ children, className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-6 py-4 bg-slate-50/70 border-t border-slate-200 rounded-b-lg flex items-center gap-3", className)}
      {...props}
    >
      {children}
    </div>
  )
);
CardFooter.displayName = "CardFooter";
