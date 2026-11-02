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
          "bg-white rounded-xl border border-gray-200/80 shadow-xs transition-all duration-200",
          hoverable && "hover:border-gray-300 hover:shadow-soft hover:-translate-y-0.5",
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
    <div ref={ref} className={cn("p-5 border-b border-gray-100 flex items-center justify-between gap-3", className)} {...props}>
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
    <h3 ref={ref} className={cn("text-base font-semibold text-gray-900 font-heading flex items-center gap-2", className)} {...props}>
      {icon && <span className="text-[#166534] shrink-0">{icon}</span>}
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
    <p ref={ref} className={cn("text-xs text-gray-500 mt-1", className)} {...props}>
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
    <div ref={ref} className={cn("p-5", className)} {...props}>
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
    <div ref={ref} className={cn("p-4 bg-gray-50/60 border-t border-gray-100 rounded-b-xl flex items-center gap-3", className)} {...props}>
      {children}
    </div>
  )
);
CardFooter.displayName = "CardFooter";
