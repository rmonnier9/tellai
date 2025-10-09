import Accordion from "@/components/accordion";

export default function Faqs() {
  const faqs = [
    {
      question: "How does Lovarank find keywords for my blog?",
      answer:
        "Lovarank analyzes your niche and history to suggest low-competition keywords for both Google and ChatGPT search.",
      active: true,
    },
    {
      question: "Will Google penalize AI content?",
      answer:
        "No. Every article is optimized to follow Google’s EEAT guidelines.",
    },
    {
      question: "Do I need SEO knowledge to use Lovarank?",
      answer:
        "Not at all. Everything is automated, from keywords to publishing.",
    },
    {
      question: "Will the articles publish directly to my blog?",
      answer: "Yes. WordPress, Webflow integrations allow one-click sync.",
    },
    {
      question: "How long does it take to see results?",
      answer:
        "Some users see traffic growth within weeks, but SEO + AI ranking compound over months.",
    },
    {
      question: "Why optimize for ChatGPT & Perplexity?",
      answer:
        "Because AI search is the new Google: more and more users rely on it daily. Getting visibility there means future-proofing your growth.",
    },
  ];

  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="pb-12 md:pb-20">
          <div className="mx-auto max-w-3xl pb-12 text-center md:pb-20">
            <h2 className="text-3xl font-bold md:text-4xl">
              Questions we often get
            </h2>
          </div>
          <div className="mx-auto max-w-3xl">
            <div className="space-y-2">
              {faqs.map((faq, index) => (
                <Accordion
                  key={index}
                  title={faq.question}
                  id={`faqs-${index}`}
                  active={faq.active}
                >
                  {faq.answer}
                </Accordion>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
