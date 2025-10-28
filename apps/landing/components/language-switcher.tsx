'use client';

import { CheckIcon } from 'lucide-react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  ];

  const currentLanguage =
    languages.find((lang) => lang.code === locale) || languages[0];

  const switchLanguage = (code: string) => {
    setIsOpen(false);
    let newPathname = pathname;

    if (locale === 'en') {
      newPathname = `/${code}${pathname.startsWith('/') ? '' : '/'}${pathname}`;
    } else {
      newPathname = pathname.replace(`/${locale}`, `/${code}`);
    }

    router.push(newPathname);
    router.refresh();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-100"
        aria-label="Change language"
      >
        <span className="text-base">{currentLanguage.flag}</span>
        <span className="hidden sm:inline">{currentLanguage.nativeName}</span>
        <span className="sm:hidden">{currentLanguage.code.toUpperCase()}</span>
      </button>

      {isOpen && (
        <>
          <button
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-label="Close language menu"
          />
          <div className="absolute left-0 bottom-full z-20 mb-2 w-40 rounded-lg border border-gray-200 bg-white shadow-lg">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => switchLanguage(language.code)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{language.flag}</span>
                  <div className="flex flex-col">
                    <span className="font-medium">{language.nativeName}</span>
                    <span className="text-xs text-gray-500">
                      {language.name}
                    </span>
                  </div>
                </div>
                {locale === language.code && (
                  <CheckIcon className="h-4 w-4 text-pink-500" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
