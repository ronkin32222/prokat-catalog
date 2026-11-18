import type { ReactNode } from "react";
import { Separator, SidebarInset } from "@louez/ui";
export const DashboardContentFrame = ({
  trigger,
  breadcrumbs,
  actions,
  children,
}: {
  trigger: ReactNode;
  breadcrumbs: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) => {
  return (
    <SidebarInset className="min-h-0 min-w-0 overflow-clip">
      <header className="bg-background z-30 flex h-16 shrink-0 items-center gap-3 border-b px-3 sm:px-5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {trigger}
          <Separator orientation="vertical" className="h-4 shrink-0" />
          {breadcrumbs}
        </div>
        {actions}
      </header>
      <div
        data-dashboard-content
        className="min-h-0 flex-1 overflow-x-clip overflow-y-auto overscroll-contain px-3 sm:px-5 lg:px-6"
      >
        <div className="min-h-full py-4 pb-2 md:py-6">{children}</div>
      </div>
    </SidebarInset>
  );
};
