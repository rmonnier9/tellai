'use server';

import { auth } from '@workspace/auth/server';
import prisma from '@workspace/db/prisma/client';
import { headers } from 'next/headers';

export async function updateUserEmailPreferences(data: {
  emailNotificationsContentPlanner?: boolean;
  emailNotificationsArticleGenerated?: boolean;
}) {
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

    // Update the user's email preferences
    const updatedUser = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        ...(data.emailNotificationsContentPlanner !== undefined && {
          emailNotificationsContentPlanner:
            data.emailNotificationsContentPlanner,
        }),
        ...(data.emailNotificationsArticleGenerated !== undefined && {
          emailNotificationsArticleGenerated:
            data.emailNotificationsArticleGenerated,
        }),
      },
    });

    return {
      success: true,
      user: {
        emailNotificationsContentPlanner:
          updatedUser.emailNotificationsContentPlanner,
        emailNotificationsArticleGenerated:
          updatedUser.emailNotificationsArticleGenerated,
      },
    };
  } catch (error) {
    console.error('Error updating user email preferences:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update email preferences',
    };
  }
}
