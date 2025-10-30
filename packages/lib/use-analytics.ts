//import Mixpanel class from the SDK
import Clarity from '@microsoft/clarity';
import { sendGAEvent } from '@next/third-parties/google';

// import * as Sentry from "@sentry/react-native";
// import { Mixpanel } from "mixpanel-react-native";
// import PostHog from "posthog-react-native";

export function init() {
  if (process.env.NEXT_PUBLIC_CLARITY_ID) {
    Clarity.init(process.env.NEXT_PUBLIC_CLARITY_ID);
  }
}

export async function identify({ email, id }: { email?: string; id: string }) {
  // if (process.env.EXPO_PUBLIC_MIXPANEL_TOKEN) {
  //   await mixpanel.identify(id);
  //   if (email) {
  //     mixpanel.getPeople().setOnce("email", email);
  //   }
  // }

  // if (process.env.EXPO_PUBLIC_SENTRY_DSN) {
  //   try {
  //     Sentry.setUser({ id, email });
  //   } catch (err) {
  //     console.error("Sentry.setUser", err);
  //   }
  // }

  if (process.env.NEXT_PUBLIC_CLARITY_ID) {
    Clarity.identify(id, undefined, undefined, email); // only custom-id is required
  }

  if (process.env.NEXT_PUBLIC_GA_ID) {
    (window as any)?.gtag?.('config', process.env.NEXT_PUBLIC_GA_ID, {
      user_id: id,
    });
  }
}

export async function track(
  event: string,
  properties?: Record<string, unknown>
) {
  if (process.env.NEXT_PUBLIC_CLARITY_ID) {
    Clarity.event(event);
  }

  if (process.env.NEXT_PUBLIC_GA_ID) {
    sendGAEvent('event', event, properties || {});
  }
}

export async function view(name: string) {
  // if (process.env.EXPO_PUBLIC_MIXPANEL_TOKEN) {
  //   try {
  //     mixpanel.track('Screen View', { screen_name: name });
  //   } catch (err) {
  //     console.error(err);
  //   }
  // }

  if (process.env.EXPO_PUBLIC_CLARITY_ID) {
    Clarity.event(name);
  }
}
