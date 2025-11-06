'use client';

import { articles } from '@workspace/lib/data/articles-samples';
import PricingTable from '@workspace/ui/components/pricing-table';
import Faqs from '@/components/faqs';
import PageIllustration from '@/components/page-illustration';
import { useTranslations } from 'next-intl';
import Logos from '@/components/logos';
import { cn } from '@workspace/ui/lib/utils';
import SectionDivider from '@workspace/ui/components/section-divider';
import CTA from '@workspace/ui/components/cta';
import { testimonials } from '@workspace/lib/data/testimonials';
import { WritingExamples } from '@workspace/ui/components/writing-examples';
import Logo from '@/components/ui/logo';
import {
  Globe,
  Pencil,
  Infinity as InfinityIcon,
  Building2,
  Users,
  MessageCircle,
  Target,
  Search,
  Rocket,
  BarChart3,
  Clock,
  TrendingUp,
} from 'lucide-react';

const ContainerPadding = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn('max-w-6xl px-8 md:px-12 py-16', className)}>
      {children}
    </div>
  );
};

export default function Home() {
  const heroT = useTranslations('hero');
  const backlinkT = useTranslations('backlinkExchange');
  const additionalT = useTranslations('additionalFeatures');
  const aiRecommendationT = useTranslations('aiRecommendation');
  const writingExamplesT = useTranslations('writingExamples');
  const featuresT = useTranslations('features');
  const problemsT = useTranslations('problemsSolution');
  const howItWorksT = useTranslations('howItWorks');
  const pricingT = useTranslations('pricing');

  const problems = [
    {
      avatar: '/images/avatar-01.jpg',
      text: problemsT('problem1'),
      highlight: problemsT('problem1Highlight'),
    },
    {
      avatar: '/images/avatar-02.jpg',
      text: problemsT('problem2'),
      highlight: problemsT('problem2Highlight'),
    },
    {
      avatar: '/images/avatar-03.jpg',
      text: problemsT('problem3'),
      highlight: problemsT('problem3Highlight'),
    },
  ];

  const solutions = [
    problemsT('solution1'),
    problemsT('solution2'),
    problemsT('solution3'),
    problemsT('solution4'),
    problemsT('solution5'),
  ];

  const howItWorksSteps = [
    {
      title: howItWorksT('step1.title'),
      description: howItWorksT('step1.description'),
      image: '/images/how-it-works-1.jpeg',
    },
    {
      title: howItWorksT('step2.title'),
      description: howItWorksT('step2.description'),
      image: '/images/how-it-works-2.jpeg',
    },
    {
      title: howItWorksT('step3.title'),
      description: howItWorksT('step3.description'),
      image: '/images/how-it-works-3.webp',
    },
  ];

  return (
    <div className="relative">
      <PageIllustration />

      <div className="pt-24 md:pt-32 pb-12 px-2">
        <div className="border divider border-solid max-w-6xl mx-auto rounded-4xl overflow-hidden">
          {/* Hero Section */}
          <section className="flex flex-col overflow-hidden relative bg-primary-100/10">
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white to-transparent  -z-10 w-full" />
            <img
              src="/images/bg-1.jpeg"
              alt="Hero"
              className="w-full h-full object-cover absolute blur-xs -z-20 opacity-30 "
            />
            <ContainerPadding className="pb-12 md:pb-16 mx-auto md:py-24">
              <div className="text-center">
                <div className="inline-flex font-fun text-primary-400 text-3xl font-bold mb-4">
                  {heroT('badge')}
                </div>
                <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                  {heroT('title')}
                </h1>
                <p className="text-lg md:text-xl text-gray-600 mb-10 leading-relaxed max-w-4xl mx-auto">
                  {heroT('description')}
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
                  <a
                    href={process.env.NEXT_PUBLIC_DASHBOARD_URL}
                    className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
                  >
                    {heroT('getStarted')}
                  </a>
                </div>

                {/* Social Proof */}
                <p className="mb-4 text-center text-sm text-gray-600">
                  {heroT('joinUsers')}
                </p>
                <div className="flex justify-center mb-6">
                  <div className="-mx-0.5 flex -space-x-3">
                    <img
                      className="box-content rounded-full border-2 border-gray-50 w-8 h-8"
                      src="/images/avatar-01.jpg"
                      alt="Avatar 01"
                    />
                    <img
                      className="box-content rounded-full border-2 border-gray-50 w-8 h-8"
                      src="/images/avatar-02.jpg"
                      alt="Avatar 02"
                    />
                    <img
                      className="box-content rounded-full border-2 border-gray-50 w-8 h-8"
                      src="/images/avatar-03.jpg"
                      alt="Avatar 03"
                    />
                    <img
                      className="box-content rounded-full border-2 border-gray-50 w-8 h-8"
                      src="/images/avatar-04.jpg"
                      alt="Avatar 04"
                    />
                    <img
                      className="box-content rounded-full border-2 border-gray-50 w-8 h-8"
                      src="/images/avatar-05.jpg"
                      alt="Avatar 05"
                    />
                    <img
                      className="box-content rounded-full border-2 border-gray-50 w-8 h-8"
                      src="/images/avatar-06.jpg"
                      alt="Avatar 06"
                    />
                  </div>
                </div>

                {/* Logos */}
                <div className="mt-8">
                  <Logos />
                </div>
              </div>
            </ContainerPadding>
          </section>

          <SectionDivider />

          {/* Problems & Solution Section */}
          <section className="flex flex-col">
            <ContainerPadding>
              <div className="text-center mb-12">
                <div className="text-2xl font-fun font-bold text-primary-400 mb-4">
                  {problemsT('badge')}
                </div>
                <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                  <span className="block">{problemsT('yourProblem')}</span>
                  <span className="block text-primary-500">
                    {problemsT('ourSolution')}
                  </span>
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Problems Column */}
                <div className="space-y-6">
                  {problems.map((problem, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-6 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <img
                        src={problem.avatar}
                        alt={`User ${index + 1}`}
                        className="rounded-full flex-shrink-0 w-8 h-8"
                      />
                      <div>
                        <p className="text-gray-700 leading-relaxed">
                          {problem.text}{' '}
                          <span className="text-red-500 font-medium">
                            {problem.highlight}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Solution Column */}
                <div className="relative">
                  <div className="bg-gradient-to-bl from-primary-200 to-primary-400 rounded-2xl p-8 text-white shadow-2xl">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-white rounded-full flex items-center justify-center text-black px-4 py-2">
                        <Logo />
                      </div>

                      {/* <h3 className="text-2xl font-bold">Lovarank</h3> */}
                    </div>

                    <div className="bg-white backdrop-blur-sm rounded-xl p-6 mb-4">
                      <p className="text-gray-700 font-bold mb-4 font-display">
                        {problemsT('solutionTitle')}
                      </p>

                      <div className="space-y-3">
                        {solutions.map((solution, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <svg
                              className="w-5 h-5 text-green-500 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span className="text-gray-700">{solution}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ContainerPadding>
          </section>

          <SectionDivider />

          {/* How It Works Section */}
          <section id="how-it-works" className="flex flex-col">
            <ContainerPadding>
              {/* Header Section - Two Column Layout */}
              <div className="grid md:grid-cols-2 gap-12 items-start mb-16">
                <div>
                  <div className="text-2xl font-bold tracking-wider mb-2 font-fun text-primary-400">
                    {howItWorksT('badge')}
                  </div>
                  <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                    <span className="">{howItWorksT('title')}</span>
                  </h2>
                </div>
                <div className="flex flex-col gap-6 md:pt-8">
                  <p className="text-lg text-gray-600 leading-relaxed">
                    {howItWorksT('subtitle')}
                  </p>
                  {/* <div>
                    <a
                      href={process.env.NEXT_PUBLIC_DASHBOARD_URL}
                      className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
                    >
                      {heroT('getStarted')}

                    </a>
                  </div> */}
                </div>
              </div>

              {/* Steps with Visual Cards */}
              <div className="grid gap-12 md:grid-cols-3">
                {howItWorksSteps.map((step, index) => (
                  <div key={index} className="relative">
                    {/* Visual Card Placeholder */}
                    <div className="mb-6 bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-white">
                        <img
                          src={step.image || '/images/bg-1.jpeg'}
                          alt={step.title}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    {/* Step Content */}
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold mb-3">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ContainerPadding>
          </section>

          <SectionDivider />

          {/* Features Section */}
          <section className="flex flex-col">
            <ContainerPadding>
              {/* Header */}
              <div className="text-center mb-16">
                <div className="text-2xl font-bold text-primary-400 tracking-wider mb-2 font-fun">
                  {featuresT('badge')}
                </div>
                <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                  <span className="block">Unlock your </span>
                  <span className="text-primary-500">SEO growth</span>
                </h2>
                <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
                  {featuresT('subtitle')}
                </p>
              </div>

              {/* Feature 1 - Text Left, Image Right */}
              <div className="mb-20">
                <div className="grid md:grid-cols-2 gap-12 items-center bg-gradient-to-br from-primary-50 to-white rounded-3xl p-8 md:p-12">
                  <div>
                    <h3 className="text-2xl md:text-4xl font-bold mb-4">
                      {featuresT('feature1.title')}
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-6">
                      {featuresT('feature1.description')}
                    </p>
                    <a
                      href={process.env.NEXT_PUBLIC_DASHBOARD_URL}
                      className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors duration-200"
                    >
                      {featuresT('feature1.cta')}
                    </a>
                  </div>
                  <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-gray-200 bg-white">
                    <img
                      src="/images/feature-1.jpeg"
                      alt={featuresT('feature1.title')}
                      className="absolute inset-0 w-full h-full object-cover "
                    />
                  </div>
                </div>
              </div>

              {/* Feature 2 - Image Left, Text Right */}
              <div className="mb-20">
                <div className="grid md:grid-cols-2 gap-12 items-center bg-gradient-to-l from-primary-100 to-white rounded-3xl p-8 md:p-12">
                  {/* <div className="relative aspect-video rounded-xl overflow-visible border-2 border-gray-200 bg-white order-2 md:order-1"> */}
                  <img
                    src="/images/feature-2.png"
                    alt={featuresT('feature2.title')}
                    className="inset-0 w-full h-full object-cover rounded-2xl"
                  />
                  {/* </div> */}
                  <div className="order-1 md:order-2">
                    <h3 className="text-2xl md:text-4xl font-bold mb-4">
                      {featuresT('feature2.title')}
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-6">
                      {featuresT('feature2.description')}
                    </p>
                    <a
                      href={'/#writing-examples'}
                      className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
                    >
                      {featuresT('feature2.cta')}
                    </a>
                  </div>
                </div>
              </div>

              {/* Feature 3 - Text Left, Image Right */}
              <div className="mb-20">
                <div className="grid md:grid-cols-2 gap-12 items-center bg-gradient-to-r from-primary-100 to-white rounded-3xl p-8 md:p-12">
                  <div>
                    <h3 className="text-2xl md:text-4xl font-bold mb-4">
                      {featuresT('feature3.title')}
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-6">
                      {featuresT('feature3.description')}
                    </p>
                    <a
                      href={process.env.NEXT_PUBLIC_DASHBOARD_URL}
                      className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors duration-200"
                    >
                      {featuresT('feature3.cta')}
                    </a>
                  </div>
                  <img
                    src="/images/feature-3.png"
                    alt={featuresT('feature3.title')}
                    className="inset-0 w-full h-full object-cover rounded-2xl"
                  />
                </div>
              </div>

              {/* Feature 4 - Image Left, Text Right */}
              <div className="mb-20">
                <div className="grid md:grid-cols-2 gap-12 items-center bg-gradient-to-l from-primary-100 to-white rounded-3xl p-8 md:p-12 !pl-0">
                  <img
                    src="/images/feature-4.jpeg"
                    alt={featuresT('feature4.title')}
                    className="inset-0 w-full h-full object-cover rounded-2xl"
                  />
                  <div className="order-1 md:order-2">
                    <h3 className="text-2xl md:text-4xl font-bold mb-4">
                      {featuresT('feature4.title')}
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-6">
                      {featuresT('feature4.description')}
                    </p>
                    <a
                      href={process.env.NEXT_PUBLIC_DASHBOARD_URL}
                      className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors duration-200"
                    >
                      {featuresT('feature4.cta')}
                    </a>
                  </div>
                </div>
              </div>

              {/* Feature 5 - Text Left, Image Right */}
              <div className="mb-8">
                <div className="grid md:grid-cols-2 gap-12 items-center bg-gradient-to-r from-primary-100 to-white rounded-3xl p-8 md:p-12">
                  <div>
                    <h3 className="text-2xl md:text-4xl font-bold mb-4">
                      {featuresT('feature5.title')}
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-6">
                      {featuresT('feature5.description')}
                    </p>
                    <a
                      href={process.env.NEXT_PUBLIC_DASHBOARD_URL}
                      className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors duration-200"
                    >
                      {featuresT('feature5.cta')}
                    </a>
                  </div>
                  <img
                    src="/images/feature-5.jpg"
                    alt={featuresT('feature5.title')}
                    className="inset-0 w-full h-full object-cover rounded-2xl"
                  />
                </div>
              </div>
            </ContainerPadding>
          </section>

          <SectionDivider />

          {/* Backlink Exchange Section */}
          <section className="flex flex-col">
            <ContainerPadding>
              {/* Header Section - Two Column Layout */}
              <div className="grid md:grid-cols-2 gap-12 items-start mb-16">
                <div>
                  <div className="text-2xl font-bold tracking-wider mb-2 font-fun text-primary-400">
                    {backlinkT('badge')}
                  </div>
                  <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-6">
                    Boost your domain rating with{' '}
                    <span className="text-primary-500">Backlink Exchange</span>
                  </h2>
                </div>
                <div className="flex flex-col gap-6 md:pt-8">
                  <p className="text-lg text-gray-600 leading-relaxed">
                    {backlinkT('subtitle')}
                  </p>
                  <div>
                    <a
                      href={process.env.NEXT_PUBLIC_DASHBOARD_URL}
                      className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
                    >
                      {backlinkT('cta')}
                    </a>
                  </div>
                </div>
              </div>

              {/* Steps with Visual Cards */}
              <div className="grid gap-12 md:grid-cols-3">
                {[1, 2, 3].map((index) => (
                  <div key={index} className="relative">
                    {/* Visual Card Placeholder */}
                    <div className="mb-6 bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-white">
                        <img
                          src={
                            index === 1
                              ? '/images/backlinks-1.jpg'
                              : index === 2
                                ? '/images/backlinks-2.jpg'
                                : '/images/backlinks-3.jpg'
                          }
                          alt={backlinkT(`feature${index}.title`)}
                          className="absolute inset-0 w-full h-full object-cover "
                        />
                      </div>
                    </div>

                    {/* Step Content */}
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold mb-3">
                        {backlinkT(`feature${index}.title`)}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {backlinkT(`feature${index}.description`)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ContainerPadding>
          </section>

          <SectionDivider />

          {/* Additional Features Section */}
          <section className="flex flex-col">
            <ContainerPadding>
              {/* Header */}
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                  <span className="block">And so </span>
                  <span className="text-primary-500">much more you need </span>
                  <span className="block">to do your best work.</span>
                </h2>
              </div>

              {/* Features Grid */}
              <div className="grid md:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map((index) => {
                  const Icon =
                    index === 1
                      ? Globe
                      : index === 2
                        ? Pencil
                        : index === 3
                          ? InfinityIcon
                          : index === 4
                            ? Building2
                            : index === 5
                              ? Users
                              : MessageCircle;

                  return (
                    <div
                      key={index}
                      className="p-8 bg-white rounded-2xl border border-gray-200 hover:border-primary-200 hover:shadow-lg transition-all duration-300"
                    >
                      {/* Icon */}
                      <div className="w-10 h-10 mb-6 bg-primary-100 rounded-full flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary-500" />
                      </div>

                      {/* Content */}
                      <h3 className="text-xl font-bold mb-3">
                        {additionalT(`feature${index}.title`)}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {additionalT(`feature${index}.description`)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </ContainerPadding>
          </section>

          <SectionDivider />

          {/* AI Recommendation Section */}
          <section className="flex flex-col">
            <ContainerPadding>
              {/* Header */}
              <div className="text-center mb-16">
                <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  {aiRecommendationT('badge')}
                </div>
                <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-6">
                  <span className="block">Make AI recommending </span>
                  <span className="text-primary-500">Your Business</span>
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto">
                  {aiRecommendationT('subtitle')}
                </p>
              </div>

              {/* Top Two Cards */}
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                {/* Card 1 - Dark */}
                <div className="bg-gradient-to-br from-zinc-900 to-zinc-500 rounded-3xl p-8 text-white">
                  <div className="w-10 h-10 mb-6 bg-white rounded-full flex items-center justify-center">
                    <Target className="w-6 h-6 text-gray-900" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">
                    How <span className="text-primary-400">AI</span> chooses
                    what to <span className="text-primary-400">recommend?</span>
                  </h3>
                  <p className="text-gray-300 leading-relaxed mb-6">
                    {aiRecommendationT('card1.description')}
                  </p>
                  {/* Placeholder for browser screenshot */}
                  <div className="relative aspect-video rounded-xl overflow-hidden rounded-2xl bg-white ">
                    <img
                      src="/images/ai-recomendation-1.jpg"
                      alt="AI Search Demo"
                      className="inset-0 w-full h-full object-contain rounded-2xl"
                    />
                  </div>
                </div>

                {/* Card 2 - Light */}
                <div className="bg-white rounded-3xl p-8 border-2 border-gray-200">
                  <div className="w-10 h-10 mb-6 bg-primary-500 rounded-full flex items-center justify-center">
                    <Rocket className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">
                    What we create for{' '}
                    <span className="text-primary-500">your SEO?</span>
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    {aiRecommendationT('card2.description')}
                  </p>
                  {/* Placeholder for purple interface */}
                  <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-white">
                    <img
                      src="/images/ai-recomendation-2.jpg"
                      alt="SEO Tools Demo"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center"></div>
                  </div>
                </div>
              </div>

              {/* Bottom Card - Purple */}
              <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-3xl p-8 md:p-12 text-white">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div>
                    <div className="w-10 h-10 mb-6 bg-white rounded-full flex items-center justify-center">
                      <Clock className="w-6 h-6 text-primary-600" />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold mb-4">
                      Why it&apos;s important to{' '}
                      <span className="text-white underline">start now?</span>
                    </h3>
                    <p className="text-primary-100 leading-relaxed">
                      {aiRecommendationT('card3.description')}
                    </p>
                  </div>
                  {/* Placeholder for timeline visualization */}
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-white">
                    <img
                      src="/images/ai-recomendation-3.jpg"
                      alt="Timeline Demo"
                      className="inset-0 w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>
            </ContainerPadding>
          </section>

          <SectionDivider />

          {/* Writing Examples Section */}
          <section id="writing-examples" className="flex flex-col">
            <ContainerPadding>
              <WritingExamples
                heading={writingExamplesT('heading')}
                ctaText={writingExamplesT('ctaText')}
                ctaUrl={'/blog'}
                ctaDescription={writingExamplesT('ctaDescription')}
                examples={[
                  {
                    id: '1',
                    title: articles[0].title,
                    author: {
                      name: 'Setgraph',
                      logo: `https://www.google.com/s2/favicons?domain=setgraph.app&sz=128`,
                    },
                    tag: writingExamplesT('example1.tag'),
                    tagColor: 'blue' as const,
                    image: articles[0].featuredImage,
                    articleTitle: articles[0].title,
                    content: articles[0].content,
                  },
                  {
                    id: '2',
                    title: articles[1].title,
                    author: {
                      name: 'Chaindesk',
                      logo: `https://www.google.com/s2/favicons?domain=chaindesk.ai&sz=128`,
                    },
                    tag: writingExamplesT('example2.tag'),
                    tagColor: 'purple' as const,
                    image: articles[1].featuredImage,
                    articleTitle: articles[1].title,
                    content: articles[1].content,
                  },
                  {
                    id: '3',
                    title: articles[2].title,
                    author: {
                      name: articles[2].company,
                      logo: articles[2].logo,
                    },
                    tag: writingExamplesT('example3.tag'),
                    tagColor: 'green' as const,
                    image: articles[2].featuredImage,
                    articleTitle: articles[2].title,
                    content: articles[2].content,
                  },
                ]}
              />
            </ContainerPadding>
          </section>

          <SectionDivider />

          {/* Pricing Section */}
          <section id="pricing" className="flex flex-col">
            <ContainerPadding>
              <div className="text-center mb-12">
                <div className="inline-flex font-fun text-primary-400 text-3xl font-bold mb-4">
                  {pricingT('badge')}
                </div>
                <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                  {pricingT('title')}
                </h2>
                <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
                  {pricingT('subtitle')}
                </p>
              </div>

              <div className="max-w-5xl mx-auto">
                <PricingTable
                  cta={{ url: process.env.NEXT_PUBLIC_DASHBOARD_URL }}
                />
              </div>
            </ContainerPadding>
          </section>

          <SectionDivider />

          {/* Testimonials Section */}
          <section className="flex flex-col overflow-hidden">
            <ContainerPadding>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                  <span className="block">Trusted by </span>
                  <span className="text-primary-500">
                    ambitious founders and marketers
                  </span>
                </h2>
              </div>

              {/* First Row - Scrolling Right */}
              <div className="relative mb-8">
                <div className="flex gap-6 animate-scroll-right">
                  {testimonials.slice(0, 5).map((testimonial, index) => (
                    <div
                      key={`row1-${index}`}
                      className="min-w-[350px] bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105"
                      style={{
                        transform: `rotate(${index % 2 === 0 ? '1' : '-1'}deg)`,
                      }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={testimonial.avatar}
                            alt={testimonial.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <div className="font-semibold">
                              {testimonial.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              @{testimonial.username}
                            </div>
                          </div>
                        </div>
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        {testimonial.content}
                      </p>
                      <div className="mt-4 text-sm text-gray-500">
                        {testimonial.date}
                      </div>
                    </div>
                  ))}
                  {/* Duplicate for seamless loop */}
                  {testimonials.slice(0, 5).map((testimonial, index) => (
                    <div
                      key={`row1-dup-${index}`}
                      className="min-w-[350px] bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105"
                      style={{
                        transform: `rotate(${index % 2 === 0 ? '1' : '-1'}deg)`,
                      }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={testimonial.avatar}
                            alt={testimonial.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <div className="font-semibold">
                              {testimonial.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              @{testimonial.username}
                            </div>
                          </div>
                        </div>
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        {testimonial.content}
                      </p>
                      <div className="mt-4 text-sm text-gray-500">
                        {testimonial.date}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Second Row - Scrolling Left */}
              <div className="relative">
                <div className="flex gap-6 animate-scroll-left">
                  {testimonials.slice(5, 10).map((testimonial, index) => (
                    <div
                      key={`row2-${index}`}
                      className="min-w-[350px] bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105"
                      style={{
                        transform: `rotate(${index % 2 === 0 ? '-1' : '1'}deg)`,
                      }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={testimonial.avatar}
                            alt={testimonial.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <div className="font-semibold">
                              {testimonial.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              @{testimonial.username}
                            </div>
                          </div>
                        </div>
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        {testimonial.content}
                      </p>
                      <div className="mt-4 text-sm text-gray-500">
                        {testimonial.date}
                      </div>
                    </div>
                  ))}
                  {/* Duplicate for seamless loop */}
                  {testimonials.slice(5, 10).map((testimonial, index) => (
                    <div
                      key={`row2-dup-${index}`}
                      className="min-w-[350px] bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105"
                      style={{
                        transform: `rotate(${index % 2 === 0 ? '-1' : '1'}deg)`,
                      }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={testimonial.avatar}
                            alt={testimonial.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <div className="font-semibold">
                              {testimonial.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              @{testimonial.username}
                            </div>
                          </div>
                        </div>
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        {testimonial.content}
                      </p>
                      <div className="mt-4 text-sm text-gray-500">
                        {testimonial.date}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ContainerPadding>

            <style
              dangerouslySetInnerHTML={{
                __html: `
              @keyframes scroll-right {
                0% {
                  transform: translateX(0);
                }
                100% {
                  transform: translateX(-50%);
                }
              }

              @keyframes scroll-left {
                0% {
                  transform: translateX(-50%);
                }
                100% {
                  transform: translateX(0);
                }
              }

              .animate-scroll-right {
                animation: scroll-right 40s linear infinite;
              }

              .animate-scroll-left {
                animation: scroll-left 40s linear infinite;
              }

              .animate-scroll-right:hover,
              .animate-scroll-left:hover {
                animation-play-state: paused;
              }
            `,
              }}
            />
          </section>

          <SectionDivider />

          {/* FAQ Section */}
          <section className="flex flex-col">
            <ContainerPadding>
              <Faqs />
            </ContainerPadding>
          </section>

          <SectionDivider />

          {/* CTA Section */}
          <CTA />

          <div className="flex justify-center items-center py-12">
            <a
              href="https://theresanaiforthat.com/ai/lovarank/?ref=featured&v=915251"
              target="_blank"
              rel="nofollow noreferrer"
            >
              <img
                width="300"
                src="https://media.theresanaiforthat.com/featured-on-taaft.png?width=600"
              />
            </a>
          </div>
          <SectionDivider />
        </div>
      </div>
    </div>
  );
}
