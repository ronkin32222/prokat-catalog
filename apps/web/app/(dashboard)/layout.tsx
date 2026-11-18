import type { Metadata, Viewport } from "next";
import { Suspense } from "react";

import { getCurrentStore } from "@/lib/store-context";

import { DashboardLayoutContent } from "./dashboard-layout-content";

export const generateMetadata = async (): Promise<Metadata> => {
  // The tab carries the store's own name and logo, not the product's.
  const store = await getCurrentStore().catch(() => null);
  const name = store?.name ?? "Каталог проката";
  return {
    title: { default: `${name} · Админка`, template: `%s · ${name}` },
    ...(store?.logoUrl ? { icons: { icon: store.logoUrl, apple: store.logoUrl } } : {}),
    manifest: "/manifest.webmanifest",
    appleWebApp: { capable: true, title: name, statusBarStyle: "default" },
  };
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

// Authentication and active-store selection are request-bound security gates.
export const instant = false;

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
};

export default DashboardLayout;
