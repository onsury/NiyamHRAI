'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { niyamUser, signOut } = useAuth();
  const isFounder = niyamUser?.role === 'FOUNDER' || niyamUser?.role === 'HR_ADMIN';

  const employeeLinks = [
    { href: '/dashboard', label: 'Neural Pulse', icon: '🏠' },
    { href: '/dashboard/founder-compass', label: 'Founder Compass', icon: '🧭' },
    { href: '/dashboard/my-dna', label: 'My Neural DNA', icon: '🧬' },
    { href: '/dashboard/checkin', label: 'Weekly Rhythm', icon: '📅' },
    { href: '/dashboard/honing', label: 'Honing Lab', icon: '⚡' },
  ];

  const founderLinks = [
    { href: '/dashboard', label: 'Neural Pulse', icon: '🏠' },
    { href: '/dashboard/founder-compass', label: 'Founder Compass', icon: '🧭' },
    { href: '/dashboard/org-insights', label: 'Org Neural Insights', icon: '📊' },
  ];

  const links = isFounder ? founderLinks : employeeLinks;

  return (
    <aside className="fixed left-0 top-0 h-full w-[240px] bg-white border-r border-slate-200 flex flex-col z-40 hidden lg:flex">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center text-white font-black text-lg">N</div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">NIYAM</h1>
            <p className="text-[10px] font-bold text-amber-600 tracking-widest">NEURAL CLOUD · V1.0</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map(link => {
          const active = pathname === link.href;
          return (
            <button key={link.href} onClick={() => router.push(link.href)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${active ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
              <span className="text-lg">{link.icon}</span>
              {link.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="px-4 py-2 mb-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{niyamUser?.role} · {niyamUser?.level}</p>
          <p className="text-sm font-semibold text-slate-700 truncate">{niyamUser?.displayName}</p>
        </div>
        <button onClick={() => signOut()} className="w-full px-4 py-2 text-xs font-bold text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all text-left">Sign Out</button>
      </div>
    </aside>
  );
}