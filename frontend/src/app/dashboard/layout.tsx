"use client";

import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { MobileHeader } from "@/components/dashboard/mobile-header";
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav";
import { PageLoadingSkeleton } from "@/components/dashboard/page-loading-skeleton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return null;
  }

  return (
    <>
      {/* Desktop Layout with Sidebar */}
      <SidebarProvider className="hidden md:flex">
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <DashboardHeader />
            <main className="flex-1 overflow-y-auto bg-muted/40">
              <Suspense fallback={<PageLoadingSkeleton />}>
                {children}
              </Suspense>
            </main>
          </div>
        </div>
      </SidebarProvider>

      {/* Mobile Layout with Bottom Nav */}
      <div className="md:hidden flex flex-col min-h-screen">
        <MobileHeader />
        <main className="flex-1 overflow-y-auto bg-muted/40 pb-16">
          <Suspense fallback={<PageLoadingSkeleton />}>
            {children}
          </Suspense>
        </main>
        <MobileBottomNav />
      </div>
    </>
  );
}
