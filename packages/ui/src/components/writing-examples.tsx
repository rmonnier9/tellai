'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { MarkdownContent } from './markdown-content';
import { ScrollArea } from './scroll-area';

interface WritingExample {
  id: string;
  title: string;
  author: {
    name: string;
    logo?: string;
  };
  tag: string;
  tagColor: 'blue' | 'purple' | 'green';
  image: string;
  articleTitle: string;
  content: string;
}

interface WritingExamplesProps {
  examples: WritingExample[];
  heading: string;
  ctaText: string;
  ctaUrl?: string;
  ctaDescription: string;
}

export function WritingExamples({
  examples,
  heading,
  ctaText,
  ctaUrl,
  ctaDescription,
}: WritingExamplesProps) {
  const [selectedExample, setSelectedExample] = useState<WritingExample | null>(
    examples[0] || null
  );
  const [mobileDialogOpen, setMobileDialogOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleCardClick = (example: WritingExample) => {
    setSelectedExample(example);
    // On mobile, open dialog
    if (isMobile) {
      setMobileDialogOpen(true);
    }
  };

  const getTagColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-100 text-blue-700';
      case 'purple':
        return 'bg-purple-100 text-purple-700';
      case 'green':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-12">
        <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          {heading}
        </div>
        <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
          <span className="block">AI-generated content that </span>
          <span className="text-primary-500">humans love to read.</span>
        </h2>
        {/* <div className="flex items-center gap-2 text-primary-600">
          <span className="text-lg">Check examples</span>
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </div> */}
      </div>

      {/* Content Grid */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Left Side - Article Cards */}
        <div className="space-y-4">
          {examples.map((example) => (
            <button
              key={example.id}
              onClick={() => handleCardClick(example)}
              className={`w-full text-left p-6 rounded-2xl border-2 transition-all duration-200 hover:shadow-lg ${
                selectedExample?.id === example.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <h3 className="text-lg md:text-xl font-bold mb-4">
                {example.title}
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {example.author.logo ? (
                    <img
                      src={example.author.logo}
                      alt={example.author.name}
                      className="w-6 h-6 rounded object-contain"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded bg-primary-500 flex items-center justify-center text-white text-xs font-bold">
                      {example.author.name[0]}
                    </div>
                  )}
                  <span className="font-semibold text-gray-900">
                    {example.author.name}
                  </span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getTagColorClasses(
                    example.tagColor
                  )}`}
                >
                  {example.tag}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Right Side - Article Content (Desktop Only) */}
        {selectedExample && (
          <div className="hidden md:flex flex-col bg-white rounded-2xl border-2 border-gray-200 overflow-hidden sticky top-8 shadow-sm max-h-[calc(100vh-4rem)]">
            <ScrollArea className="flex-1 max-h-[550px]">
              <img
                src={selectedExample.image}
                alt={selectedExample.articleTitle}
                className="w-full h-48 object-cover flex-shrink-0"
              />
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-6 text-gray-900">
                  {selectedExample.articleTitle}
                </h3>
                <MarkdownContent
                  content={selectedExample.content}
                  className="prose-md"
                />
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Mobile Dialog */}
      <Dialog open={mobileDialogOpen} onOpenChange={setMobileDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedExample && (
            <>
              <img
                src={selectedExample.image}
                alt={selectedExample.articleTitle}
                className="w-full h-48 object-cover -mx-6 -mt-6 mb-6"
              />
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  {selectedExample.articleTitle}
                </DialogTitle>
              </DialogHeader>
              <MarkdownContent
                content={selectedExample.content}
                className="prose-md"
              />
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* CTA Section */}
      <div className="text-center py-8">
        <p className="text-lg text-gray-600 italic mb-6">{ctaDescription}</p>
        <a
          href={ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-full transition-colors duration-200 shadow-lg hover:shadow-xl"
        >
          {ctaText}
        </a>
      </div>
    </div>
  );
}
