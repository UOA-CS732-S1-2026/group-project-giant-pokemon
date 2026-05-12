"use client";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-800 via-blue-700 to-blue-400">
      <Sidebar />
      <main className="flex-1 p-10 text-white">
        {children}
      </main>
    </div>
  );
}
