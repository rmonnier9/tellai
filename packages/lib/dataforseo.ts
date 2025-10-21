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

export const getAuthFetch = () => {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    throw new Error(
      'DataForSEO credentials not found in environment variables'
    );
  }

  return createAuthenticatedFetch(login, password);
};

/**
 * Gets a configured DataForSEO client with authentication
 */
export const getDataForSEOClient = () => {
  const authFetch = getAuthFetch();
  return new DataForSEO.DataforseoLabsApi('https://api.dataforseo.com', {
    fetch: authFetch,
  });
};

export const createDataforseoLabsApiClient = () => {
  const authFetch = getAuthFetch();
  return new DataForSEO.DataforseoLabsApi('https://api.dataforseo.com', {
    fetch: authFetch,
  });
};

export const createKeywordsDataApiClient = () => {
  const authFetch = getAuthFetch();
  return new DataForSEO.KeywordsDataApi('https://api.dataforseo.com', {
    fetch: authFetch,
  });
};

/**
 * Maps country ISO codes to DataForSEO location codes
 * @param countryCode - Two-letter ISO country code (e.g., "US", "GB")
 * @returns DataForSEO location code number
 */
export const getLocationCode = (countryCodeISO: string): number => {
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
  return locationMap[countryCodeISO.toUpperCase()] || 2840; // Default to US if not found
};

/**
 * Maps country ISO codes to DataForSEO language codes
 * @param countryCode - Two-letter ISO country code (e.g., "US", "GB")
 * @returns DataForSEO language code string
 */
export const getLanguageCode = (countryCodeISO: string): string => {
  const languageMap: Record<string, string> = {
    AL: 'sq', // Albania - Albanian
    DZ: 'fr', // Algeria - French
    AO: 'pt', // Angola - Portuguese
    AZ: 'az', // Azerbaijan - Azeri
    AR: 'es', // Argentina - Spanish
    AU: 'en', // Australia - English
    AT: 'de', // Austria - German
    BH: 'ar', // Bahrain - Arabic
    BD: 'bn', // Bangladesh - Bengali
    AM: 'hy', // Armenia - Armenian
    BE: 'nl', // Belgium - Dutch
    BO: 'es', // Bolivia - Spanish
    BA: 'bs', // Bosnia and Herzegovina - Bosnian
    BR: 'pt', // Brazil - Portuguese
    BG: 'bg', // Bulgaria - Bulgarian
    MM: 'en', // Myanmar (Burma) - English
    KH: 'en', // Cambodia - English
    CM: 'fr', // Cameroon - French
    CA: 'en', // Canada - English
    LK: 'en', // Sri Lanka - English
    CL: 'es', // Chile - Spanish
    TW: 'zh-TW', // Taiwan - Chinese (Traditional)
    CO: 'es', // Colombia - Spanish
    CR: 'es', // Costa Rica - Spanish
    HR: 'hr', // Croatia - Croatian
    CY: 'en', // Cyprus - English
    CZ: 'cs', // Czechia - Czech
    DK: 'da', // Denmark - Danish
    EC: 'es', // Ecuador - Spanish
    SV: 'es', // El Salvador - Spanish
    EE: 'et', // Estonia - Estonian
    FI: 'fi', // Finland - Finnish
    FR: 'fr', // France - French
    DE: 'de', // Germany - German
    GH: 'en', // Ghana - English
    GR: 'el', // Greece - Greek
    GT: 'es', // Guatemala - Spanish
    HK: 'en', // Hong Kong - English
    HU: 'hu', // Hungary - Hungarian
    IN: 'en', // India - English
    ID: 'en', // Indonesia - English
    IE: 'en', // Ireland - English
    IL: 'he', // Israel - Hebrew
    IT: 'it', // Italy - Italian
    CI: 'fr', // Cote d'Ivoire - French
    JP: 'ja', // Japan - Japanese
    KZ: 'ru', // Kazakhstan - Russian
    JO: 'ar', // Jordan - Arabic
    KE: 'en', // Kenya - English
    KR: 'ko', // South Korea - Korean
    LV: 'lv', // Latvia - Latvian
    LT: 'lt', // Lithuania - Lithuanian
    MY: 'en', // Malaysia - English
    MT: 'en', // Malta - English
    MX: 'es', // Mexico - Spanish
    MC: 'fr', // Monaco - French
    MD: 'ro', // Moldova - Romanian
    MA: 'ar', // Morocco - Arabic
    NL: 'nl', // Netherlands - Dutch
    NZ: 'en', // New Zealand - English
    NI: 'es', // Nicaragua - Spanish
    NG: 'en', // Nigeria - English
    NO: 'nb', // Norway - Norwegian (Bokmål)
    PK: 'en', // Pakistan - English
    PA: 'es', // Panama - Spanish
    PY: 'es', // Paraguay - Spanish
    PE: 'es', // Peru - Spanish
    PH: 'en', // Philippines - English
    PL: 'pl', // Poland - Polish
    PT: 'pt', // Portugal - Portuguese
    RO: 'ro', // Romania - Romanian
    SA: 'ar', // Saudi Arabia - Arabic
    SN: 'fr', // Senegal - French
    RS: 'sr', // Serbia - Serbian
    SG: 'en', // Singapore - English
    SK: 'sk', // Slovakia - Slovak
    VN: 'en', // Vietnam - English
    SI: 'sl', // Slovenia - Slovenian
    ZA: 'en', // South Africa - English
    ES: 'es', // Spain - Spanish
    SE: 'sv', // Sweden - Swedish
    CH: 'de', // Switzerland - German
    TH: 'th', // Thailand - Thai
    AE: 'ar', // United Arab Emirates - Arabic
    TN: 'ar', // Tunisia - Arabic
    TR: 'tr', // Turkiye - Turkish
    UA: 'uk', // Ukraine - Ukrainian
    MK: 'mk', // North Macedonia - Macedonian
    EG: 'ar', // Egypt - Arabic
    GB: 'en', // United Kingdom - English
    US: 'en', // United States - English
    BF: 'fr', // Burkina Faso - French
    UY: 'es', // Uruguay - Spanish
    VE: 'es', // Venezuela - Spanish
  };
  return languageMap[countryCodeISO.toUpperCase()] || 'en'; // Default to English if not found
};
