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

/**
 * Maps language codes to informational keywords for blog post content
 * @param languageCode - Language code (e.g., "en", "es", "fr")
 * @returns Array of informational keywords in the specified language
 */
const getInformationalKeywordsByLanguage = (languageCode: string): string[] => {
  const keywordsMap: Record<string, string[]> = {
    en: [
      'how',
      'what',
      'best',
      'top',
      'guide',
      'tutorial',
      'tips',
      'compare',
      'vs',
      'why',
      'when',
      'where',
      'review',
      'ultimate',
      'complete',
      'step by step',
      'beginner',
      'explained',
      'difference',
      'benefits',
    ],
    es: [
      'cómo',
      'qué',
      'mejor',
      'mejores',
      'guía',
      'tutorial',
      'consejos',
      'comparar',
      'vs',
      'por qué',
      'cuándo',
      'dónde',
      'reseña',
      'definitiva',
      'completa',
      'paso a paso',
      'principiantes',
      'explicado',
      'diferencia',
      'beneficios',
    ],
    fr: [
      'comment',
      'quel',
      'meilleur',
      'meilleurs',
      'guide',
      'tutoriel',
      'conseils',
      'comparer',
      'vs',
      'pourquoi',
      'quand',
      'où',
      'avis',
      'ultime',
      'complet',
      'étape par étape',
      'débutant',
      'expliqué',
      'différence',
      'avantages',
    ],
    de: [
      'wie',
      'was',
      'beste',
      'besten',
      'anleitung',
      'tutorial',
      'tipps',
      'vergleich',
      'vs',
      'warum',
      'wann',
      'wo',
      'test',
      'ultimativ',
      'vollständig',
      'schritt für schritt',
      'anfänger',
      'erklärt',
      'unterschied',
      'vorteile',
    ],
    pt: [
      'como',
      'qual',
      'melhor',
      'melhores',
      'guia',
      'tutorial',
      'dicas',
      'comparar',
      'vs',
      'por que',
      'quando',
      'onde',
      'revisão',
      'definitivo',
      'completo',
      'passo a passo',
      'iniciantes',
      'explicado',
      'diferença',
      'benefícios',
    ],
    it: [
      'come',
      'cosa',
      'migliore',
      'migliori',
      'guida',
      'tutorial',
      'consigli',
      'confronto',
      'vs',
      'perché',
      'quando',
      'dove',
      'recensione',
      'definitiva',
      'completo',
      'passo dopo passo',
      'principianti',
      'spiegato',
      'differenza',
      'vantaggi',
    ],
    nl: [
      'hoe',
      'wat',
      'beste',
      'top',
      'gids',
      'tutorial',
      'tips',
      'vergelijken',
      'vs',
      'waarom',
      'wanneer',
      'waar',
      'recensie',
      'ultieme',
      'compleet',
      'stap voor stap',
      'beginners',
      'uitgelegd',
      'verschil',
      'voordelen',
    ],
    pl: [
      'jak',
      'co',
      'najlepszy',
      'najlepsze',
      'przewodnik',
      'tutorial',
      'porady',
      'porównanie',
      'vs',
      'dlaczego',
      'kiedy',
      'gdzie',
      'recenzja',
      'ostateczny',
      'kompletny',
      'krok po kroku',
      'początkujący',
      'wyjaśnione',
      'różnica',
      'korzyści',
    ],
    ru: [
      'как',
      'что',
      'лучший',
      'лучшие',
      'руководство',
      'учебник',
      'советы',
      'сравнение',
      'vs',
      'почему',
      'когда',
      'где',
      'обзор',
      'полный',
      'пошагово',
      'для начинающих',
      'объяснение',
      'разница',
      'преимущества',
    ],
    ja: [
      '方法',
      '何',
      '最高',
      'ベスト',
      'ガイド',
      'チュートリアル',
      'ヒント',
      '比較',
      'vs',
      'なぜ',
      'いつ',
      'どこ',
      'レビュー',
      '究極',
      '完全',
      'ステップバイステップ',
      '初心者',
      '説明',
      '違い',
      'メリット',
    ],
    ar: [
      'كيف',
      'ما',
      'أفضل',
      'الأفضل',
      'دليل',
      'شرح',
      'نصائح',
      'مقارنة',
      'vs',
      'لماذا',
      'متى',
      'أين',
      'مراجعة',
      'شامل',
      'كامل',
      'خطوة بخطوة',
      'للمبتدئين',
      'موضح',
      'الفرق',
      'فوائد',
    ],
    ko: [
      '방법',
      '무엇',
      '최고',
      '베스트',
      '가이드',
      '튜토리얼',
      '팁',
      '비교',
      'vs',
      '왜',
      '언제',
      '어디',
      '리뷰',
      '최종',
      '완전한',
      '단계별',
      '초보자',
      '설명',
      '차이',
      '이점',
    ],
    'zh-TW': [
      '如何',
      '什麼',
      '最好',
      '最佳',
      '指南',
      '教程',
      '技巧',
      '比較',
      'vs',
      '為什麼',
      '何時',
      '哪裡',
      '評論',
      '終極',
      '完整',
      '逐步',
      '初學者',
      '解釋',
      '差異',
      '好處',
    ],
    he: [
      'איך',
      'מה',
      'הכי טוב',
      'מדריך',
      'הדרכה',
      'טיפים',
      'השוואה',
      'vs',
      'למה',
      'מתי',
      'איפה',
      'ביקורת',
      'מלא',
      'צעד אחר צעד',
      'למתחילים',
      'הסבר',
      'הבדל',
      'יתרונות',
    ],
    sq: [
      'si',
      'çfarë',
      'më i mirë',
      'më të mirët',
      'udhëzues',
      'tutorial',
      'këshilla',
      'krahasim',
      'vs',
      'pse',
      'kur',
      'ku',
      'shqyrtim',
      'i plotë',
      'hap pas hapi',
      'fillestarë',
      'shpjeguar',
      'ndryshim',
      'përfitime',
    ],
    az: [
      'necə',
      'nə',
      'ən yaxşı',
      'bələdçi',
      'dərslik',
      'məsləhətlər',
      'müqayisə',
      'vs',
      'niyə',
      'nə vaxt',
      'harada',
      'nəzərdən keçirmə',
      'tam',
      'addım-addım',
      'başlayanlar',
      'izah',
      'fərq',
      'faydalar',
    ],
    bn: [
      'কিভাবে',
      'কি',
      'সেরা',
      'গাইড',
      'টিউটোরিয়াল',
      'টিপস',
      'তুলনা',
      'vs',
      'কেন',
      'কখন',
      'কোথায়',
      'পর্যালোচনা',
      'সম্পূর্ণ',
      'ধাপে ধাপে',
      'শিক্ষানবিস',
      'ব্যাখ্যা',
      'পার্থক্য',
      'সুবিধা',
    ],
    hy: [
      'ինչպես',
      'ինչ',
      'լավագույն',
      'ուղեցույց',
      'ձեռնարկ',
      'խորհուրդներ',
      'համեմատություն',
      'vs',
      'ինչու',
      'երբ',
      'որտեղ',
      'ակնարկ',
      'ամբողջական',
      'քայլ առ քայլ',
      'սկսնակների',
      'բացատրված',
      'տարբերություն',
      'առավելություններ',
    ],
    bs: [
      'kako',
      'šta',
      'najbolji',
      'vodič',
      'tutorial',
      'savjeti',
      'uporediti',
      'vs',
      'zašto',
      'kada',
      'gdje',
      'recenzija',
      'potpuni',
      'korak po korak',
      'početnici',
      'objašnjeno',
      'razlika',
      'prednosti',
    ],
    bg: [
      'как',
      'какво',
      'най-добър',
      'най-добри',
      'ръководство',
      'урок',
      'съвети',
      'сравнение',
      'vs',
      'защо',
      'кога',
      'къде',
      'преглед',
      'пълен',
      'стъпка по стъпка',
      'начинаещи',
      'обяснено',
      'разлика',
      'предимства',
    ],
    hr: [
      'kako',
      'što',
      'najbolji',
      'vodič',
      'tutorial',
      'savjeti',
      'usporedba',
      'vs',
      'zašto',
      'kada',
      'gdje',
      'recenzija',
      'potpuni',
      'korak po korak',
      'početnici',
      'objašnjeno',
      'razlika',
      'prednosti',
    ],
    cs: [
      'jak',
      'co',
      'nejlepší',
      'průvodce',
      'tutorial',
      'tipy',
      'porovnání',
      'vs',
      'proč',
      'kdy',
      'kde',
      'recenze',
      'úplný',
      'krok za krokem',
      'začátečníci',
      'vysvětleno',
      'rozdíl',
      'výhody',
    ],
    da: [
      'hvordan',
      'hvad',
      'bedste',
      'guide',
      'tutorial',
      'tips',
      'sammenlign',
      'vs',
      'hvorfor',
      'hvornår',
      'hvor',
      'anmeldelse',
      'ultimativ',
      'komplet',
      'trin for trin',
      'begyndere',
      'forklaret',
      'forskel',
      'fordele',
    ],
    et: [
      'kuidas',
      'mis',
      'parim',
      'parimad',
      'juhend',
      'õpetus',
      'nõuanded',
      'võrdlus',
      'vs',
      'miks',
      'millal',
      'kus',
      'arvustus',
      'täielik',
      'samm-sammult',
      'algajad',
      'selgitatud',
      'erinevus',
      'eelised',
    ],
    fi: [
      'miten',
      'mikä',
      'paras',
      'parhaat',
      'opas',
      'ohje',
      'vinkit',
      'vertailu',
      'vs',
      'miksi',
      'milloin',
      'missä',
      'arvostelu',
      'täydellinen',
      'vaihe vaiheelta',
      'aloittelijat',
      'selitetty',
      'ero',
      'edut',
    ],
    el: [
      'πώς',
      'τι',
      'καλύτερος',
      'καλύτεροι',
      'οδηγός',
      'εκπαίδευση',
      'συμβουλές',
      'σύγκριση',
      'vs',
      'γιατί',
      'πότε',
      'πού',
      'κριτική',
      'πλήρης',
      'βήμα προς βήμα',
      'αρχάριοι',
      'εξηγημένο',
      'διαφορά',
      'πλεονεκτήματα',
    ],
    hu: [
      'hogyan',
      'mi',
      'legjobb',
      'útmutató',
      'bemutató',
      'tippek',
      'összehasonlítás',
      'vs',
      'miért',
      'mikor',
      'hol',
      'vélemény',
      'teljes',
      'lépésről lépésre',
      'kezdőknek',
      'magyarázat',
      'különbség',
      'előnyök',
    ],
    lv: [
      'kā',
      'kas',
      'labākais',
      'labākie',
      'ceļvedis',
      'apmācība',
      'padomi',
      'salīdzinājums',
      'vs',
      'kāpēc',
      'kad',
      'kur',
      'pārskats',
      'pilnīgs',
      'soli pa solim',
      'iesācējiem',
      'paskaidrots',
      'atšķirība',
      'priekšrocības',
    ],
    lt: [
      'kaip',
      'kas',
      'geriausias',
      'geriausi',
      'vadovas',
      'pamoka',
      'patarimai',
      'palyginimas',
      'vs',
      'kodėl',
      'kada',
      'kur',
      'apžvalga',
      'pilnas',
      'žingsnis po žingsnio',
      'pradedantiesiems',
      'paaiškinta',
      'skirtumas',
      'privalumai',
    ],
    ro: [
      'cum',
      'ce',
      'cel mai bun',
      'ghid',
      'tutorial',
      'sfaturi',
      'comparație',
      'vs',
      'de ce',
      'când',
      'unde',
      'recenzie',
      'complet',
      'pas cu pas',
      'începători',
      'explicat',
      'diferență',
      'beneficii',
    ],
    nb: [
      'hvordan',
      'hva',
      'beste',
      'guide',
      'veiledning',
      'tips',
      'sammenligning',
      'vs',
      'hvorfor',
      'når',
      'hvor',
      'anmeldelse',
      'fullstendig',
      'trinn for trinn',
      'nybegynnere',
      'forklart',
      'forskjell',
      'fordeler',
    ],
    sr: [
      'kako',
      'šta',
      'najbolji',
      'vodič',
      'tutorijal',
      'saveti',
      'poređenje',
      'vs',
      'zašto',
      'kada',
      'gde',
      'recenzija',
      'potpun',
      'korak po korak',
      'početnike',
      'objašnjeno',
      'razlika',
      'prednosti',
    ],
    sk: [
      'ako',
      'čo',
      'najlepší',
      'najlepšie',
      'sprievodca',
      'tutoriál',
      'tipy',
      'porovnanie',
      'vs',
      'prečo',
      'kedy',
      'kde',
      'recenzia',
      'úplný',
      'krok za krokom',
      'začiatočníci',
      'vysvetlené',
      'rozdiel',
      'výhody',
    ],
    sl: [
      'kako',
      'kaj',
      'najboljši',
      'najboljše',
      'vodnik',
      'vadnica',
      'nasveti',
      'primerjava',
      'vs',
      'zakaj',
      'kdaj',
      'kje',
      'ocena',
      'popoln',
      'korak za korakom',
      'začetniki',
      'razloženo',
      'razlika',
      'prednosti',
    ],
    sv: [
      'hur',
      'vad',
      'bäst',
      'bästa',
      'guide',
      'handledning',
      'tips',
      'jämförelse',
      'vs',
      'varför',
      'när',
      'var',
      'recension',
      'komplett',
      'steg för steg',
      'nybörjare',
      'förklarat',
      'skillnad',
      'fördelar',
    ],
    th: [
      'วิธี',
      'อะไร',
      'ดีที่สุด',
      'คู่มือ',
      'บทแนะนำ',
      'เคล็ดลับ',
      'เปรียบเทียบ',
      'vs',
      'ทำไม',
      'เมื่อไหร่',
      'ที่ไหน',
      'รีวิว',
      'สมบูรณ์',
      'ทีละขั้นตอน',
      'มือใหม่',
      'อธิบาย',
      'ความแตกต่าง',
      'ประโยชน์',
    ],
    tr: [
      'nasıl',
      'ne',
      'en iyi',
      'rehber',
      'eğitim',
      'ipuçları',
      'karşılaştırma',
      'vs',
      'neden',
      'ne zaman',
      'nerede',
      'inceleme',
      'tam',
      'adım adım',
      'başlayanlar',
      'açıklama',
      'fark',
      'faydalar',
    ],
    uk: [
      'як',
      'що',
      'найкращий',
      'найкращі',
      'посібник',
      'підручник',
      'поради',
      'порівняння',
      'vs',
      'чому',
      'коли',
      'де',
      'огляд',
      'повний',
      'крок за кроком',
      'для початківців',
      'пояснено',
      'різниця',
      'переваги',
    ],
    mk: [
      'како',
      'што',
      'најдобар',
      'најдобри',
      'водич',
      'туторијал',
      'совети',
      'споредба',
      'vs',
      'зошто',
      'кога',
      'каде',
      'преглед',
      'целосен',
      'чекор по чекор',
      'почетници',
      'објаснето',
      'разлика',
      'предности',
    ],
  };

  return keywordsMap[languageCode] ?? keywordsMap['en']!; // Default to English if language not found
};

/**
 * Maps country ISO codes to informational keywords for blog post content
 * Returns keywords tailored for informational content like how-to guides, comparisons, etc.
 * @param countryCode - Two-letter ISO country code (e.g., "US", "GB")
 * @returns Array of informational keywords in the country's primary language
 */
export const getInformationalKeywords = (countryCodeISO: string): string[] => {
  const languageCode = getLanguageCode(countryCodeISO);
  return getInformationalKeywordsByLanguage(languageCode);
};
