"use client";

import { usePathname } from "next/navigation";

import { authClient } from "@louez/auth/client";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  SidebarFooter,
  SidebarHeader,
  Sidebar as UISidebar,
  TooltipProvider,
} from "@louez/ui";
import { LogoutIcon, SettingsIcon } from "@louez/ui/icons";

import { DashboardNavigation } from "@/components/dashboard/dashboard-navigation";
import { UserAvatar } from "@/components/dashboard/shared/user-avatar";
import { SidebarLink } from "@/components/dashboard/sidebar-link";
import { useStorefrontUrl } from "@/hooks/use-storefront-url";

interface StoreWithRole {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  onboardingCompleted: boolean;
  role: "owner" | "member" | "platform_admin";
}

interface DashboardSidebarProps {
  stores: StoreWithRole[];
  currentStoreId: string;
  storeSlug?: string;
  userId: string;
  userName?: string | null;
  userEmail: string;
  userImage?: string | null;
  planSlug?: string;
  isPlatformAdmin?: boolean;
  aiCredits?: { low: boolean; credits: number | null; hasUsedCredits: boolean } | null;
  marketplaceListingUrl: string | null;
  isFromReeent: boolean;
  reservationsPaused: boolean;
}

const UserMenu = ({
  userId,
  userName,
  userEmail,
  userImage,
}: Pick<DashboardSidebarProps, "userId" | "userName" | "userEmail" | "userImage">) => (
  <DropdownMenu>
    <DropdownMenuTrigger
      render={
        <Button
          variant="ghost"
          className="h-auto min-w-0 w-full justify-start gap-3 rounded-lg px-2 py-2.5 text-sidebar-foreground hover:bg-card group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
        />
      }
    >
      <UserAvatar src={userImage} seed={userId} size={36} />
      <span className="min-w-0 text-left group-data-[collapsible=icon]:hidden">
        <span className="block truncate text-sm font-medium">{userName || userEmail}</span>
        <span className="block text-xs text-sidebar-foreground/55">Администратор</span>
      </span>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="w-56">
      <DropdownMenuItem render={<SidebarLink href="/dashboard/account" />}>
        <SettingsIcon className="mr-2 size-4" />
        Профиль
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        className="cursor-pointer text-destructive"
        onClick={() =>
          authClient.signOut({
            fetchOptions: {
              onSuccess: () => {
                window.location.href = "/login";
              },
            },
          })
        }
      >
        <LogoutIcon className="mr-2 size-4" />
        Выйти
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

export const DashboardSidebar = ({
  storeSlug,
  userId,
  userName,
  userEmail,
  userImage,
}: DashboardSidebarProps) => {
  const pathname = usePathname();
  const { getAbsoluteUrl } = useStorefrontUrl(storeSlug ?? "");

  return (
    <TooltipProvider>
      <UISidebar variant="sidebar" collapsible="icon">
        <SidebarHeader className="h-20 justify-center border-b border-sidebar-border px-5 group-data-[collapsible=icon]:px-2">
          <SidebarLink
            href="/dashboard"
            className="flex items-center gap-3 text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            <span aria-hidden className="h-5 w-8 -skew-x-12 bg-primary" />
            <span className="text-xl font-bold tracking-[0.18em] group-data-[collapsible=icon]:hidden">
              ПРОКАТ
            </span>
          </SidebarLink>
        </SidebarHeader>

        <DashboardNavigation pathname={pathname} catalogHref={getAbsoluteUrl()} />

        <SidebarFooter className="mt-auto border-t border-sidebar-border p-3">
          <UserMenu
            userId={userId}
            userName={userName}
            userEmail={userEmail}
            userImage={userImage}
          />
        </SidebarFooter>
      </UISidebar>
    </TooltipProvider>
  );
};
