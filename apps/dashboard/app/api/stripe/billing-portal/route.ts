import prisma from '@workspace/db/prisma/client';
import getSession from '@workspace/lib/get-session';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session?.session || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's Stripe customer ID
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        stripeCustomerId: true,
      },
    });

    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No Stripe customer found' },
        { status: 404 }
      );
    }

    // Create a billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || 'http://localhost:3000'}/`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Error creating billing portal session:', error);
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    );
  }
}
