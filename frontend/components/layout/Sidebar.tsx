'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  Layers,
  Settings,
  ChevronLeft,
  ChevronRight,
  Rocket,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import Image from 'next/image';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderOpen },
  { name: 'Applications', href: '/applications', icon: Layers },
];

const bottomItems = [
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href);

  return (
    <div
      className={cn(
        'flex h-screen flex-col border-r border-white/5 bg-[#0a0a0a] transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-4 px-5 py-6 border-b border-white/5', collapsed ? 'justify-center py-5 px-2' : '')}>
        <div className={cn('flex flex-shrink-0 items-center justify-center rounded-lg overflow-hidden transition-all duration-300', collapsed ? 'h-8 w-8' : 'h-16 w-16')}>
          <Image src="/logo.png" alt="PLUTO" width={collapsed ? 32 : 64} height={collapsed ? 32 : 64} className="object-contain" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <span className="text-xl font-extrabold tracking-widest text-white font-sans uppercase leading-none block">PLUTO</span>
            <p className="text-[9px] font-medium tracking-wider text-zinc-500 uppercase mt-1">by Ginux</p>
          </div>
        )}
      </div>

      {/* Quick Deploy */}
      {!collapsed && (
        <div className="px-3 pt-4">
          <Link href="/deploy">
            <button className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-2 text-sm font-medium text-white transition-colors">
              <Rocket className="h-3.5 w-3.5" />
              New Deployment
            </button>
          </Link>
        </div>
      )}

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 px-2 pt-4 overflow-y-auto">
        <div className="mb-1">
          {!collapsed && (
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              Main
            </p>
          )}
          {navItems.map((item) => (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                  collapsed && 'justify-center',
                  isActive(item.href)
                    ? 'bg-white/10 text-white'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </div>
            </Link>
          ))}
        </div>
      </nav>

      {/* Bottom */}
      <div className="px-2 pb-2 border-t border-white/5 pt-2">
        {bottomItems.map((item) => (
          <Link key={item.name} href={item.href}>
            <div
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                collapsed && 'justify-center',
                isActive(item.href)
                  ? 'bg-white/10 text-white'
                  : 'text-zinc-400 hover:bg-white/5 hover:text-white'
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </div>
          </Link>
        ))}

        {/* User */}
        <div className={cn('flex items-center gap-3 rounded-lg px-3 py-2 mt-1', collapsed && 'justify-center')}>
          <div className="h-8 w-8 flex-shrink-0 rounded-full overflow-hidden bg-[#111] flex items-center justify-center">
            <Image src="/logo.png" alt="PLUTO" width={32} height={32} className="object-contain" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-extrabold tracking-wider text-white font-sans uppercase">PLUTO</p>
              <p className="text-[10px] text-zinc-500 truncate">admin</p>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center rounded-lg px-3 py-1.5 text-zinc-500 hover:text-white hover:bg-white/5 transition-colors mt-1"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
