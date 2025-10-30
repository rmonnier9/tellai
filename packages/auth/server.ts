import { createId as cuid } from '@paralleldrive/cuid2';
import prisma from '@workspace/db/prisma/client';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import { customSession } from 'better-auth/plugins';

import { stripe } from '@better-auth/stripe';
import Stripe from 'stripe';

import { EmailTemplate } from '@daveyplate/better-auth-ui/server';
import { send } from '@workspace/emails';
import { admin, magicLink, organization } from 'better-auth/plugins';
import enqueueJob from '../lib/enqueue-job';
import { trackUserRegistration } from '../lib/server-actions/track-user-registration';

const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

const sendMagicLink = async (props: { email: string; url: string }) => {
  const tests = await send({
    from: `Lovarank <${process.env.EMAIL_FROM as string}>`,
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

  console.log('TESTS_------------------_>', tests);
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
    admin({
      adminUserIds: process.env.ADMIN_IDS?.split(','),
    }),
    nextCookies(),
    customSession(async ({ user, session }) => {
      // Only fetch a default product if activeProductId is not already set in the session
      let activeProductId = (session as any).activeProductId as string;

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

        activeProductId = product?.id as string;

        if (activeProductId) {
          await prisma.session.update({
            where: {
              id: session.id,
            },
            data: {
              activeProductId,
            },
          });
        }
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

          // TODO: Find better place for this
          await enqueueJob({
            jobType: 'content_planner',
            productId: subscription.referenceId,
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
          let referralId: string | undefined;

          if (request && request.headers) {
            const cookieHeader = request.headers.get('cookie');
            if (cookieHeader) {
              const cookies = cookieHeader.split(';').reduce(
                (acc, cookie) => {
                  const [key, value] = cookie.trim().split('=');
                  if (key && value) {
                    acc[key] = value;
                  }
                  return acc;
                },
                {} as Record<string, string>
              );

              referralId = cookies['rewardful_referral'];
            }
          }

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
              // https://app.getrewardful.com/setup/code?platform=stripe_checkout_server
              client_reference_id: referralId,
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
  hooks: undefined,
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            console.log('TESTS_------------------_>', user);
            await trackUserRegistration({
              email: user.email,
              name: user.name || user.email.split('@')[0]!,
            });
          } catch (error) {
            console.error(
              'Error tracking user registration in user hook:',
              error
            );
          }
        },
      },
    },
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
