import * as DataForSEO from 'dataforseo-client';

/**
 * Creates an authenticated fetch function for DataForSEO API
 */
export const createAuthenticatedFetch = (
  username: string,
  password: string
) => {
  return (url: RequestInfo, init?: RequestInit): Promise<Response> => {
    const token = Buffer.from(`${username}:${password}`).toString('base64');
    const authHeader = { Authorization: `Basic ${token}` };

    const newInit: RequestInit = {
      ...init,
      headers: {
        ...init?.headers,
        ...authHeader,
      },
    };

    return fetch(url, newInit);
  };
};

/**
 * Gets a configured DataForSEO client with authentication
 */
export const getDataForSEOClient = () => {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    throw new Error(
      'DataForSEO credentials not found in environment variables'
    );
  }

  const authFetch = createAuthenticatedFetch(login, password);
  return new DataForSEO.DataforseoLabsApi('https://api.dataforseo.com', {
    fetch: authFetch,
  });
};

/**
 * Maps country ISO codes to DataForSEO location codes
 * @param countryCode - Two-letter ISO country code (e.g., "US", "GB")
 * @returns DataForSEO location code number
 */
export const getLocationCode = (countryCode: string): number => {
  const locationMap: Record<string, number> = {
    AL: 2008, // Albania
    DZ: 2012, // Algeria
    AO: 2024, // Angola
    AZ: 2031, // Azerbaijan
    AR: 2032, // Argentina
    AU: 2036, // Australia
    AT: 2040, // Austria
    BH: 2048, // Bahrain
    BD: 2050, // Bangladesh
    AM: 2051, // Armenia
    BE: 2056, // Belgium
    BO: 2068, // Bolivia
    BA: 2070, // Bosnia and Herzegovina
    BR: 2076, // Brazil
    BG: 2100, // Bulgaria
    MM: 2104, // Myanmar (Burma)
    KH: 2116, // Cambodia
    CM: 2120, // Cameroon
    CA: 2124, // Canada
    LK: 2144, // Sri Lanka
    CL: 2152, // Chile
    TW: 2158, // Taiwan
    CO: 2170, // Colombia
    CR: 2188, // Costa Rica
    HR: 2191, // Croatia
    CY: 2196, // Cyprus
    CZ: 2203, // Czechia
    DK: 2208, // Denmark
    EC: 2218, // Ecuador
    SV: 2222, // El Salvador
    EE: 2233, // Estonia
    FI: 2246, // Finland
    FR: 2250, // France
    DE: 2276, // Germany
    GH: 2288, // Ghana
    GR: 2300, // Greece
    GT: 2320, // Guatemala
    HK: 2344, // Hong Kong
    HU: 2348, // Hungary
    IN: 2356, // India
    ID: 2360, // Indonesia
    IE: 2372, // Ireland
    IL: 2376, // Israel
    IT: 2380, // Italy
    CI: 2384, // Cote d'Ivoire
    JP: 2392, // Japan
    KZ: 2398, // Kazakhstan
    JO: 2400, // Jordan
    KE: 2404, // Kenya
    KR: 2410, // South Korea
    LV: 2428, // Latvia
    LT: 2440, // Lithuania
    MY: 2458, // Malaysia
    MT: 2470, // Malta
    MX: 2484, // Mexico
    MC: 2492, // Monaco
    MD: 2498, // Moldova
    MA: 2504, // Morocco
    NL: 2528, // Netherlands
    NZ: 2554, // New Zealand
    NI: 2558, // Nicaragua
    NG: 2566, // Nigeria
    NO: 2578, // Norway
    PK: 2586, // Pakistan
    PA: 2591, // Panama
    PY: 2600, // Paraguay
    PE: 2604, // Peru
    PH: 2608, // Philippines
    PL: 2616, // Poland
    PT: 2620, // Portugal
    RO: 2642, // Romania
    SA: 2682, // Saudi Arabia
    SN: 2686, // Senegal
    RS: 2688, // Serbia
    SG: 2702, // Singapore
    SK: 2703, // Slovakia
    VN: 2704, // Vietnam
    SI: 2705, // Slovenia
    ZA: 2710, // South Africa
    ES: 2724, // Spain
    SE: 2752, // Sweden
    CH: 2756, // Switzerland
    TH: 2764, // Thailand
    AE: 2784, // United Arab Emirates
    TN: 2788, // Tunisia
    TR: 2792, // Turkiye
    UA: 2804, // Ukraine
    MK: 2807, // North Macedonia
    EG: 2818, // Egypt
    GB: 2826, // United Kingdom
    US: 2840, // United States
    BF: 2854, // Burkina Faso
    UY: 2858, // Uruguay
    VE: 2862, // Venezuela
  };
  return locationMap[countryCode.toUpperCase()] || 2840; // Default to US if not found
};
