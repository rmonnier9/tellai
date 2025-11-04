import getSession from '@workspace/lib/get-session';
import Header from './header';

export default async function HeaderWrapper() {
  const session = await getSession();
  const isAuthenticated = !!session?.session;

  return <Header isAuthenticated={isAuthenticated} />;
}

