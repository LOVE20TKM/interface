'use client';

import { useContext } from 'react';
import Header from '@/src/components/Header';
import { TokenContext } from '@/src/contexts/TokenContext';
import { useFactories } from '@/src/hooks/extension/base/contracts';
import FactoryList from '@/src/components/Extension/Base/Center/FactoryList';

/**
 * 扩展工厂列表页面
 * 
 * 显示当前代币支持的所有扩展工厂类型
 */
export default function ExtensionFactoriesPage() {
  const context = useContext(TokenContext);
  const tokenAddress = context?.token?.address || ('' as `0x${string}`);

  // 获取工厂列表
  const { factories, isPending, error } = useFactories(tokenAddress);

  return (
    <>
      <Header title="扩展类别" />
      <main className="flex-grow container mx-auto px-4 py-6 max-w-4xl">
        <FactoryList tokenAddress={tokenAddress} factories={factories} isPending={isPending} />
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            加载失败: {error.message}
          </div>
        )}
      </main>
    </>
  );
}

