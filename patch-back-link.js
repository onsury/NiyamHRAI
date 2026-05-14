// patch-back-link.js
// Adds "<- Back to Dashboard" link to every dashboard sub-page.
// Targets: src/app/dashboard/layout.tsx
// Backup:  src/app/dashboard/layout.tsx.before-back-link
//
// Run from project root (D:\projects\NiyamHRAI):
//   node patch-back-link.js

const fs = require('fs');
const path = require('path');

const FILE = path.join('src', 'app', 'dashboard', 'layout.tsx');
const BACKUP = FILE + '.before-back-link';

if (!fs.existsSync(FILE)) {
  console.error('X Cannot find ' + FILE + ' - run this from the project root.');
  process.exit(1);
}

const NEW_CONTENT = `'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Sidebar from '@/components/layout/sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { firebaseUser, niyamUser, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!firebaseUser) { router.push('/login'); return; }
    if (!firebaseUser.emailVerified) { router.push('/verify-email'); return; }
    if (!niyamUser?.onboarded) {
      router.push(niyamUser?.role === 'FOUNDER' ? '/setup/founder' : '/setup/employee');
    }
  }, [firebaseUser, niyamUser, loading, router]);

  if (loading) return (
    <div className="min-h-screen bg-[#f8f8fa] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin" />
    </div>
  );

  if (!firebaseUser?.emailVerified || !niyamUser?.onboarded) return null;

  const isSubPage = pathname !== '/dashboard';

  return (
    <div className="min-h-screen bg-[#f8f8fa]">
      <Sidebar />
      <main className="p-4 pt-16 sm:p-6 sm:pt-6 lg:p-8 lg:pl-[272px] lg:pt-8 min-h-screen">
        {isSubPage && (
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 mb-6 transition-colors cursor-pointer group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
        )}
        {children}
      </main>
    </div>
  );
}
`;

fs.copyFileSync(FILE, BACKUP);
fs.writeFileSync(FILE, NEW_CONTENT, 'utf8');
console.log('OK  Patched ' + FILE);
console.log('OK  Backup at ' + BACKUP);
console.log('');
console.log('Next: git add . ; git commit -m "feat: back-to-dashboard link on sub-pages" ; git push');
