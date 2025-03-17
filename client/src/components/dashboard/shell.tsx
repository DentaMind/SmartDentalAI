import React from "react";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex-1 relative overflow-hidden bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 space-y-4 p-4 pt-6 md:p-8">
        {children}
      </div>
    </div>
  );
}