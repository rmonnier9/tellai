import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';

export function ArticleGeneratedEmail(props: {
  productName?: string | null;
  articleTitle?: string | null;
  dashboardUrl: string;
}) {
  const { productName, articleTitle, dashboardUrl } = props;
  const title = 'New blog post generated';
  const subtitleParts: string[] = [];
  if (productName) subtitleParts.push(`Project: ${productName}`);
  if (articleTitle) subtitleParts.push(`Title: ${articleTitle}`);
  const subtitle = subtitleParts.length ? subtitleParts.join(' • ') : undefined;

  return (
    <Html>
      <Head />
      <Preview>{`${title}${articleTitle ? ` — ${articleTitle}` : ''}`}</Preview>
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container className="mx-auto my-8 w-full max-w-xl p-6">
            <Heading className="m-0 text-2xl font-semibold text-black">
              {title}
            </Heading>
            {subtitle ? (
              <Text className="mt-1 text-sm text-neutral-600">{subtitle}</Text>
            ) : null}

            <Hr className="my-6 border-neutral-200" />

            <Section>
              <Text className="text-base leading-6 text-neutral-800">
                Your blog post is ready to review.
              </Text>
              <Text className="mt-2 text-base leading-6 text-neutral-800">
                Open the dashboard to review, edit.
              </Text>
              <div className="mt-6">
                <Button
                  className="rounded-md bg-black px-4 py-3 text-sm font-medium text-white"
                  href={dashboardUrl}
                >
                  Review article
                </Button>
              </div>
            </Section>

            <Hr className="my-6 border-neutral-200" />

            <Text className="text-xs text-neutral-500">
              You are receiving this because you have access to this project in
              Lovarank.{' '}
              <Link
                href={`${dashboardUrl}/settings/email-preferences`}
                className="text-neutral-500 underline"
              >
                Manage email preferences
              </Link>
              .
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
