export default function MDXLayout({ children }: { children: React.ReactNode }) {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="pb-12 pt-16 md:pb-20 md:pt-24">
          <article className="prose prose-lg dark:prose-invert mx-auto">
            {children}
          </article>
        </div>
      </div>
    </section>
  );
}
