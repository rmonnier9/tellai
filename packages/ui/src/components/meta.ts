export type PurchaseOptions = {
  email?: string;
  value?: number;
  currency?: string;
  external_id?: string; // External ID of the customer
  transaction_id?: string; // Transaction ID / Order ID
  phone_number?: string;
};

export type PageViewOptions = {
  email?: string;
  external_id?: string;
};

type MetaEventOptions = {
  em?: string; // email
  external_id?: string | number;
  value?: number;
  currency?: string;
};

// Meta/Facebook Pixel Helpers
export const pageView = (options = {} as PageViewOptions) => {
  if (process.env.NEXT_PUBLIC_META_PIXEL_ID && (window as any)?.fbq) {
    (window as any)?.fbq?.('track', 'PageView', {
      em: options.email,
      external_id: options.external_id,
    } as MetaEventOptions);
  }
};

// https://developers.facebook.com/docs/facebook-pixel/advanced/
export const event = (name: string, options = {} as MetaEventOptions) => {
  if (process.env.NEXT_PUBLIC_META_PIXEL_ID && (window as any)?.fbq) {
    (window as any)?.fbq?.('track', name, options);
  }
};

export const purchase = (options = {} as PurchaseOptions) => {
  try {
    // https://developers.facebook.com/docs/meta-pixel/implementation/conversion-tracking#object-properites
    event('Purchase', {
      value: options.value,
      currency: options.currency,
    });
  } catch (err) {
    console.warn(err);
  }
};
