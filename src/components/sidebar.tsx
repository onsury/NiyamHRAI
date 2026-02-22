'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/types';

const navItems = [
  { id:'dashboard', href:'/dashboard', label:'Neural Pulse', roles:[UserRole.EMPLOYEE,UserRole.MANAGER,UserRole.HR_ADMIN,UserRole.FOUNDER], icon:<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
  { id:'founder-compass', href:'/dashboard/founder-compass', label:'Founder Compass', roles:[UserRole.EMPLOYEE,UserRole.MANAGER,UserRole.HR_ADMIN,UserRole.FOUNDER], icon:<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg> },
  { id:'dna', href:'/dashboard/dna', label:'My Neural DNA', roles:[UserRole.EMPLOYEE,UserRole.MANAGER], icon:<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
  { id:'checkin', href:'/dashboard/checkin', label:'Weekly Rhythm', roles:[UserRole.EMPLOYEE,UserRole.MANAGER], icon:<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg> },
  { id:'honing', href:'/dashboard/honing', label:'Honing Lab', roles:[UserRole.EMPLOYEE,UserRole.MANAGER], icon:<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
  { id:'hr', href:'/dashboard/hr', label:'Org Insights', roles:[UserRole.HR_ADMIN,UserRole.FOUNDER], icon:<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { niyamUser, signOut } = useAuth();
  const userRole = niyamUser?.role || UserRole.EMPLOYEE;
  const filteredNav = navItems.filter(i => i.roles.includes(userRole));
  const isActive = (href: string) => href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  return (
    <aside className="w-72 xl:w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 shadow-sm">
      <div className="p-8 xl:p-10 border-b border-slate-100 flex items-center gap-4">
        <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-2xl">N</div>
        <div><h1 className="text-2xl xl:text-3xl font-black text-slate-900 tracking-tighter leading-none">NIYAM</h1><p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest mt-1">Neural Cloud • v1.0</p></div>
      </div>
      <nav className="flex-1 p-6 xl:p-8 space-y-2 overflow-y-auto no-scrollbar">
        {filteredNav.map(item => (
          <Link key={item.id} href={item.href} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-200 ${isActive(item.href) ? 'bg-slate-900 text-white shadow-xl font-black' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900 font-bold'}`}>
            {item.icon}<span className="text-sm tracking-tight">{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-6 xl:p-8 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-black text-sm">{(niyamUser?.displayName||'U')[0].toUpperCase()}</div>
          <div className="flex-1 min-w-0"><p className="text-sm font-bold text-slate-900 truncate">{niyamUser?.displayName||'User'}</p><p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{niyamUser?.role||'EMPLOYEE'}</p></div>
        </div>
        <button onClick={()=>signOut().then(()=>window.location.href='/')} className="w-full py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>Sign Out
        </button>
      </div>
    </aside>
  );
}
