"use client";

import { createContext, useContext, type ComponentProps } from "react";

import {
  BarChart3,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  Package,
  Settings,
  Store,
  Users,
} from "lucide-react";

import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@louez/ui";

import { SidebarLink } from "@/components/dashboard/sidebar-link";

type LocalNavigation = {
  href: string;
  availableHrefs?: string[];
  onNavigate: (href: string) => void;
};

const NavigationContext = createContext<LocalNavigation | undefined>(undefined);

const NavigationLink = ({ href, onClick, ...props }: ComponentProps<typeof SidebarLink>) => {
  const local = useContext(NavigationContext);
  const navigationHref = String(href);
  const unavailable = local?.availableHrefs && !local.availableHrefs.includes(navigationHref);

  return (
    <SidebarLink
      {...props}
      aria-disabled={unavailable || undefined}
      tabIndex={unavailable ? -1 : undefined}
      href={local?.href ?? href}
      prefetch={local ? false : undefined}
      data-navigation-href={navigationHref}
      onClick={(event) => {
        onClick?.(event);
        if (local && !event.defaultPrevented) {
          event.preventDefault();
          if (!unavailable) local.onNavigate(navigationHref);
        }
      }}
    />
  );
};

interface NavigationItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  external?: boolean;
  isActive: (pathname: string) => boolean;
}

const dashboardNavigation = (catalogHref: string): NavigationItem[] => [
  {
    label: "Обзор",
    href: "/dashboard",
    icon: LayoutDashboard,
    isActive: (pathname) => pathname === "/dashboard",
  },
  {
    label: "Бронирования",
    href: "/dashboard/reservations",
    icon: CalendarDays,
    isActive: (pathname) => pathname.startsWith("/dashboard/reservations"),
  },
  {
    label: "Оборудование",
    href: "/dashboard/products",
    icon: Package,
    isActive: (pathname) =>
      pathname.startsWith("/dashboard/products") || pathname.startsWith("/dashboard/inventory"),
  },
  {
    label: "Каталог",
    href: catalogHref,
    icon: Store,
    external: true,
    isActive: () => false,
  },
  {
    label: "Клиенты",
    href: "/dashboard/customers",
    icon: Users,
    isActive: (pathname) => pathname.startsWith("/dashboard/customers"),
  },
  {
    label: "Платежи",
    href: "/dashboard/settings/payments",
    icon: CreditCard,
    isActive: (pathname) => pathname.startsWith("/dashboard/settings/payments"),
  },
  {
    label: "Аналитика",
    href: "/dashboard/analytics/sales",
    icon: BarChart3,
    isActive: (pathname) => pathname.startsWith("/dashboard/analytics"),
  },
  {
    label: "Настройки",
    href: "/dashboard/settings",
    icon: Settings,
    isActive: (pathname) =>
      pathname.startsWith("/dashboard/settings") &&
      !pathname.startsWith("/dashboard/settings/payments"),
  },
];

export const DashboardNavigation = ({
  pathname,
  catalogHref = "/",
  localNavigation,
}: {
  pathname: string;
  catalogHref?: string;
  localNavigation?: LocalNavigation;
}) => (
  <NavigationContext value={localNavigation}>
    <SidebarContent className="px-2 py-4">
      <SidebarGroup className="p-0">
        <SidebarGroupContent>
          <SidebarMenu className="gap-1.5">
            {dashboardNavigation(catalogHref).map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  render={
                    <NavigationLink
                      href={item.href}
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noreferrer" : undefined}
                    />
                  }
                  isActive={item.isActive(pathname)}
                  tooltip={item.label}
                  className="h-11 rounded-lg px-3 text-sm transition-colors duration-200 data-active:bg-primary data-active:text-primary-foreground data-active:shadow-none data-active:[&>svg]:text-primary-foreground motion-reduce:transition-none"
                >
                  <item.icon className="size-5" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  </NavigationContext>
);
