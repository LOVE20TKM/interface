'use client';

import { useContext } from 'react';

import { TokenContext } from '@/src/contexts/TokenContext';
import Header from '@/src/components/Header';
import LeftTitle from '@/src/components/Common/LeftTitle';
import MyGovernanceAssetsPanel from '@/src/components/My/MyGovernanceAssetsPanel';

/**
 * 取消质押页面
 * 用户可以取消质押SL代币和ST代币
 */
const UnstakePage = () => {
  const { token } = useContext(TokenContext) || {};

  return (
    <>
      <Header title="取消质押" />
      <main className="flex-grow">
        <div className="flex-col items-center px-6 pt-6 pb-2">
          <div className="mb-4">
            <LeftTitle title="取消质押" />
          </div>
          <MyGovernanceAssetsPanel token={token} enableWithdraw={true} />
        </div>
      </main>
    </>
  );
};

export default UnstakePage;

