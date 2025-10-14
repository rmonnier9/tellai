"use client";

import { useEffect, useState } from "react";

/**
 * Hook to capture and manage Rewardful referral ID
 * The referral ID is set when a visitor arrives through an affiliate link
 * and is used in Stripe checkout sessions
 */
export function useRewardful() {
  const [referralId, setReferralId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).rewardful) {
      (window as any).rewardful("ready", function () {
        const rewardfulReferral = (window as any).Rewardful?.referral;
        if (rewardfulReferral) {
          setReferralId(rewardfulReferral);
        }
        setIsReady(true);
      });
    } else {
      setIsReady(true);
    }
  }, []);

  return { referralId, isReady };
}
