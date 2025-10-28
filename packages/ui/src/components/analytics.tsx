'use client';
import React, { useEffect } from 'react';
import { init } from '@workspace/lib/use-analytics';

type Props = {};

function Analytics({}: Props) {
  useEffect(() => {
    init();
  }, []);

  return null;
}

export default Analytics;
