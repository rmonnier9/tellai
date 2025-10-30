'use server';

import { createCrispProfile, triggerCrispEvent } from '../crisp';

/**
 * Track user registration in Crisp by creating a profile and triggering a register event
 * This should only be called for newly registered users (within 2 minutes of creation)
 */
export async function trackUserRegistration({
  email,
  name,
}: {
  email: string;
  name: string;
}) {
  try {
    // Create Crisp profile
    const profileResult = await createCrispProfile(email, { nickname: name });

    if (!profileResult.success) {
      console.error('Failed to create Crisp profile:', profileResult.error);
      return { success: false, error: 'Failed to create user profile' };
    }

    // Trigger register event
    const eventResult = await triggerCrispEvent(email, 'user:register');

    if (!eventResult.success) {
      console.error('Failed to trigger Crisp event:', eventResult.error);
      return { success: false, error: 'Failed to trigger registration event' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error tracking user registration:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
