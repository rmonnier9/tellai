// Configuration Crisp
const crispWebsiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID!;
const crispIdentifier = process.env.CRISP_IDENTIFIER!;
const crispKey = process.env.CRISP_KEY!;
const crispBaseUrl = "https://api.crisp.chat/v1";

// Fonction utilitaire pour faire des appels API à Crisp
async function crispApiCall(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
  data?: any
) {
  const response = await fetch(`${crispBaseUrl}${endpoint}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${crispIdentifier}:${crispKey}`
      ).toString("base64")}`,
      "X-Crisp-Tier": "plugin",
      "Content-Type": "application/json",
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
    await crispApiCall(`/website/${crispWebsiteId}/people/profile/`, "POST", {
      email,
      person: { nickname: person.nickname },
    });

    return { success: true };
  } catch (error) {
    console.error("Error creating Crisp profile:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
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
      "POST",
      { text: name }
    );

    return { success: true };
  } catch (error) {
    console.error("Error triggering Crisp event:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Fonction utilitaire pour créer un profil et déclencher l'événement waitlist
 */
export async function handleWaitlistUser(email: string) {
  try {
    // Créer le profil utilisateur
    const profileResult = await createCrispProfile(email, {
      nickname: email.split("@")[0], // Utiliser la partie avant @ comme nickname
    });

    if (!profileResult.success) {
      console.error("Failed to create Crisp profile:", profileResult.error);
      return { success: false, error: "Failed to create user profile" };
    }

    // Déclencher l'événement user:joined_waitlist
    const eventResult = await triggerCrispEvent(email, "user:joined_waitlist");

    if (!eventResult.success) {
      console.error("Failed to trigger Crisp event:", eventResult.error);
      return { success: false, error: "Failed to trigger waitlist event" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error handling waitlist user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
