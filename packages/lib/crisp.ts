// Configuration Crisp
const crispWebsiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID!;
const crispIdentifier = process.env.CRISP_IDENTIFIER!;
const crispKey = process.env.CRISP_KEY!;
const crispBaseUrl = 'https://api.crisp.chat/v1';

// Fonction utilitaire pour faire des appels API à Crisp
async function crispApiCall(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  data?: Record<string, unknown>
) {
  const response = await fetch(`${crispBaseUrl}${endpoint}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${crispIdentifier}:${crispKey}`
      ).toString('base64')}`,
      'X-Crisp-Tier': 'plugin',
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Crisp API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Crée un profil utilisateur dans Crisp
 */
export async function createCrispProfile(
  email: string,
  person: {
    nickname: string;
  }
) {
  try {
    // Crée le profil
    await crispApiCall(`/website/${crispWebsiteId}/people/profile/`, 'POST', {
      email,
      person: { nickname: person.nickname },
    });

    return { success: true };
  } catch (error) {
    console.error('Error creating Crisp profile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Déclenche un événement pour un utilisateur dans Crisp
 */
export async function triggerCrispEvent(email: string, name: string) {
  try {
    await crispApiCall(
      `/website/${crispWebsiteId}/people/events/${encodeURIComponent(email)}`,
      'POST',
      { text: name }
    );

    return { success: true };
  } catch (error) {
    console.error('Error triggering Crisp event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Ajoute un utilisateur à un segment Crisp (People)
 */
export async function addCrispUserToSegment(email: string, segment: string) {
  try {
    const encodedEmail = encodeURIComponent(email);
    type CrispProfileResponse = { data?: { segments?: string[] } };

    // 1) Try to fetch existing profile to preserve current segments
    let existingSegments: string[] = [];
    try {
      const profile = (await crispApiCall(
        `/website/${crispWebsiteId}/people/profile/${encodedEmail}`,
        'GET'
      )) as CrispProfileResponse;
      const data = profile?.data;
      if (Array.isArray(data?.segments)) {
        existingSegments = data.segments as string[];
      }
    } catch (err) {
      // If 404, we create the profile with the desired segment
      const message = err instanceof Error ? err.message : '';
      const isNotFound = message.includes('404');
      if (!isNotFound) {
        throw err;
      }
      await crispApiCall(`/website/${crispWebsiteId}/people/profile/`, 'POST', {
        email,
        segments: [segment],
      });
      return { success: true };
    }

    // 2) Merge and PATCH segments on existing profile
    const merged = Array.from(new Set([...existingSegments, segment]));
    await crispApiCall(
      `/website/${crispWebsiteId}/people/profile/${encodedEmail}`,
      'PATCH',
      { segments: merged }
    );

    return { success: true };
  } catch (error) {
    console.error('Error adding Crisp user to segment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Ajoute l'utilisateur au segment "customer"
 */
export async function addCrispCustomerSegment(email: string) {
  return addCrispUserToSegment(email, 'customer');
}

/**
 * Fonction utilitaire pour créer un profil et déclencher l'événement waitlist
 */
export async function handleWaitlistUser(email: string) {
  try {
    // Créer le profil utilisateur
    const profileResult = await createCrispProfile(email, {
      nickname: email.split('@')[0]!, // Utiliser la partie avant @ comme nickname
    });

    if (!profileResult.success) {
      console.error('Failed to create Crisp profile:', profileResult.error);
      return { success: false, error: 'Failed to create user profile' };
    }

    // Déclencher l'événement user:joined_waitlist
    const eventResult = await triggerCrispEvent(email, 'user:register');

    if (!eventResult.success) {
      console.error('Failed to trigger Crisp event:', eventResult.error);
      return { success: false, error: 'Failed to trigger waitlist event' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error handling waitlist user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
