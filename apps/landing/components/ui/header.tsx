import { useTranslations } from 'next-intl';
import Logo from './logo';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { Menu } from 'lucide-react';

export default function Header({
  isAuthenticated = false,
}: {
  isAuthenticated?: boolean;
}) {
  const t = useTranslations('common');

  const links = [
    {
      href: '/#how-it-works',
      label: 'How It Works',
    },
    {
      href: '/#writing-examples',
      label: 'Writing Examples',
    },
    {
      href: '/#pricing',
      label: 'Pricing',
    },
    {
      href: '/blog',
      label: 'Blog',
    },
  ];

  return (
    <header className="fixed top-2 z-30 w-full md:top-6">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative flex h-14 items-center justify-between gap-3 rounded-2xl bg-white/90 px-3 shadow-lg shadow-black/[0.03] backdrop-blur-xs before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(var(--color-gray-100),var(--color-gray-200))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)]">
          <div className="flex flex-1 items-center gap-3">
            <Logo />
          </div>

          <nav className="hidden md:flex md:grow">
            <ul className="flex grow flex-wrap items-center justify-center gap-4 text-sm lg:gap-8">
              {links.map((link) => (
                <li className="px-3 py-1" key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center text-gray-700 transition hover:text-gray-900"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Desktop sign in links */}
          <ul className="flex flex-1 items-center justify-end gap-3">
            <li>
              <a
                href={process.env.NEXT_PUBLIC_DASHBOARD_URL}
                className="hidden lg:flex btn-sm bg-white text-gray-800 shadow-sm hover:bg-gray-50"
              >
                {t('login')}
              </a>
            </li>
            <li>
              <a
                href={process.env.NEXT_PUBLIC_DASHBOARD_URL}
                className="btn-sm bg-pink-400 text-white shadow-sm hover:bg-pink-500"
              >
                {t('startForFree')}
              </a>
            </li>
          </ul>

          {/* Mobile Menu */}
          <div className="flex md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors">
                <Menu className="w-5 h-5 text-gray-700" />
                <span className="sr-only">Open menu</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {links.map((link) => (
                  <DropdownMenuItem key={link.href} asChild>
                    <Link
                      href={link.href}
                      className="flex items-center w-full px-2 py-2 text-sm"
                    >
                      {link.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
