'use client';

import Header from '@/src/components/Header';

import StakedLiquidDataPanel from '@/src/components/DataPanel/StakedLiquidDataPanel';

/**
 * 流动性质押数据页面
 * 显示流动性质押的详细数据
 */
const StakedLiquidDataPage = () => {
  return (
    <>
      <Header title="流动性质押数据" showBackButton={true} />
      <main className="flex-grow">
        <StakedLiquidDataPanel />
      </main>
    </>
  );
};

export default StakedLiquidDataPage;

