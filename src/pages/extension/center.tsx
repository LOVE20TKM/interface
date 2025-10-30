'use client';

import { useContext } from 'react';
import Header from '@/src/components/Header';
import { TokenContext } from '@/src/contexts/TokenContext';
import { useFactories } from '@/src/hooks/contracts/useLOVE20ExtensionCenter';
import { useExtensionActionsFullData } from '@/src/hooks/composite/useExtensionActionsData';
import FactoryList from '@/src/components/Extension/FactoryList';
import ExtensionActionsList from '@/src/components/Extension/ExtensionActionsList';

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
  } = useExtensionActionsFullData(tokenAddress);

  // 调试日志
  console.log('ExtensionCenter - context:', context);
  console.log('ExtensionCenter - tokenAddress:', tokenAddress);
  console.log('ExtensionCenter - factories:', factories, 'pending:', factoriesPending, 'error:', factoriesError);
  console.log(
    'ExtensionCenter - extensionActionsData:',
    extensionActionsData,
    'pending:',
    extensionsPending,
    'error:',
    extensionsError,
  );

  return (
    <>
      <Header title="扩展中心" />
      <main className="flex-grow container mx-auto px-4 py-6 max-w-4xl">
        <div className="space-y-6">
          {/* 扩展类型列表 */}
          <FactoryList tokenAddress={tokenAddress} factories={factories} isPending={factoriesPending} />

          {/* 扩展行动列表 */}
          <ExtensionActionsList
            tokenAddress={tokenAddress}
            extensionActionsData={extensionActionsData}
            isPending={extensionsPending}
          />
        </div>
      </main>
    </>
  );
}
