import { ReactNode } from "react";
import { Link } from "wouter";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, description, icon, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 p-6 rounded-xl bg-gradient-to-r from-gray-900/60 to-gray-800/60 backdrop-blur-sm shadow-lg border border-white/5">
      <div className="flex items-start md:items-center gap-4">
        <Link href="/">
          <div className="h-14 w-14 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-colors cursor-pointer mr-2">
            <img 
              src="/images/dentamind-ai-logo.png" 
              alt="DentaMind AI" 
              className="h-12 w-12 hover:scale-110 transition-transform duration-300" 
            />
          </div>
        </Link>
        
        {icon && (
          <div className="h-14 w-14 flex items-center justify-center rounded-full bg-gradient-to-br from-green-600 to-green-500 text-white shadow-md">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold text-white">{title}</h1>
          {description && <p className="text-green-100/80 mt-1">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-3 mt-2 md:mt-0">{actions}</div>}
    </div>
  );
}