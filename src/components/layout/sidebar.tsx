'use client';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { niyamUser, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isFounder = niyamUser?.role === 'FOUNDER' || niyamUser?.role === 'HR_ADMIN';

  const employeeLinks = [
    { href: '/dashboard', label: 'Neural Pulse', icon: '🏠' },
    { href: '/dashboard/founder-compass', label: 'Founder Compass', icon: '🧭' },
    { href: '/dashboard/dna', label: 'My Neural DNA', icon: '🧬' },
    { href: '/dashboard/checkin', label: 'Weekly Rhythm', icon: '📅' },
    { href: '/dashboard/honing', label: 'Honing Lab', icon: '⚡' },
  ];

  const founderLinks = [
    { href: '/dashboard', label: 'Neural Pulse', icon: '🏠' },
    { href: '/dashboard/founder-compass', label: 'Founder Compass', icon: '🧭' },
    { href: '/dashboard/hr', label: 'Org Neural Insights', icon: '📊' },
  ];

  const links = isFounder ? founderLinks : employeeLinks;

  const navigate = (href: string) => {
    router.push(href);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <>
      <div className="p-5 sm:p-6 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center text-white font-black text-base sm:text-lg">N</div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">NIYAM</h1>
              <p className="text-[9px] sm:text-[10px] font-bold text-amber-600 tracking-widest">NEURAL CLOUD · V1.0</p>
            </div>
          </div>
          {/* Close button — mobile only */}
          <button onClick={() => setMobileOpen(false)} className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      <nav className="flex-1 p-3 sm:p-4 space-y-1">
        {links.map(link => {
          const active = pathname === link.href;
          return (
            <button key={link.href} onClick={() => navigate(link.href)} className={`w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${active ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
              <span className="text-base sm:text-lg">{link.icon}</span>
              {link.label}
            </button>
          );
        })}
      </nav>

      <div className="p-3 sm:p-4 border-t border-slate-100">
        <div className="px-3 sm:px-4 py-2 mb-2">
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">{niyamUser?.role} · {niyamUser?.level}</p>
          <p className="text-xs sm:text-sm font-semibold text-slate-700 truncate">{niyamUser?.displayName}</p>
          <p className="text-[10px] sm:text-xs text-slate-400 truncate">{niyamUser?.email}</p>
        </div>
        <button onClick={() => { signOut(); setMobileOpen(false); }} className="w-full px-3 sm:px-4 py-2 text-xs font-bold text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all text-left">Sign Out</button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button onClick={() => setMobileOpen(true)} className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm hover:shadow-md transition-all">
        <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside className={`lg:hidden fixed left-0 top-0 h-full w-[280px] bg-white border-r border-slate-200 flex flex-col z-50 transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-[240px] bg-white border-r border-slate-200 flex-col z-40">
        {sidebarContent}
      </aside>
    </>
  );
}
