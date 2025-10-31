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

export function ContentPlannerReadyEmail(props: {
  productName?: string | null;
  articleCount: number;
  dashboardUrl: string;
}) {
  const { productName, articleCount, dashboardUrl } = props;
  const title = 'Your content plan is ready';
  const subtitle = productName ? `for ${productName}` : undefined;

  return (
    <Html>
      <Head />
      <Preview>{`${title}${subtitle ? ` ${subtitle}` : ''}`}</Preview>
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
                We just generated {articleCount} new article ideas in your
                content planner.
              </Text>
              <Text className="mt-2 text-base leading-6 text-neutral-800">
                Review, reorganize or edit the content planner right from your
                dashboard.
              </Text>
              <div className="mt-6">
                <Button
                  className="rounded-md bg-black px-4 py-3 text-sm font-medium text-white"
                  href={dashboardUrl}
                >
                  Open dashboard
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
