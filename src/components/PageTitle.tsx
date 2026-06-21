import { ReactNode } from "react";

interface PageTitleProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
}

export function PageTitle({ icon, title, subtitle }: PageTitleProps) {
  return (
    <div className="space-y-1 mb-6">
      <div className="flex items-center gap-2">
        {icon && <span className="text-primary">{icon}</span>}
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      </div>
      {subtitle && (
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}
