import React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface DashboardCardProps extends React.ComponentPropsWithoutRef<typeof Card> {
  children: React.ReactNode;
  gradient?: boolean;
  className?: string;
  hoverEffect?: boolean;
}

export function DashboardCard({
  children,
  gradient = false,
  hoverEffect = true,
  className,
  ...props
}: DashboardCardProps) {
  return (
    <Card
      className={cn(
        "border border-white/5 bg-white/5 backdrop-blur-sm shadow-lg",
        gradient && "bg-gradient-to-b from-white/10 to-white/5",
        hoverEffect && "transition-all duration-300 hover:shadow-xl hover:bg-white/10",
        className
      )}
      {...props}
    >
      {children}
    </Card>
  );
}