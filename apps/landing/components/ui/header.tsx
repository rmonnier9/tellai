import { useTranslations } from 'next-intl';
import Logo from './logo';

export default function Header({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  const t = useTranslations('common');
  return (
    <header className="fixed top-2 z-30 w-full md:top-6">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative flex h-14 items-center justify-between gap-3 rounded-2xl bg-white/90 px-3 shadow-lg shadow-black/[0.03] backdrop-blur-xs before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(var(--color-gray-100),var(--color-gray-200))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)]">
          <div className="flex flex-1 items-center gap-3">
            <Logo />
          </div>

          <nav className="hidden md:flex md:grow">
            <ul className="flex grow flex-wrap items-center justify-center gap-4 text-sm lg:gap-8">
              {/* <li className="px-3 py-1">
                <Link
                  href="/pricing"
                  className="flex items-center text-gray-700 transition hover:text-gray-900"
                >
                  Pricing
                </Link>
              </li>
              <li className="px-3 py-1">
                <Link
                  href="/customers"
                  className="flex items-center text-gray-700 transition hover:text-gray-900"
                >
                  Customers
                </Link>
              </li>
              <li className="px-3 py-1">
                <Link
                  href="/blog"
                  className="flex items-center text-gray-700 transition hover:text-gray-900"
                >
                  Blog
                </Link>
              </li>
              <li className="px-3 py-1">
                <Link
                  href="/documentation"
                  className="flex items-center text-gray-700 transition hover:text-gray-900"
                >
                  Docs
                </Link>
              </li>
              <Dropdown title="Extra">
                <li>
                  <Link
                    href="/support"
                    className="flex rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Support center
                  </Link>
                </li>
                <li>
                  <Link
                    href="/apps"
                    className="flex rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Apps
                  </Link>
                </li>
              </Dropdown> */}
            </ul>
          </nav>

          {/* Desktop sign in links */}
          <ul className="flex flex-1 items-center justify-end gap-3">
            {isAuthenticated ? (
              <li>
                <a
                  href={process.env.NEXT_PUBLIC_DASHBOARD_URL}
                  className="btn-sm bg-pink-400 text-white shadow-sm hover:bg-pink-500"
                >
                  {t('goToDashboard')}
                </a>
              </li>
            ) : (
              <>
                <li>
                  <a
                    href={process.env.NEXT_PUBLIC_DASHBOARD_URL}
                    className="btn-sm bg-white text-gray-800 shadow-sm hover:bg-gray-50"
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
              </>
            )}
          </ul>

          {/* <MobileMenu /> */}
        </div>
      </div>
    </header>
  );
}
