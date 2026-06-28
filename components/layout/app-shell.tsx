"use client";

import { Sidebar } from "@/components/layout/sidebar";
import type { GlobalStats } from "@/lib/calculator";

interface AppShellProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  townHallLevel: number | null;
  globalStats: GlobalStats | null;
}

export function AppShell({ children, header, townHallLevel, globalStats }: AppShellProps) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden md:block">
        <Sidebar townHallLevel={townHallLevel} globalStats={globalStats} />
      </div>

      <main className="flex flex-1 flex-col">
        {header}
        {children}
      </main>
    </div>
  );
}
