'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearToken } from '@/lib/api';

const nav = [
  { href: '/', label: 'Dashboard', icon: '▚' },
  { href: '/produtos', label: 'Produtos', icon: '▤' },
  { href: '/receitas', label: 'Receitas', icon: '🍸' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    clearToken();
    router.replace('/login');
    router.refresh();
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface">
      <div className="px-5 py-5 text-xl font-bold tracking-tight">
        Bar<span className="text-primary">Flow</span>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {nav.map((n) => {
          const active = n.href === '/' ? pathname === '/' : pathname.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-border/40 hover:text-foreground'
              }`}
            >
              <span className="w-4 text-center">{n.icon}</span>
              {n.label}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={logout}
        className="m-3 rounded-lg border border-border px-3 py-2 text-sm text-muted transition hover:text-danger"
      >
        Sair
      </button>
    </aside>
  );
}
