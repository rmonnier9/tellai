import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import prisma from '@workspace/db/prisma/client';
import { createId as cuid } from '@paralleldrive/cuid2';
import { customSession } from 'better-auth/plugins';

import Stripe from 'stripe';
import { stripe } from '@better-auth/stripe';

import { organization, magicLink } from 'better-auth/plugins';
import { EmailTemplate } from '@daveyplate/better-auth-ui/server';
import { send } from '@workspace/emails';

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
  session: {
    additionalFields: {
      activeProductId: {
        type: 'string',
        required: false,
        defaultValue: null,
      },
    },
  },
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
    customSession(async ({ user, session }) => {
      // Only fetch a default product if activeProductId is not already set in the session
      let activeProductId = (session as any).activeProductId;

      if (!activeProductId) {
        const product = await prisma.product.findFirst({
          where: {
            organization: {
              members: {
                some: {
                  userId: user.id,
                },
              },
            },
          },
        });

        activeProductId = product?.id;
      }

      return {
        user: {
          ...user,
        },
        session: {
          ...session,
          activeProductId,
        },
      };
    }),
    stripe({
      stripeClient,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
      createCustomerOnSignUp: true,
      subscription: {
        enabled: true,
        plans: [
          {
            name: 'premium',
            priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY!,
            freeTrial: {
              days: 3,
              onTrialStart: async (subscription) => {
                // Called when a trial starts
                // await sendTrialStartEmail(subscription.referenceId);
              },
              onTrialEnd: async ({ subscription }, request) => {
                // Called when a trial ends
                // await sendTrialEndEmail(user.email);
              },
              onTrialExpired: async (subscription) => {
                // Called when a trial expires without conversion
                // await sendTrialExpiredEmail(subscription.referenceId);
              },
            },
          },
          // {
          //   name: 'premium',
          //   priceId: 'price_1SBAzNCrZMTHvTEkvckkt6hs',
          // },
          // {
          //   name: 'basic', // the name of the plan, it'll be automatically lower cased when stored in the database
          //   priceId: 'price_1234567890', // the price ID from stripe
          //   annualDiscountPriceId: 'price_1234567890', // (optional) the price ID for annual billing with a discount
          //   limits: {
          //     projects: 5,
          //     storage: 10,
          //   },
          // },
          // {
          //   name: 'pro',
          //   priceId: 'price_0987654321',
          //   limits: {
          //     projects: 20,
          //     storage: 50,
          //   },
          //   freeTrial: {
          //     days: 14,
          //   },
          // },
        ],
        onSubscriptionComplete: async (
          { event, subscription, stripeSubscription, plan },
          request
        ) => {
          await prisma.product.update({
            where: {
              id: subscription.referenceId,
            },
            data: {
              subscription: {
                connect: {
                  id: subscription.id,
                },
              },
            },
          });
        },
        authorizeReference: async ({ user, referenceId, action }) => {
          const member = await prisma.member.findFirst({
            where: {
              userId: user.id,
              organization: {
                products: {
                  some: {
                    id: referenceId,
                  },
                },
              },
            },
          });

          return member?.role === 'owner' || member?.role === 'admin';
        },
        getCheckoutSessionParams: async (
          { user, session, plan, subscription },
          request
        ) => {
          return {
            params: {
              allow_promotion_codes: true,
              billing_address_collection: 'required',
              tax_id_collection: {
                enabled: true,
              },
              automatic_tax: {
                enabled: true,
              },
              // metadata: {
              //   planType: 'business',
              //   referralCode: user.metadata?.referralCode,
              // },
            },
            // options: {
            // idempotencyKey: `sub_${user.id}_${plan.name}_${Date.now()}`,
            // },
          };
        },
      },
      onEvent: async (event) => {
        // Handle any Stripe event
        switch (event.type) {
          case 'invoice.paid':
            // Handle paid invoice
            break;
          case 'payment_intent.succeeded':
            // Handle successful payment
            break;
        }
      },
    }),
  ],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          // const organization = await getActiveOrganization(session.userId);

          let organization = await prisma.organization.findFirst({
            where: {
              members: {
                some: {
                  userId: session.userId,
                  role: 'owner',
                },
              },
            },
          });

          if (!organization) {
            const orgId = cuid();
            organization = await prisma.organization.create({
              data: {
                id: orgId,
                name: `Team ${orgId.slice(0, 4)}`,
                slug: orgId,

                members: {
                  create: {
                    user: {
                      connect: {
                        id: session.userId,
                      },
                    },
                    role: 'owner',
                  },
                },
              },
            });
          }

          return {
            data: {
              ...session,
              activeOrganizationId: organization?.id,
            },
          };
        },
      },
    },
  },
});
