export const tools = [
  {
    id: 'ai-blog-post-generator',
    title: 'AI Blog Post Generator',
    description:
      'Generate SEO-optimized blog posts automatically with AI. Get discovered on Google, ChatGPT, and Perplexity with articles crafted to rank and drive organic traffic. Automatic keyword discovery, optimized content, and publishing to your favorite platform - all while you focus on growing your business.',
    image: '/images/bg-1.jpeg',
    cta: {
      url: undefined,
    },
    howItWorks: [
      {
        title: 'Automatic Keyword Discovery',
        description:
          'Our AI analyzes your niche and identifies hidden, low-competition keywords that your competitors are missing. Get highly qualified traffic by targeting long-tail keywords optimized for both Google and AI search engines like ChatGPT and Perplexity.',
      },
      {
        title: 'AI-Powered Content Creation',
        description:
          "Lovarank generates complete, SEO-optimized blog posts that follow Google's EEAT guidelines (Experience, Expertise, Authoritativeness, Trustworthiness). Every article is structured with proper headings, optimized meta descriptions, and strategic keyword placement to maximize search visibility.",
      },
      {
        title: 'Smart Content Calendar',
        description:
          'Get a ready-to-go editorial plan with articles scheduled daily to maintain consistency and maximize visibility. Our AI plans your content strategy month after month, ensuring you never run out of topics that resonate with your audience.',
      },
      {
        title: 'Automatic Publishing',
        description:
          'Articles publish directly to your blog on WordPress, Webflow, Framer, Shopify, Wix, Notion, Ghost, or any custom integration. No copy-paste, no manual work. Set it up once and let the AI handle everything from creation to publication.',
      },
      {
        title: 'Edit & Refine',
        description:
          'While automation handles the heavy lifting, you maintain full control. Easily fine-tune any article to match your brand voice and vision before it goes live. Every word supports your goals and creates impactful content.',
      },
    ],
    faq: [
      {
        question: 'What is an AI blog post generator?',
        answer:
          'An AI blog post generator is an automated tool that uses artificial intelligence to create complete, SEO-optimized blog articles. Lovarank goes beyond simple content generation by discovering low-competition keywords, crafting articles that rank on Google and AI search engines like ChatGPT, and automatically publishing to your platform of choice.',
      },
      {
        question: 'Will Google penalize AI-generated content?',
        answer:
          "No. Google doesn't penalize AI content - they penalize low-quality content. Every Lovarank article is optimized to follow Google's EEAT (Experience, Expertise, Authoritativeness, Trustworthiness) guidelines, ensuring your content meets search engine quality standards while driving real organic traffic.",
      },
      {
        question: 'How long does it take to see results?',
        answer:
          'Some users see traffic growth within 2-4 weeks, but SEO and AI search optimization compound over time. The consistent daily publishing provided by Lovarank creates a snowball effect - the more quality content you publish, the more authority you build, and the faster your traffic grows.',
      },
      {
        question: 'Do I need SEO knowledge to use this?',
        answer:
          'Not at all. Everything is automated, from keyword discovery to content creation and publishing. Lovarank handles all the technical SEO optimization - keyword placement, meta tags, heading structure, internal linking - so you can focus on your business while your organic traffic grows on autopilot.',
      },
      {
        question:
          'What makes Lovarank different from other AI blog generators?',
        answer:
          "Lovarank is the only AI blog post generator that optimizes for both traditional Google search AND AI search engines like ChatGPT and Perplexity. Plus, we automate the entire workflow: keyword discovery, article generation, content calendar planning, and direct publishing to your platform. It's truly hands-off content marketing.",
      },
      {
        question: 'Which platforms can Lovarank publish to?',
        answer:
          'Lovarank integrates directly with WordPress, Webflow, Framer, Shopify, Wix, Notion, Ghost, and custom integrations. Articles are automatically published to your blog - no copy-paste, no manual formatting, no technical hassles.',
      },
      {
        question: 'Can I edit the AI-generated blog posts?',
        answer:
          'Yes! While Lovarank automates the heavy lifting, you have full control to fine-tune any article before publication. Edit, refine, and customize the content to perfectly match your brand voice and vision.',
      },
      {
        question: 'Why optimize for ChatGPT and Perplexity?',
        answer:
          "AI search is the new frontier of SEO. Millions of users now rely on ChatGPT, Perplexity, and other AI assistants for research and recommendations. Getting visibility in AI search results means future-proofing your growth and reaching audiences where traditional Google SEO can't.",
      },
    ],
  },
];

export type Tool = (typeof tools)[number];
