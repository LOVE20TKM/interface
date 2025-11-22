'use client';

import { useContext } from 'react';
import Header from '@/src/components/Header';
import { TokenContext } from '@/src/contexts/TokenContext';
import { useFactories } from '@/src/hooks/extension/base/contracts';
import { useExtensionActions } from '@/src/hooks/extension/base/composite/useExtensionActions';
import FactoryList from '@/src/components/Extension/Base/Center/FactoryList';
import ExtensionActionsList from '@/src/components/Extension/Base/Center/ExtensionActionsList';

/**
 * 扩展中心页面
 *
 * 展示工厂列表和扩展行动列表的综合页面
 */
export default function ExtensionCenter() {
  const context = useContext(TokenContext);
  const tokenAddress = context?.token?.address || ('' as `0x${string}`);

  // 获取工厂列表
  const { factories, isPending: factoriesPending, error: factoriesError } = useFactories(tokenAddress);

  // 获取扩展行动数据
  const {
    extensionActionsData,
    isPending: extensionsPending,
    error: extensionsError,
  } = useExtensionActions(tokenAddress);

  return (
    <>
      <Header title="扩展中心" />
      <main className="flex-grow container mx-auto px-4 py-6 max-w-4xl">
        <div className="space-y-6">
          {/* 扩展类型列表 */}
          <FactoryList tokenAddress={tokenAddress} factories={factories} isPending={factoriesPending} />
          {factoriesError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              工厂列表加载失败: {factoriesError.message}
            </div>
          )}

          {/* 扩展行动列表 */}
          <ExtensionActionsList
            tokenAddress={tokenAddress}
            extensionActionsData={extensionActionsData}
            isPending={extensionsPending}
          />
          {extensionsError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              扩展行动加载失败: {extensionsError.message}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
