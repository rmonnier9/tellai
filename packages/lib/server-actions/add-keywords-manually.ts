'use server';

import prisma from '@workspace/db/prisma/client';
import { revalidatePath } from 'next/cache';

type AddKeywordsManuallyInput = {
  productId: string;
  keywords: string[];
};

type AddKeywordsManuallyResult = {
  success: boolean;
  error?: string;
  addedCount?: number;
  availableSlots?: number;
};

/**
 * Add keywords manually to the content calendar
 * Keywords will be scheduled starting from the earliest available slot
 */
export async function addKeywordsManually(
  input: AddKeywordsManuallyInput
): Promise<AddKeywordsManuallyResult> {
  try {
    const { productId, keywords } = input;

    if (!productId) {
      return { success: false, error: 'Product ID is required' };
    }

    if (!keywords || keywords.length === 0) {
      return { success: false, error: 'At least one keyword is required' };
    }

    // Validate product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    // Get all existing articles for this product
    const existingArticles = await prisma.article.findMany({
      where: { productId },
      select: { scheduledDate: true },
      orderBy: { scheduledDate: 'asc' },
    });

    // Generate available date slots (starting from today, for next 60 days only)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const availableSlots: Date[] = [];
    const existingDatesSet = new Set(
      existingArticles.map((a) => {
        const date = new Date(a.scheduledDate);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      })
    );

    // Find slots without articles (up to 60 days in the future)
    for (let i = 0; i < 60; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() + i);
      checkDate.setHours(0, 0, 0, 0);

      if (!existingDatesSet.has(checkDate.getTime())) {
        availableSlots.push(checkDate);
      }
    }

    // Check if we have enough slots
    if (keywords.length > availableSlots.length) {
      return {
        success: false,
        error: `You've entered ${keywords.length} keyword${keywords.length > 1 ? 's' : ''} but only ${availableSlots.length} slot${availableSlots.length !== 1 ? 's are' : ' is'} available`,
        availableSlots: availableSlots.length,
      };
    }

    // Create articles for each keyword
    const articlesToCreate = keywords.map((keyword, index) => ({
      productId,
      keyword: keyword.trim(),
      title: keyword.trim(),
      type: 'guide' as const,
      guideSubtype: 'how_to' as const,
      scheduledDate: availableSlots[index]!,
      status: 'pending' as const,
      searchVolume: null,
      keywordDifficulty: null,
      cpc: null,
      competition: null,
    }));

    // Batch create articles
    await prisma.article.createMany({
      data: articlesToCreate,
    });

    // Revalidate the calendar page
    revalidatePath('/calendar');

    return {
      success: true,
      addedCount: keywords.length,
      availableSlots: availableSlots.length,
    };
  } catch (error) {
    console.error('Error adding keywords manually:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add keywords',
    };
  }
}
