'use client';

import Header from '@/src/components/Header';

import StakedLiquidDataPanel from '@/src/components/DataPanel/StakedLiquidDataPanel';

const ActingPage = () => {
  return (
    <>
      <Header title="流动性质押数据" showBackButton={true} />
      <main className="flex-grow">
        <StakedLiquidDataPanel />
      </main>
    </>
  );
};

export default ActingPage;
