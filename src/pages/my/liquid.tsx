'use client';

import Header from '@/src/components/Header';

import MyLiquidDataPanel from '@/src/components/DataPanel/MyLiquidDataPanel';

const MyLiquidPage = () => {
  return (
    <>
      <Header title="我的流动性质押" showBackButton={true} />
      <main className="flex-grow">
        <MyLiquidDataPanel />
      </main>
    </>
  );
};

export default MyLiquidPage;
