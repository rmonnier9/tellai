import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import prisma from '@workspace/db/prisma/client';
import Stripe from 'stripe';
import { stripe } from '@better-auth/stripe';

import { organization, magicLink } from 'better-auth/plugins';
import { EmailTemplate } from '@daveyplate/better-auth-ui/server';
import { send } from '@workspace/emails';

import { db } from '@workspace/db';

const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

const sendMagicLink = async (props: { email: string; url: string }) => {
  await send({
    from: process.env.EMAIL_FROM as string,
    to: props.email,
    subject: 'Verify your email address',
    replyTo: 'support@lovarank.com',
    // react: VercelInviteUserEmail({
    //   username: 'John Doe',
    //   invitedByUsername: 'Jane Doe',
    //   invitedByEmail: 'jane@doe.com',
    //   teamName: 'Lovarank',
    //   teamImage: 'https://www.lovarank.com/logo.png',
    // }),
    react: EmailTemplate({
      action: 'Verify Email',
      heading: 'Verify Email',
      siteName: 'Lovarank',
      baseUrl: 'https://www.lovarank.com',
      content: 'Click the button below to verify your email address.' as any,
      url: props.url,
    }),
  });
};

export const auth = betterAuth({
  // database: drizzleAdapter(db, {
  //   provider: 'pg',
  // }),
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
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
    stripe({
      stripeClient,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
      createCustomerOnSignUp: true,
      subscription: {
        enabled: true,
        plans: [
          {
            name: 'basic', // the name of the plan, it'll be automatically lower cased when stored in the database
            priceId: 'price_1234567890', // the price ID from stripe
            annualDiscountPriceId: 'price_1234567890', // (optional) the price ID for annual billing with a discount
            limits: {
              projects: 5,
              storage: 10,
            },
          },
          {
            name: 'pro',
            priceId: 'price_0987654321',
            limits: {
              projects: 20,
              storage: 50,
            },
            freeTrial: {
              days: 14,
            },
          },
        ],
        authorizeReference: async ({ user, referenceId, action }) => {
          const member = await prisma.member.findFirst({
            where: {
              userId: user.id,
              organizationId: referenceId,
            },
          });

          return member?.role === 'owner' || member?.role === 'admin';
        },
      },
    }),
  ],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
});
