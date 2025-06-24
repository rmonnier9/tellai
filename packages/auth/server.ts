import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { organization, magicLink } from 'better-auth/plugins';
import { EmailTemplate } from '@daveyplate/better-auth-ui/server';
import { send } from '@workspace/emails';

import { db } from '@workspace/db';

const sendMagicLink = async (props: { email: string; url: string }) => {
  await send({
    from: process.env.EMAIL_FROM as string,
    to: props.email,
    subject: 'Verify your email address',
    replyTo: 'support@lovadesk.com',
    // react: VercelInviteUserEmail({
    //   username: 'John Doe',
    //   invitedByUsername: 'Jane Doe',
    //   invitedByEmail: 'jane@doe.com',
    //   teamName: 'Lovadesk',
    //   teamImage: 'https://www.lovadesk.com/logo.png',
    // }),
    react: EmailTemplate({
      action: 'Verify Email',
      heading: 'Verify Email',
      siteName: 'Lovadesk',
      baseUrl: 'https://www.lovadesk.com',
      content: 'Click the button below to verify your email address.' as any,
      url: props.url,
    }),
  });
};

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }, request) => {
      await sendMagicLink({
        email: user.email,
        url,
      });
    },
    autoSignInAfterVerification: true,
    sendOnSignUp: true,
  },
  plugins: [
    organization(),
    magicLink({
      sendMagicLink: async ({ email, token, url }) => {
        await sendMagicLink({
          email,
          url,
        });
      },
    }),
    nextCookies(),
  ],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
});
