'use client';
import React, { useEffect } from 'react';
import { init, identify } from '@workspace/lib/use-analytics';
import { client } from '@workspace/auth/client';

type Props = {};

function Analytics({}: Props) {
  useEffect(() => {
    init();
  }, []);

  return null;
}

export const AnalyticsIdentify = () => {
  const session = client.useSession();

  useEffect(() => {
    if (session.data?.user) {
      identify({
        email: session.data.user.email,
        id: session.data.user.id,
      });
    }
  }, [session.data?.user?.email]);

  return null;
};

export default Analytics;
