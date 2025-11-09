import React from 'react';
import dynamic from 'next/dynamic';

// Disable SSR for PublicSpace since it fetches data client-side
const PublicSpace = dynamic(() => import('../../components/PublicSpace'), {
  ssr: false,
});

export default function PublicSpacePage() {
  return <PublicSpace />;
}