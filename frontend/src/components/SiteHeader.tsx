import Image from 'next/image';
import Link from 'next/link';

const navItems = [
  { label: 'Programme', href: '/' },
  { label: 'Packages', href: '/packages' },
  { label: 'Purchase', href: '/purchase' },
  { label: 'Login', href: '/login' }
];

export default function SiteHeader() {
  return (
    <header className="w-full border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/images/logo.svg" alt="Academic Guide Course logo" width={40} height={40} />
          <span className="text-lg font-semibold text-ocean-700">Academic Guide Course</span>
        </Link>
        <nav className="flex gap-6 text-sm font-medium text-slate-600">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-ocean-600">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
