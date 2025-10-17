import { AuthView } from '@daveyplate/better-auth-ui';
import { authViewPaths } from '@daveyplate/better-auth-ui/server';
import Image from 'next/image';
export const dynamicParams = false;
export function generateStaticParams() {
  return Object.values(authViewPaths).map((path) => ({ path }));
}
export default async function AuthPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;

  return (
    // <main className="container flex grow flex-col items-center justify-center self-center p-4 md:p-6">
    //   <AuthView path={path} />
    // </main>

    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 w-full">
      <div className="flex w-full max-w-sm flex-col gap-6 items-center justify-center">
        <div className="flex items-center gap-2 self-center">
          <Image
            src="/images/lovarank-logo-icon-animated-2.png"
            alt="Lovarank"
            width={40}
            height={40}
          />
          Lovarank
        </div>
        <AuthView path={path} />
      </div>
    </div>
  );
}
