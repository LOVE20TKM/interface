'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';

// UI components
import Header from '@/src/components/Header';
import LiquidityQueryPanel from '@/src/components/Dex/LiquidityQuery';

export default function LiquidityQueryPage() {
  const router = useRouter();

  return (
    <>
      <Header title="流动性查询" showBackButton={true} />
      <main className="flex-grow px-3 sm:px-0">
        <div className="w-full max-w-2xl mx-auto">
          <LiquidityQueryPanel />
        </div>
      </main>
    </>
  );
}
