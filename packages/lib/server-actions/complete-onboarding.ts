'use server';

import { auth } from '@workspace/auth/server';
import prisma from '@workspace/db/prisma/client';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { OnboardingProductSchema } from '../dtos';
import { detectLinksFromSitemap } from './detect-links';

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
        competitors: validatedData.competitors || [],
        sitemapUrl: validatedData.sitemapUrl || null,
        blogUrl: validatedData.blogUrl || null,
        bestArticles: validatedData.bestArticles || [],
        // Linking configuration
        linkSource: validatedData.sitemapUrl ? 'sitemap' : 'database',
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
        removeWatermark: false,
        organization: {
          connect: {
            id: sessionWithOrgId.activeOrganizationId,
          },
        },
      },
    });

    // If sitemap URL is provided, detect links in the background
    if (validatedData.sitemapUrl) {
      // Run link detection asynchronously - don't block onboarding if it fails
      detectLinksFromSitemap(product.id, validatedData.sitemapUrl)
        .then((result) => {
          if (result.success) {
            console.log(
              `✅ Successfully detected ${result.totalUrls} links from sitemap during onboarding`
            );
          } else {
            console.warn(
              `⚠️ Failed to detect links from sitemap during onboarding: ${result.error}`
            );
          }
        })
        .catch((error) => {
          console.error(
            '⚠️ Error detecting links from sitemap during onboarding:',
            error
          );
        });
    }

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
