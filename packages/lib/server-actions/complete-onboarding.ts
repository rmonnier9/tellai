'use server';

import { auth } from '@workspace/auth/server';
import { headers } from 'next/headers';
import prisma from '@workspace/db/prisma/client';
import { OnboardingProductSchema } from '../dtos';
import { redirect } from 'next/navigation';

export async function completeOnboarding(data: OnboardingProductSchema) {
  try {
    // Get the current session directly using better-auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return {
        success: false,
        error: 'Unauthorized - no session found',
      };
    }

    // Type assertion to get activeOrganizationId
    const sessionWithOrgId = session.session as typeof session.session & {
      activeOrganizationId?: string;
    };

    if (!sessionWithOrgId.activeOrganizationId) {
      return {
        success: false,
        error: 'No active organization found',
      };
    }

    // Validate the data
    const validatedData = OnboardingProductSchema.parse(data);

    // Create the product in the database
    const product = await prisma.product.create({
      data: {
        name: validatedData.name,
        url: validatedData.url,
        description: validatedData.description,
        language: validatedData.language,
        country: validatedData.country,
        logo: validatedData.logo || null,
        targetAudiences: validatedData.targetAudiences,
        sitemapUrl: validatedData.sitemapUrl || null,
        blogUrl: validatedData.blogUrl || null,
        bestArticles: validatedData.bestArticles || [],
        // Article preferences
        autoPublish: validatedData.autoPublish,
        articleStyle: validatedData.articleStyle,
        internalLinks: validatedData.internalLinks,
        globalInstructions: validatedData.globalInstructions || null,
        imageStyle: validatedData.imageStyle,
        brandColor: validatedData.brandColor,
        includeYoutubeVideo: validatedData.includeYoutubeVideo,
        includeCallToAction: validatedData.includeCallToAction,
        includeInfographics: validatedData.includeInfographics,
        includeEmojis: validatedData.includeEmojis,
        organization: {
          connect: {
            id: sessionWithOrgId.activeOrganizationId,
          },
        },
      },
    });

    // Update the session in the database with the new activeProductId
    await prisma.session.update({
      where: {
        id: session.session.id,
      },
      data: {
        activeProductId: product.id,
      },
    });

    // Refresh the session cache
    await auth.api.getSession({
      query: {
        disableCookieCache: true,
      },
      headers: await headers(),
    });

    return { success: true, productId: product.id };
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to complete onboarding',
    };
  }
}

export async function completeOnboardingAndRedirect(
  data: OnboardingProductSchema
) {
  const result = await completeOnboarding(data);

  if (result.success) {
    redirect('/');
  }

  return result;
}

export default completeOnboarding;
