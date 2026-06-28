"use client";

import { Sidebar } from "@/components/layout/sidebar";

interface AppShellProps {
  children: React.ReactNode;
  header?: React.ReactNode;
}

export function AppShell({ children, header }: AppShellProps) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <main className="flex flex-1 flex-col">
        {header}
        {children}
      </main>
    </div>
  );
}
