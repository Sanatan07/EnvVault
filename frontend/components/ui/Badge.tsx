import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "outline";
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        {
          "bg-indigo-100 text-indigo-700 border-indigo-200": variant === "default",
          "bg-green-100 text-green-700 border-green-200": variant === "success",
          "bg-yellow-100 text-yellow-700 border-yellow-200": variant === "warning",
          "bg-red-100 text-red-700 border-red-200": variant === "danger",
          "bg-blue-100 text-blue-700 border-blue-200": variant === "info",
          "border-gray-300 text-gray-700 bg-white": variant === "outline",
        },
        className
      )}
      {...props}
    />
  )
);
Badge.displayName = "Badge";

export { Badge };
