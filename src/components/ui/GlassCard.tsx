import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type GlassCardTag = "div" | "article" | "section";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: GlassCardTag;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, as: Tag = "div", children, ...props }, ref) => {
    return (
      <Tag
        ref={ref as React.Ref<HTMLDivElement>}
        className={cn("glass p-6", className)}
        {...props}
      >
        {children}
      </Tag>
    );
  }
);
GlassCard.displayName = "GlassCard";
