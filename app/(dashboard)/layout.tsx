"use client";
import Sidebar from "@/components/Sidebar";
import { AppBackdrop } from "@/components/ui/foundation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppBackdrop>
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-6 px-5 py-5 lg:grid-cols-[280px_1fr]">
        <Sidebar />
        <main className="min-w-0 space-y-6">{children}</main>
      </div>
    </AppBackdrop>
  );
}
