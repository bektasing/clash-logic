import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import { SettingsProvider } from "@/lib/settings-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clash Logic",
  description: "Clash of Clans upgrade tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark">
      <body className="min-h-screen bg-background font-sans antialiased">
        <SettingsProvider>
          {children}
          <Toaster />
        </SettingsProvider>
      </body>
    </html>
  );
}
