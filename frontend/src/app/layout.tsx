import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'Academic Guide Training & Certification',
  description: 'Professional development and certification for Academic Guides.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
