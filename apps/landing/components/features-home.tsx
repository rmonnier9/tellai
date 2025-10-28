import {
  BotIcon,
  CalendarCheckIcon,
  CogIcon,
  LanguagesIcon,
  RefreshCcwIcon,
  SquarePenIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function FeaturesHome() {
  const t = useTranslations('features');
  return (
    <section className="relative">
      <div
        className="absolute left-1/2 top-0 -z-10 -translate-x-1/2 -translate-y-1/2"
        aria-hidden="true"
      >
        <div className="h-80 w-80 rounded-full bg-linear-to-tr from-pink-500 to-gray-900 opacity-40 blur-[160px] will-change-[filter]" />
      </div>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-12 md:py-20">
          {/* Section header */}
          <div className="mx-auto max-w-3xl pb-12 text-center md:pb-14">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              {t('title')}
            </h2>
            <p className="text-lg text-gray-700">{t('subtitle')}</p>
          </div>
          {/* Illustration */}
          {/* <div
            className="group relative mx-auto mb-32 flex w-full max-w-[500px] justify-center md:mb-36"
            data-aos="zoom-y-out"
          >
            <div className="absolute bottom-0 -z-10" aria-hidden="true">
              <div className="h-80 w-80 rounded-full bg-pink-500 opacity-70 blur-[160px] will-change-[filter]" />
            </div>
            <div className="aspect-video w-full -rotate-1 rounded-2xl bg-gray-900 px-5 py-3 shadow-xl transition duration-300 group-hover:-rotate-0">
              <div className="relative mb-8 flex items-center justify-between before:block before:h-[9px] before:w-[41px] before:bg-[length:16px_9px] before:[background-image:radial-gradient(circle_at_4.5px_4.5px,var(--color-gray-600)_4.5px,transparent_0)] after:w-[41px]">
                <span className="text-[13px] font-medium text-white">
                  AI Project
                </span>
              </div>
              <div className="font-mono text-sm text-gray-500 blur-xs will-change-[filter] transition duration-300 group-hover:blur-none [&_span]:opacity-0">
                <span className="animate-[code-1_10s_infinite] text-gray-200">
                  npm login
                </span>{" "}
                <span className="animate-[code-2_10s_infinite]">
                  --registry=https://npm.pkg.github.com
                </span>
                <br />
                <span className="animate-[code-3_10s_infinite]">
                  --scope=@phanatic
                </span>{" "}
                <span className="animate-[code-4_10s_infinite]">
                  Successfully logged-in.
                </span>
                <br />
                <br />
                <span className="animate-[code-5_10s_infinite] text-gray-200">
                  npm publish
                </span>
                <br />
                <span className="animate-[code-6_10s_infinite]">
                  Package published.
                </span>
              </div>
            </div>
            <div className="absolute top-16">
              <div className="pointer-events-none mb-[7%] translate-y-2 transition duration-300 group-hover:translate-y-0 group-hover:opacity-0">
                <Image
                  className="-rotate-2"
                  src={FeatureImg01}
                  width={500}
                  height={72}
                  alt="Overlay 01"
                />
              </div>
              <div className="delay-50 pointer-events-none mb-[3.5%] translate-y-2 transition duration-300 group-hover:translate-y-0 group-hover:opacity-0">
                <Image src={FeatureImg02} width={500} alt="Overlay 02" />
              </div>
              <div className="pointer-events-none translate-y-2 transition delay-100 duration-300 group-hover:translate-y-0 group-hover:opacity-0">
                <Image
                  className="-rotate-1"
                  src={FeatureImg03}
                  width={500}
                  height={91}
                  alt="Overlay 03"
                />
              </div>
            </div>
          </div> */}
          {/* Grid */}
          <div className="grid overflow-hidden border-y [border-image:linear-gradient(to_right,transparent,var(--color-slate-200),transparent)1] lg:grid-cols-3 *:relative *:p-6 *:before:absolute *:before:bg-linear-to-b *:before:from-transparent *:before:via-gray-200 *:before:[block-size:100%] *:before:[inline-size:1px] *:before:[inset-block-start:0] *:before:[inset-inline-start:-1px] md:*:px-10 md:*:py-12">
            <article>
              <h3 className="mb-2 flex items-center space-x-2 font-medium">
                <LanguagesIcon className="text-pink-500" />
                <span>{t('keywordDiscovery.title')}</span>
              </h3>
              <p className="text-[15px] text-gray-700">
                {t('keywordDiscovery.description')}
              </p>
            </article>
            <article>
              <h3 className="mb-2 flex items-center space-x-2 font-medium">
                <CogIcon className="text-pink-500" />
                <span>{t('seoOptimization.title')}</span>
              </h3>
              <p className="text-[15px] text-gray-700">
                {t('seoOptimization.description')}
              </p>
            </article>
            <article>
              <h3 className="mb-2 flex items-center space-x-2 font-medium">
                <BotIcon className="text-pink-500" />
                <span>{t('aiSearchOptimization.title')}</span>
              </h3>
              <p className="text-[15px] text-gray-700">
                {t('aiSearchOptimization.description')}
              </p>
            </article>
            <article>
              <h3 className="mb-2 flex items-center space-x-2 font-medium">
                <CalendarCheckIcon className="text-pink-500" />
                <span>{t('contentCalendar.title')}</span>
              </h3>
              <p className="text-[15px] text-gray-700">
                {t('contentCalendar.description')}
              </p>
            </article>
            <article>
              <h3 className="mb-2 flex items-center space-x-2 font-medium">
                <RefreshCcwIcon className="text-pink-500" />
                <span>{t('syncPlatform.title')}</span>
              </h3>
              <p className="text-[15px] text-gray-700">
                {t('syncPlatform.description')}
              </p>
            </article>
            <article>
              <h3 className="mb-2 flex items-center space-x-2 font-medium">
                <SquarePenIcon className="text-pink-500" />
                <span>{t('editArticles.title')}</span>
              </h3>
              <p className="text-[15px] text-gray-700">
                {t('editArticles.description')}
              </p>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
