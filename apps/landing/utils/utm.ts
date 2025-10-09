/**
 * UTM Parameter utilities for tracking marketing campaigns
 */

export interface UTMParameters {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  utm_id?: string;
}

/**
 * Extract UTM parameters from the current URL
 */
export function getUTMParameters(): UTMParameters {
  if (typeof window === "undefined") {
    return {};
  }

  const urlParams = new URLSearchParams(window.location.search);

  return {
    utm_source: urlParams.get("utm_source") || undefined,
    utm_medium: urlParams.get("utm_medium") || undefined,
    utm_campaign: urlParams.get("utm_campaign") || undefined,
    utm_term: urlParams.get("utm_term") || undefined,
    utm_content: urlParams.get("utm_content") || undefined,
    utm_id: urlParams.get("utm_id") || undefined,
  };
}

/**
 * Store UTM parameters in localStorage for persistence across page navigation
 */
export function storeUTMParameters(utmParams: UTMParameters): void {
  if (typeof window === "undefined") {
    return;
  }

  // Only store if we have at least one UTM parameter
  const hasUTMParams = Object.values(utmParams).some(
    (value) => value !== undefined
  );

  if (hasUTMParams) {
    localStorage.setItem("utm_parameters", JSON.stringify(utmParams));
  }
}

/**
 * Retrieve stored UTM parameters from localStorage
 */
export function getStoredUTMParameters(): UTMParameters {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const stored = localStorage.getItem("utm_parameters");
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error("Error parsing stored UTM parameters:", error);
    return {};
  }
}

/**
 * Get UTM parameters from URL or localStorage (URL takes precedence)
 */
export function getUTMParametersWithFallback(): UTMParameters {
  const urlParams = getUTMParameters();
  const storedParams = getStoredUTMParameters();

  // URL parameters take precedence over stored parameters
  return {
    ...storedParams,
    ...urlParams,
  };
}

/**
 * Clear stored UTM parameters from localStorage
 */
export function clearStoredUTMParameters(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("utm_parameters");
}
