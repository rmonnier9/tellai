'use client';

import PageIllustration from '@/components/page-illustration';
import Avatar01 from '@/public/images/avatar-01.jpg';
import Avatar02 from '@/public/images/avatar-02.jpg';
import Avatar03 from '@/public/images/avatar-03.jpg';
import Avatar04 from '@/public/images/avatar-04.jpg';
import Image from 'next/image';
import { useState } from 'react';

export default function AffiliateProgramPage() {
  const [referrals, setReferrals] = useState(193);

  // 30% commission on $99/month subscription
  const monthlyEarnings = referrals * 99 * 0.3;
  const yearlyEarnings = monthlyEarnings * 12;

  return (
    <section className="relative">
      <PageIllustration />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Hero content */}
        <div className="pb-12 pt-32 md:pb-20 md:pt-40">
          {/* Floating badges */}
          <div className="relative">
            {/* Top right badge */}
            <div
              className="absolute rotate-5 -right-4 -top-8 animate-float rounded-full bg-gradient-to-r from-yellow-100 to-yellow-200 px-4 py-2 text-sm font-semibold text-yellow-800 shadow-lg md:-right-20 md:-top-12"
              data-aos="fade-left"
              data-aos-delay={200}
            >
              + $200
            </div>

            {/* Top left badge */}
            <div
              className="absolute rotate-10 hidden md:block -left-4 top-24 animate-float rounded-full bg-gradient-to-r from-purple-100 to-purple-200 px-4 py-2 text-sm font-semibold text-purple-800 shadow-lg [animation-delay:0.5s] md:-left-20"
              data-aos="fade-right"
              data-aos-delay={300}
            >
              🎉 Passive Earning
            </div>

            {/* Right side badge */}
            <div
              className="absolute rotate-10 -right-4 top-48 animate-float rounded-full bg-gradient-to-r from-purple-100 to-purple-200 px-4 py-2 text-sm font-semibold text-purple-800 shadow-lg [animation-delay:1s] md:-right-24 md:top-32"
              data-aos="fade-left"
              data-aos-delay={400}
            >
              + $300
            </div>

            {/* Bottom left badge */}
            <div
              className="absolute -rotate-15 -bottom-32 -left-4 animate-float rounded-full bg-gradient-to-r from-green-100 to-green-200 px-4 py-2 text-sm font-semibold text-green-800 shadow-lg [animation-delay:1.5s] md:-bottom-24 md:-left-20"
              data-aos="fade-right"
              data-aos-delay={500}
            >
              + $100
            </div>

            {/* Section header */}
            <div className="pb-12 text-center md:pb-16">
              <h1
                className="mb-6 border-y text-5xl font-bold [border-image:linear-gradient(to_right,transparent,--theme(--color-slate-300/.8),transparent)1] md:text-6xl"
                data-aos="zoom-y-out"
                data-aos-delay={150}
              >
                Earn{' '}
                <span className="bg-linear-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
                  30% Recurring Commission
                </span>{' '}
                Forever
              </h1>
              <div className="mx-auto max-w-3xl">
                <p
                  className="mb-8 text-lg text-gray-700"
                  data-aos="zoom-y-out"
                  data-aos-delay={300}
                >
                  Earn recurring income promoting the fastest-growing SEO
                  platform.
                </p>
                <div className="relative before:absolute before:inset-0 before:border-y before:[border-image:linear-gradient(to_right,transparent,--theme(--color-slate-300/.8),transparent)1]">
                  <div
                    className="relative mx-auto max-w-md sm:flex sm:max-w-none sm:justify-center"
                    data-aos="zoom-y-out"
                    data-aos-delay={450}
                  >
                    {/* <a
                      className="btn group mb-4 w-full border-slate-300 bg-white text-gray-800 shadow-sm hover:border-slate-400 sm:mb-0 sm:w-auto"
                      href="#calculator"
                    >
                      <span className="relative inline-flex items-center">
                        Affiliate Resources
                      </span>
                    </a> */}
                    <a
                      className="btn group mb-4 w-full bg-linear-to-t from-pink-600 to-pink-500 bg-[length:100%_100%] bg-[bottom] text-white shadow-sm hover:bg-[length:100%_150%] sm:mb-0 sm:ml-4 sm:w-auto"
                      href="https://lovarank.getrewardful.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="relative inline-flex items-center">
                        Become an Affiliate Partner{' '}
                        <span className="ml-1 tracking-normal text-pink-300 transition-transform group-hover:translate-x-0.5">
                          -&gt;
                        </span>
                      </span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Social proof */}
            <div
              className="mb-12 text-center"
              data-aos="zoom-y-out"
              data-aos-delay={600}
            >
              <div className="mb-4 border-y [border-image:linear-gradient(to_right,transparent,--theme(--color-slate-300/.8),transparent)1]">
                <div className="-mx-0.5 flex justify-center -space-x-3 py-3">
                  <Image
                    className="box-content rounded-full border-2 border-gray-50"
                    src={Avatar01}
                    width={32}
                    height={32}
                    alt="Avatar 01"
                  />
                  <Image
                    className="box-content rounded-full border-2 border-gray-50"
                    src={Avatar02}
                    width={32}
                    height={32}
                    alt="Avatar 02"
                  />
                  <Image
                    className="box-content rounded-full border-2 border-gray-50"
                    src={Avatar03}
                    width={32}
                    height={32}
                    alt="Avatar 03"
                  />
                  <Image
                    className="box-content rounded-full border-2 border-gray-50"
                    src={Avatar04}
                    width={32}
                    height={32}
                    alt="Avatar 04"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">100k+</span>{' '}
                Articles Created
              </p>
            </div>

            {/* Affiliate link example */}
            {/* <div
              className="mb-12 flex justify-center"
              data-aos="fade-up"
              data-aos-delay={700}
            >
              <div className="group relative">
                <div className="absolute -inset-1 rounded-lg bg-linear-to-r from-pink-500 to-purple-500 opacity-25 blur transition duration-500 group-hover:opacity-75"></div>
                <div className="relative flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 shadow-sm">
                  <span className="text-xs font-medium text-gray-500">
                    Affiliate link
                  </span>
                  <code className="rounded bg-slate-100 px-3 py-1 text-sm text-pink-600">
                    https://lovarank.com/ref/yourdata
                  </code>
                  <button className="rounded-md bg-pink-500 px-3 py-1 text-sm font-medium text-white transition hover:bg-pink-600">
                    Copy
                  </button>
                </div>
              </div>
            </div> */}
          </div>

          {/* Calculator Section */}
          <div
            id="calculator"
            className="mx-auto max-w-3xl scroll-mt-32"
            data-aos="zoom-y-out"
            data-aos-delay={800}
          >
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-8 shadow-xl md:p-12">
              {/* Background glow effect */}
              <div
                className="absolute -bottom-32 -right-32 h-64 w-64 rounded-full bg-pink-500 opacity-10 blur-3xl"
                aria-hidden="true"
              />
              <div
                className="absolute -left-32 -top-32 h-64 w-64 rounded-full bg-purple-500 opacity-10 blur-3xl"
                aria-hidden="true"
              />

              <div className="relative">
                <div className="mb-8">
                  <div className="mb-4 flex items-baseline justify-between">
                    <label className="text-lg font-semibold text-gray-900">
                      Number of referrals
                    </label>
                    <span className="text-3xl font-bold text-gray-900">
                      {referrals}
                    </span>
                  </div>

                  {/* Slider */}
                  <div className="relative">
                    <input
                      type="range"
                      min="1"
                      max="500"
                      value={referrals}
                      onChange={(e) => setReferrals(Number(e.target.value))}
                      className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gradient-to-r from-pink-500 to-purple-500 outline-none [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-lg [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg"
                      style={{
                        background: `linear-gradient(to right, rgb(236 72 153) 0%, rgb(168 85 247) ${(referrals / 500) * 100}%, rgb(226 232 240) ${(referrals / 500) * 100}%, rgb(226 232 240) 100%)`,
                      }}
                    />
                    <div className="mt-2 flex justify-between text-xs text-gray-500">
                      <span>1</span>
                      <span>500</span>
                    </div>
                  </div>
                </div>

                {/* Earnings Display */}
                <div className="border-t border-slate-200 pt-8">
                  <div className="mb-4 text-center">
                    <span className="bg-linear-to-r from-pink-500 to-purple-500 bg-clip-text font-['Bricolage_Grotesque'] text-lg italic text-transparent">
                      Your Potential Earnings
                    </span>
                    <svg
                      className="mx-auto mt-2 h-6 w-20 text-pink-500"
                      viewBox="0 0 80 24"
                      fill="none"
                    >
                      <path
                        d="M 0 12 Q 20 0, 40 12 T 80 12"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        className="opacity-50"
                      />
                    </svg>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-gray-900">
                        ${Math.ceil(monthlyEarnings).toLocaleString('en-US')}
                      </div>
                      <div className="mt-1 text-sm text-gray-600">monthly</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold bg-linear-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                        ${Math.ceil(yearlyEarnings).toLocaleString('en-US')}
                      </div>
                      <div className="mt-1 text-sm text-gray-600">yearly</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional info sections */}
          <div className="mt-20 grid gap-8 md:grid-cols-3">
            <div
              className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm"
              data-aos="fade-up"
              data-aos-delay={200}
            >
              <div className="mb-3 text-3xl">💰</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                30% Commission
              </h3>
              <p className="text-sm text-gray-600">
                Earn recurring revenue for every paying customer you refer
              </p>
            </div>

            <div
              className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm"
              data-aos="fade-up"
              data-aos-delay={300}
            >
              <div className="mb-3 text-3xl">🔄</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Lifetime Recurring
              </h3>
              <p className="text-sm text-gray-600">
                Continue earning as long as your referrals stay subscribed
              </p>
            </div>

            <div
              className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm"
              data-aos="fade-up"
              data-aos-delay={400}
            >
              <div className="mb-3 text-3xl">📊</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Real-time Tracking
              </h3>
              <p className="text-sm text-gray-600">
                Monitor your referrals and earnings with our detailed dashboard
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
