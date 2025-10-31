'use server';

import { auth } from '@workspace/auth/server';
import prisma from '@workspace/db/prisma/client';
import { headers } from 'next/headers';

export async function getUserEmailPreferences() {
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

    // Get the user's email preferences
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        emailNotificationsContentPlanner: true,
        emailNotificationsArticleGenerated: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    return {
      success: true,
      preferences: {
        emailNotificationsContentPlanner: user.emailNotificationsContentPlanner,
        emailNotificationsArticleGenerated:
          user.emailNotificationsArticleGenerated,
      },
    };
  } catch (error) {
    console.error('Error getting user email preferences:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get email preferences',
    };
  }
}
