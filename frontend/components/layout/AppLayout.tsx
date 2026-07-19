'use client';

import { Sidebar } from './Sidebar';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-[#09090B]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
