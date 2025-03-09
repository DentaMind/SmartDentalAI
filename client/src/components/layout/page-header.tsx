import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, description, icon, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
      <div className="flex items-start md:items-center gap-4">
        {icon && (
          <div className="h-12 w-12 flex items-center justify-center rounded-full bg-primary/10 text-primary">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold text-white">{title}</h1>
          {description && <p className="text-white/80 mt-1">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-3 mt-2 md:mt-0">{actions}</div>}
    </div>
  );
}