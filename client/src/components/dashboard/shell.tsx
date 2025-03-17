import React from "react";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex-1 relative overflow-hidden bg-gradient-to-b from-gray-800 to-gray-700">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]"></div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-800/10 via-gray-800/70 to-gray-800/70"></div>
      
      {/* Content */}
      <div className="relative z-10 space-y-4 p-4 pt-6 md:p-8">
        {children}
      </div>
    </div>
  );
}