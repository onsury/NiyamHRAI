import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

const inter = Inter({ subsets: ['latin'], weight: ['400','500','600','700','800','900'] });

export const metadata: Metadata = {
  title: 'NiyamAI — Neural Alignment Engine',
  description: 'AI-powered alignment engine for founder-led organisations',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
